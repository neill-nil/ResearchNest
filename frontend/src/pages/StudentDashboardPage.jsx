import React, { useState, useEffect, useMemo } from 'react';
import {
  getStudentDashboard,
  createTask,
  deleteTask,
  createSubtask,
  deleteSubtask,
  updateTask,
  updateSubtask,
} from '../services/api';
import Toast from '../components/Toast';
import '../components/Toast.css';
import '../styles/Dashboard.css';

const transformData = (backendData) => {
  if (!backendData || !Array.isArray(backendData.milestones)) return { milestones: [] };

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
      notes: m.Notes || [],
    }));

  return { ...backendData, milestones: transformMilestones(backendData.milestones) };
};

const StudentDashboardPage = ({ user }) => {
  const [studentData, setStudentData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemNames, setNewItemNames] = useState({});
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

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

  const taskSummary = useMemo(() => {
    const stats = { total: 0, completed: 0, inProgress: 0, pending: 0 };
    if (!studentData) return stats;

    studentData.milestones.forEach((m) =>
      m.stages.forEach((st) =>
        st.tasks.forEach((t) => {
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
        })
      )
    );
    return stats;
  }, [studentData]);

  const handleInputChange = (id, value) => {
    setNewItemNames((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreateTask = async (stageId) => {
    const name = newItemNames[stageId] || '';
    if (!name.trim()) return;
    const { error } = await createTask({ stage_id: stageId, name });
    if (error) pushToast(error, 'error');
    else pushToast('Task created', 'success');
    refreshData();
  };

  const handleDeleteTask = async (taskId) => {
    const { error } = await deleteTask(taskId);
    if (error) pushToast(error, 'error');
    else pushToast('Task deleted', 'success');
    refreshData();
  };

  const handleTaskUpdate = async (taskId, updates) => {
    const { error } = await updateTask(taskId, updates);
    if (error) pushToast(error, 'error');
    else pushToast('Task updated', 'success');
    refreshData();
  };

  const handleCreateSubtask = async (taskId) => {
    const name = newItemNames[taskId] || '';
    if (!name.trim()) return;
    const { error } = await createSubtask({ task_id: taskId, name });
    if (error) pushToast(error, 'error');
    else pushToast('Subtask created', 'success');
    refreshData();
  };

  const handleDeleteSubtask = async (subtaskId) => {
    const { error } = await deleteSubtask(subtaskId);
    if (error) pushToast(error, 'error');
    else pushToast('Subtask deleted', 'success');
    refreshData();
  };

  const handleSubtaskUpdate = async (subtaskId, updates) => {
    const { error } = await updateSubtask(subtaskId, updates);
    if (error) pushToast(error, 'error');
    else pushToast('Subtask updated', 'success');
    refreshData();
  };

  if (loading) return <div className="loading-indicator">Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {user.name}</h1>
        <p className="dashboard-subtitle">Track your academic progress below.</p>
      </header>

      {/* Summary Section */}
      {summary && (
        <div className="summary-card">
          <h3>Milestone Summary</h3>
          <div className="summary-grid">
            <div className="summary-item"><span>{summary.milestones.total}</span> Total</div>
            <div className="summary-item"><span>{summary.milestones.byStatus.Completed || 0}</span> Completed</div>
            <div className="summary-item"><span>{summary.milestones.byStatus['In Progress'] || 0}</span> In Progress</div>
            <div className="summary-item"><span>{summary.milestones.byStatus['Pending Approval'] || 0}</span> Pending</div>
          </div>

          <h3 className="summary-header-secondary">Task Summary</h3>
          <div className="summary-grid">
            <div className="summary-item"><span>{taskSummary.total}</span> Total</div>
            <div className="summary-item"><span>{taskSummary.completed}</span> Completed</div>
            <div className="summary-item"><span>{taskSummary.inProgress}</span> In Progress</div>
            <div className="summary-item"><span>{taskSummary.pending}</span> Pending</div>
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="milestones-list">
        {studentData.milestones.map((m) => (
          <div key={m.id} className="milestone-card">
            <div className="milestone-header">
              <h3>{m.title}</h3>
              <span className="status-badge">{m.status}</span>
            </div>

            {m.stages.map((st) => (
              <div key={st.id} className="stage-block">
                <div className="stage-row">
                  <h4 className="stage-title">{st.title}</h4>
                  <span className="status-badge">{st.status}</span>
                </div>

                {/* Tasks */}
                <div className="task-list">
                  {st.tasks.map((t) => (
                    <div key={t.id} className="task-item">
                      <div className="task-header">
                        <input
                          type="text"
                          value={t.title}
                          onChange={(e) => handleTaskUpdate(t.id, { name: e.target.value })}
                          className="editable-input"
                        />
                        <select
                          value={t.status}
                          onChange={(e) => handleTaskUpdate(t.id, { status: e.target.value })}
                          className="status-select"
                        >
                          <option value="Locked">Locked</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <button
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => handleDeleteTask(t.id)}
                        >
                          Delete Task
                        </button>
                      </div>

                      {/* Subtasks */}
                      <div className="subtask-list">
                        {t.subtasks.map((sub) => (
                          <div key={sub.id} className="subtask-item">
                            <input
                              type="text"
                              value={sub.title}
                              onChange={(e) => handleSubtaskUpdate(sub.id, { name: e.target.value })}
                              className="editable-input"
                            />
                            <select
                              value={sub.status}
                              onChange={(e) => handleSubtaskUpdate(sub.id, { status: e.target.value })}
                              className="status-select"
                            >
                              <option value="Locked">Locked</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                            <button
                              className="btn-icon"
                              onClick={() => handleDeleteSubtask(sub.id)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Subtask */}
                      <div className="add-item-form">
                        <input
                          type="text"
                          placeholder="New subtask..."
                          value={newItemNames[t.id] || ''}
                          onChange={(e) => handleInputChange(t.id, e.target.value)}
                        />
                        <button
                          className="btn secondary btn-sm"
                          onClick={() => handleCreateSubtask(t.id)}
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
                    placeholder="New task..."
                    value={newItemNames[st.id] || ''}
                    onChange={(e) => handleInputChange(st.id, e.target.value)}
                  />
                  <button
                    className="btn primary"
                    onClick={() => handleCreateTask(st.id)}
                  >
                    Add Task
                  </button>
                </div>
              </div>
            ))}

            {/* Faculty Notes */}
            {m.notes.length > 0 && (
              <div className="notes-section">
                <h5>Faculty Notes</h5>
                <ul>
                  {m.notes.map((note) => (
                    <li key={note.note_id}>
                      <p>{note.note}</p>
                      <span className="note-meta">{note.created_at}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default StudentDashboardPage;
