import React, { useState, useEffect } from 'react';
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

const transformData = (backendData) => {
  if (!backendData || !Array.isArray(backendData.milestones)) {
    return { ...backendData, milestones: [] };
  }

  const transformSubtasks = (subtasks = []) =>
    subtasks.map(sub => ({ id: sub.subtask_id, title: sub.name, status: sub.status }));

  const transformTasks = (tasks = []) =>
    tasks.map(task => ({ id: task.task_id, title: task.name, status: task.status, subtasks: transformSubtasks(task.Subtasks) }));

  const transformStages = (stages = []) =>
    stages.map(stage => ({ id: stage.stage_id, title: stage.name, status: stage.status, tasks: transformTasks(stage.Tasks) }));

  const transformMilestones = (milestones = []) =>
    milestones.map(milestone => ({ id: milestone.milestone_id, title: milestone.name, status: milestone.status, stages: transformStages(milestone.Stages) }));

  return { ...backendData, milestones: transformMilestones(backendData.milestones) };
};

const StudentDashboardPage = ({ user }) => {
  const [studentData, setStudentData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
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

  const refreshData = async () => {
    const { progress, summary, notes } = await getStudentDashboard(user.id);
    setStudentData(transformData(progress));
    setSummary(summary);
    setNotes(notes);
  };

  const handleStatusChange = async (path, newStatus) => {
    const subtask = studentData.milestones[path.milestoneIndex]
      .stages[path.stageIndex]
      .tasks[path.taskIndex]
      .subtasks[path.subtaskIndex];
    await updateSubtaskStatus(subtask.id, newStatus);
    refreshData();
  };

  const handleCreateTask = async (stageId) => {
    if (!newTaskName.trim()) return;
    await createTask({ stage_id: stageId, name: newTaskName });
    refreshData();
    setNewTaskName('');
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    refreshData();
  };

  const handleCreateSubtask = async (taskId) => {
    if (!newSubtaskName.trim()) return;
    await createSubtask({ task_id: taskId, name: newSubtaskName });
    refreshData();
    setNewSubtaskName('');
  };

  const handleDeleteSubtask = async (subtaskId) => {
    await deleteSubtask(subtaskId);
    refreshData();
  };

  const handleAddNote = async (milestoneId) => {
    if (!newNote.trim()) return;
    await createNote({ student_id: user.id, milestone_id: milestoneId, note: newNote });
    refreshData();
    setNewNote('');
  };

  if (loading) return <div>Loading student data...</div>;

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user.name}</h2>
      {summary && (
        <div className="summary-section">
          <h3>Progress Summary</h3>
          <ul>
            <li>Total milestones: {summary.totalMilestones}</li>
            <li>Completed: {summary.completedMilestones}</li>
            <li>In Progress: {summary.inProgressMilestones}</li>
            <li>Pending Approval: {summary.pendingApprovalMilestones}</li>
          </ul>
        </div>
      )}

      <div className="milestones-container">
        {studentData.milestones.map((m) => (
          <div key={m.id} className="milestone-wrapper">
            <Milestone milestone={m} onStatusChange={handleStatusChange} isAdmin={false} />
            {m.stages.map((st) => (
              <div key={st.id} className="stage-block">
                <input
                  type="text"
                  placeholder="Task name..."
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
                <button onClick={() => handleCreateTask(st.id)}>Add Task</button>
                {st.tasks.map((t) => (
                  <div key={t.id}>
                    {t.title}
                    <button onClick={() => handleDeleteTask(t.id)}>Delete Task</button>
                    <input
                      type="text"
                      placeholder="Subtask name..."
                      value={newSubtaskName}
                      onChange={(e) => setNewSubtaskName(e.target.value)}
                    />
                    <button onClick={() => handleCreateSubtask(t.id)}>Add Subtask</button>
                    {t.subtasks.map((sub) => (
                      <div key={sub.id}>
                        {sub.title} ({sub.status})
                        <button onClick={() => handleDeleteSubtask(sub.id)}>Delete</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {/* Notes */}
            <div className="notes-section">
              <input
                type="text"
                placeholder="Add note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button onClick={() => handleAddNote(m.id)}>Add Note</button>
            </div>
          </div>
        ))}
      </div>

      {/* Existing Notes */}
      {notes.length > 0 && (
        <div className="notes-section">
          <h3>Faculty Notes</h3>
          <ul>
            {notes.map((note) => (
              <li key={note.note_id}>{note.note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StudentDashboardPage;
