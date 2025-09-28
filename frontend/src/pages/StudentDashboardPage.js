import React, { useState, useEffect, useMemo } from 'react'; // 👈 1. Import useMemo
import {
  getStudentDashboard,
  updateSubtaskStatus,
  createTask,
  deleteTask,
  createSubtask,
  deleteSubtask,
  createNote
} from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

// The transformData function remains the same.
const transformData = (backendData) => {
    if (!backendData || !Array.isArray(backendData.milestones)) {
      return { ...backendData, milestones: [] };
    }
    const transformSubtasks = (subtasks = []) => subtasks.map(sub => ({ id: sub.subtask_id, title: sub.name, status: sub.status }));
    const transformTasks = (tasks = []) => tasks.map(task => ({ id: task.task_id, title: task.name, status: task.status, subtasks: transformSubtasks(task.Subtasks) }));
    const transformStages = (stages = []) => stages.map(stage => ({ id: stage.stage_id, title: stage.name, status: stage.status, tasks: transformTasks(stage.Tasks) }));
    const transformMilestones = (milestones = []) => milestones.map(milestone => ({ id: milestone.milestone_id, title: milestone.name, status: milestone.status, stages: transformStages(milestone.Stages) }));
    return { ...backendData, milestones: transformMilestones(backendData.milestones) };
};

const StudentDashboardPage = ({ user }) => {
  const [studentData, setStudentData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemNames, setNewItemNames] = useState({});

  useEffect(() => {
    // This useEffect hook remains the same
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const { progress, summary, notes } = await getStudentDashboard(user.id);
        setStudentData(transformData(progress));
        setSummary(summary);
        setNotes(notes);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  // 👇 2. Add this useMemo hook to calculate task stats
  const taskSummary = useMemo(() => {
    const stats = { total: 0, completed: 0, inProgress: 0, pending: 0 };
    if (!studentData) return stats;

    studentData.milestones.forEach(milestone => {
      milestone.stages.forEach(stage => {
        stage.tasks.forEach(task => {
          stats.total++;
          // IMPORTANT: Adjust these status strings if your backend uses different ones
          switch (task.status) {
            case 'Completed':
              stats.completed++;
              break;
            case 'In Progress':
              stats.inProgress++;
              break;
            case 'Pending Approval':
              stats.pending++;
              break;
            default:
              break;
          }
        });
      });
    });
    return stats;
  }, [studentData]); // This will only recalculate when studentData changes

  // ... (all handler functions like refreshData, handleStatusChange, etc. remain the same)
  const handleInputChange = (id, value) => { setNewItemNames(prev => ({ ...prev, [id]: value })); };
  const refreshData = async () => { const { progress, summary, notes } = await getStudentDashboard(user.id); setStudentData(transformData(progress)); setSummary(summary); setNotes(notes); setNewItemNames({}); };
  const handleStatusChange = async (path, newStatus) => { const subtask = studentData.milestones[path.milestoneIndex].stages[path.stageIndex].tasks[path.taskIndex].subtasks[path.subtaskIndex]; await updateSubtaskStatus(subtask.id, newStatus); refreshData(); };
  const handleCreateTask = async (stageId) => { const taskName = newItemNames[stageId] || ''; if (!taskName.trim()) return; await createTask({ stage_id: stageId, name: taskName }); refreshData(); };
  const handleDeleteTask = async (taskId) => { await deleteTask(taskId); refreshData(); };
  const handleCreateSubtask = async (taskId) => { const subtaskName = newItemNames[taskId] || ''; if (!subtaskName.trim()) return; await createSubtask({ task_id: taskId, name: subtaskName }); refreshData(); };
  const handleDeleteSubtask = async (subtaskId) => { await deleteSubtask(subtaskId); refreshData(); };
  const handleAddNote = async (milestoneId) => { const noteText = newItemNames[`note_${milestoneId}`] || ''; if (!noteText.trim()) return; await createNote({ student_id: user.id, milestone_id: milestoneId, note: noteText }); refreshData(); };

  if (loading) return <div className="loading-indicator">Loading student data...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {user.name}</h1>
        <p className="dashboard-subtitle">Here is your research progress overview.</p>
      </header>
      
      {summary && (
        <div className="summary-card">
          {/* --- Milestone Summary (Existing) --- */}
          <h3>Milestone Summary</h3>
          <div className="summary-grid">
            <div className="summary-item"><span>{summary.totalMilestones}</span> Total</div>
            <div className="summary-item"><span>{summary.completedMilestones}</span> Completed</div>
            <div className="summary-item"><span>{summary.inProgressMilestones}</span> In Progress</div>
            <div className="summary-item"><span>{summary.pendingApprovalMilestones}</span> Pending Approval</div>
          </div>
          
          {/* 👇 3. Add the new Task Summary section here --- */}
          <h3 className="summary-header-secondary">Task Summary</h3>
          <div className="summary-grid">
             <div className="summary-item"><span>{taskSummary.total}</span> Total Tasks</div>
             <div className="summary-item"><span>{taskSummary.completed}</span> Completed</div>
             <div className="summary-item"><span>{taskSummary.inProgress}</span> In Progress</div>
             <div className="summary-item"><span>{taskSummary.pending}</span> Pending Approval</div>
          </div>
        </div>
      )}

      {/* ... (rest of the component JSX remains the same) ... */}
       <div className="milestones-list">
        {studentData.milestones.map((milestone) => (
          <div key={milestone.id} className="milestone-card">
            <Milestone milestone={milestone} onStatusChange={handleStatusChange} isAdmin={false} />
            {milestone.stages.map((stage) => (
              <div key={stage.id} className="stage-block">
                <h4>{stage.title}</h4>
                <div className="task-list">
                  {stage.tasks.map((task) => (
                    <div key={task.id} className="task-item">
                      <div className="task-header">
                        <span>{task.title}</span>
                        <button onClick={() => handleDeleteTask(task.id)} className="btn btn-danger-outline btn-sm">Delete Task</button>
                      </div>
                      <div className="subtask-list">
                        {task.subtasks.map((sub) => (
                          <div key={sub.id} className="subtask-item">
                             {sub.title} ({sub.status})
                             <button onClick={() => handleDeleteSubtask(sub.id)} className="btn-icon">&#x2715;</button>
                          </div>
                        ))}
                      </div>
                      <div className="add-item-form"><input type="text" placeholder="Add a new subtask..." value={newItemNames[task.id] || ''} onChange={(e) => handleInputChange(task.id, e.target.value)} /><button onClick={() => handleCreateSubtask(task.id)} className="btn btn-secondary btn-sm">Add Subtask</button></div>
                    </div>
                  ))}
                </div>
                <div className="add-item-form"><input type="text" placeholder="Add a new task..." value={newItemNames[stage.id] || ''} onChange={(e) => handleInputChange(stage.id, e.target.value)} /><button onClick={() => handleCreateTask(stage.id)} className="btn btn-primary">Add Task</button></div>
              </div>
            ))}
            <div className="notes-section">
              <h5>Add a Note for this Milestone</h5>
               <div className="add-item-form"><input type="text" placeholder="Your note..." value={newItemNames[`note_${milestone.id}`] || ''} onChange={(e) => handleInputChange(`note_${milestone.id}`, e.target.value)} /><button onClick={() => handleAddNote(milestone.id)} className="btn btn-secondary">Add Note</button></div>
            </div>
          </div>
        ))}
      </div>
      {notes.length > 0 && (<div className="notes-card"><h3>Faculty Notes</h3><ul>{notes.map((note) => (<li key={note.note_id}><p>{note.note}</p><span className="note-meta">From: {note.faculty_name || 'Faculty'}</span></li>))}</ul></div>)}
    </div>
  );
};

export default StudentDashboardPage;