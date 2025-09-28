import React, { useState, useEffect, useMemo } from 'react';
import {
  getStudentDashboard,
  updateSubtaskStatus,
  createTask,
  deleteTask,
  updateTask,       // ✅ make sure this is in api.js
  createSubtask,
  deleteSubtask,
  createNote,
} from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

// --- Transform backend data ---
const transformData = (backendData) => {
  if (!backendData || !Array.isArray(backendData.milestones))
    return { ...backendData, milestones: [] };

  const transformSubtasks = (subtasks = []) =>
    subtasks.map((sub) => ({
      id: sub.subtask_id,
      title: sub.name,
      status: sub.status,
    }));

  const transformTasks = (tasks = []) =>
    tasks.map((task) => ({
      id: task.task_id,
      title: task.name,
      status: task.status,
      subtasks: transformSubtasks(task.Subtasks),
    }));

  const transformStages = (stages = []) =>
    stages.map((stage) => ({
      id: stage.stage_id,
      title: stage.name,
      status: stage.status,
      tasks: transformTasks(stage.Tasks),
    }));

  const transformMilestones = (milestones = []) =>
    milestones.map((m) => ({
      id: m.milestone_id,
      title: m.name,
      status: m.status,
      stages: transformStages(m.Stages),
    }));

  return { ...backendData, milestones: transformMilestones(backendData.milestones) };
};

const StudentDashboardPage = ({ user }) => {
  const [studentData, setStudentData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemNames, setNewItemNames] = useState({});

  // --- Fetch Dashboard ---
  const refreshData = async () => {
    const { progress, summary, notes } = await getStudentDashboard(user.id);
    setStudentData(transformData(progress));
    setSummary(summary);
    setNotes(notes);
    setNewItemNames({});
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        await refreshData();
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  // --- Task summary (useMemo for performance) ---
  const taskSummary = useMemo(() => {
    const stats = { total: 0, completed: 0, inProgress: 0, pending: 0 };
    if (!studentData) return stats;

    studentData.milestones.forEach((m) => {
      m.stages.forEach((s) => {
        s.tasks.forEach((t) => {
          stats.total++;
          switch (t.status) {
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
  }, [studentData]);

  // --- Handlers ---
  const handleInputChange = (id, value) => {
    setNewItemNames((prev) => ({ ...prev, [id]: value }));
  };

  const handleStatusChange = async (path, newStatus) => {
    const subtask =
      studentData.milestones[path.milestoneIndex].stages[path.stageIndex].tasks[
        path.taskIndex
      ].subtasks[path.subtaskIndex];
    await updateSubtaskStatus(subtask.id, newStatus);
    refreshData();
  };

  const handleCreateTask = async (stageId) => {
    const taskName = newItemNames[stageId] || '';
    if (!taskName.trim()) return;
    await createTask({ stage_id: stageId, name: taskName });
    refreshData();
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    refreshData();
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
    await updateTask(task.id, { status: newStatus }); // ✅ call backend
    refreshData();
  };

  const handleCreateSubtask = async (taskId) => {
    const subtaskName = newItemNames[taskId] || '';
    if (!subtaskName.trim()) return;
    await createSubtask({ task_id: taskId, name: subtaskName });
    refreshData();
  };

  const handleDeleteSubtask = async (subtaskId) => {
    await deleteSubtask(subtaskId);
    refreshData();
  };

  const handleAddNote = async (milestoneId) => {
    const noteText = newItemNames[`note_${milestoneId}`] || '';
    if (!noteText.trim()) return;
    await createNote({
      student_id: user.id,
      milestone_id: milestoneId,
      note: noteText,
    });
    refreshData();
  };

  if (loading) return <div className="loading-indicator">Loading student data...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {user.name}</h1>
        <p className="dashboard-subtitle">Here is your research progress overview.</p>
      </header>

      {summary && (
        <div className="summary-card">
          <h3>Milestone Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span>{summary.totalMilestones}</span> Total
            </div>
            <div className="summary-item">
              <span>{summary.completedMilestones}</span> Completed
            </div>
            <div className="summary-item">
              <span>{summary.inProgressMilestones}</span> In Progress
            </div>
            <div className="summary-item">
              <span>{summary.pendingApprovalMilestones}</span> Pending Approval
            </div>
          </div>

          <h3 className="summary-header-secondary">Task Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span>{taskSummary.total}</span> Total Tasks
            </div>
            <div className="summary-item">
              <span>{taskSummary.completed}</span> Completed
            </div>
            <div className="summary-item">
              <span>{taskSummary.inProgress}</span> In Progress
            </div>
            <div className="summary-item">
              <span>{taskSummary.pending}</span> Pending Approval
            </div>
          </div>
        </div>
      )}

      {/* --- Milestones, Stages, Tasks --- */}
      <div className="milestones-list">
        {studentData.milestones.map((milestone) => (
          <div key={milestone.id} className="milestone-card">
            <Milestone
              milestone={milestone}
              onStatusChange={handleStatusChange}
              isAdmin={false}
            />

            {milestone.stages.map((stage) => (
              <div key={stage.id} className="stage-block">
                <h4>{stage.title}</h4>

                <div className="task-list">
                  {stage.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`task-item ${
                        task.status === 'Completed' ? 'task-completed' : ''
                      }`}
                    >
                      <div className="task-header">
                        <label>
                          <input
                            type="checkbox"
                            checked={task.status === 'Completed'}
                            onChange={() => handleToggleTask(task)}
                          />
                          <span>{task.title}</span>
                        </label>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn btn-danger-outline btn-sm"
                        >
                          Delete Task
                        </button>
                      </div>

                      {/* Subtasks */}
                      <div className="subtask-list">
                        {task.subtasks.map((sub) => (
                          <div key={sub.id} className="subtask-item">
                            {sub.title} ({sub.status})
                            <button
                              onClick={() => handleDeleteSubtask(sub.id)}
                              className="btn-icon"
                            >
                              &#x2715;
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Subtask */}
                      <div className="add-item-form">
                        <input
                          type="text"
                          placeholder="Add a new subtask..."
                          value={newItemNames[task.id] || ''}
                          onChange={(e) =>
                            handleInputChange(task.id, e.target.value)
                          }
                        />
                        <button
                          onClick={() => handleCreateSubtask(task.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Add Subtask
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Task */}
                <div className="add-item-form">
                  <input
                    type="text"
                    placeholder="Add a new task..."
                    value={newItemNames[stage.id] || ''}
                    onChange={(e) => handleInputChange(stage.id, e.target.value)}
                  />
                  <button
                    onClick={() => handleCreateTask(stage.id)}
                    className="btn btn-primary"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            ))}

            {/* Notes */}
            <div className="notes-section">
              <h5>Add a Note for this Milestone</h5>
              <div className="add-item-form">
                <input
                  type="text"
                  placeholder="Your note..."
                  value={newItemNames[`note_${milestone.id}`] || ''}
                  onChange={(e) =>
                    handleInputChange(`note_${milestone.id}`, e.target.value)
                  }
                />
                <button
                  onClick={() => handleAddNote(milestone.id)}
                  className="btn btn-secondary"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Faculty Notes */}
      {notes.length > 0 && (
        <div className="notes-card">
          <h3>Faculty Notes</h3>
          <ul>
            {notes.map((note) => (
              <li key={note.note_id}>
                <p>{note.note}</p>
                <span className="note-meta">
                  From: {note.faculty_name || 'Faculty'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StudentDashboardPage;
