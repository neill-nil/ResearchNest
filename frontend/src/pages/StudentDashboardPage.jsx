// src/pages/StudentDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import {
  getStudentDashboard,
  createTask,
  deleteTask,
  createSubtask,
  deleteSubtask,
  updateTask,
  updateSubtask,
  updateMilestoneStatus,
  updateStageStatus,
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
      subtasks: transformSubtasks(task.Subtasks || []),
    }));

  const transformStages = (stages = []) =>
    stages.map((stage) => ({
      id: stage.stage_id,
      title: stage.name,
      status: stage.status,
      tasks: transformTasks(stage.Tasks || []),
    }));

  const transformMilestones = (milestones = []) =>
    milestones.map((m) => ({
      id: m.milestone_id,
      title: m.name,
      status: m.status,
      stages: transformStages(m.Stages || []),
      notes: m.Notes || [],
      is_frozen: m.is_frozen || false,
    }));

  return { ...backendData, milestones: transformMilestones(backendData.milestones || []) };
};

const StudentDashboardPage = ({ user }) => {
  const [studentData, setStudentData] = useState({ milestones: [] });
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemNames, setNewItemNames] = useState({});
  const [toasts, setToasts] = useState([]);
  const [busyOps, setBusyOps] = useState({});

  const pushToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  const setBusy = (key, val) => setBusyOps((s) => ({ ...s, [key]: val }));

  const refreshData = async () => {
    const res = await getStudentDashboard(user.id);
    if (res.error) {
      pushToast(res.error, 'error');
      setStudentData({ milestones: [] });
      setSummary(null);
      setNotes([]);
      return;
    }

    const { progress, summary: summ, notes: nd } = res.data;

    setStudentData(transformData(progress || { milestones: [] }));
    setSummary(summ || null);   // ← keep the summary from backend
    setNotes(nd || []);
    setNewItemNames({});
  };


  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleInputChange = (id, value) => setNewItemNames((prev) => ({ ...prev, [id]: value }));

  /* ---------------- Milestone ---------------- */
  const handleMilestoneStatusChange = async (milestoneId, newStatus, currentStatus) => {
    if (currentStatus === 'Locked') {
      pushToast('This milestone is locked and cannot be changed.', 'error');
      return;
    }
    if (user.role === 'student' && (newStatus === 'Open' || newStatus === 'Completed')) {
      pushToast('You are not allowed to set milestone to Open or Completed.', 'error');
      return;
    }
    setBusy(`milestoneStatus:${milestoneId}`, true);
    const { error } = await updateMilestoneStatus(milestoneId, newStatus);
    setBusy(`milestoneStatus:${milestoneId}`, false);
    if (error) pushToast(error, 'error');
    else {
      pushToast('Milestone status updated', 'success');
      await refreshData();
    }
  };

  /* ---------------- Stage ---------------- */
  const handleStageStatusChange = async (stageId, newStatus) => {
    setBusy(`stageStatus:${stageId}`, true);
    const { error } = await updateStageStatus(stageId, newStatus);
    setBusy(`stageStatus:${stageId}`, false);
    if (error) pushToast(error, 'error');
    else {
      pushToast('Stage updated', 'success');
      await refreshData();
    }
  };

  /* ---------------- Tasks ---------------- */
  const handleCreateTask = async (stageId) => {
    const name = (newItemNames[stageId] || '').trim();
    if (!name) {
      pushToast('Task name cannot be empty', 'error');
      return;
    }
    setBusy(`createTask:${stageId}`, true);
    const { error } = await createTask({ stage_id: stageId, name });
    setBusy(`createTask:${stageId}`, false);
    if (error) pushToast(error, 'error');
    else {
      pushToast('Task created', 'success');
      await refreshData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete task? This cannot be undone.')) return;
    setBusy(`deleteTask:${taskId}`, true);
    const { error } = await deleteTask(taskId);
    setBusy(`deleteTask:${taskId}`, false);
    if (error) pushToast(error, 'error');
    else {
      pushToast('Task deleted', 'success');
      await refreshData();
    }
  };

  const handleTaskUpdate = async (taskId, updates) => {
    setBusy(`updateTask:${taskId}`, true);
    const { error } = await updateTask(taskId, updates);
    setBusy(`updateTask:${taskId}`, false);
    if (error) pushToast(error, 'error');
    else {
      pushToast('Task updated', 'success');
      await refreshData();
    }
  };

  /* ---------------- Subtasks ---------------- */
  const handleCreateSubtask = async (taskId) => {
    const name = (newItemNames[taskId] || '').trim();
    if (!name) {
      pushToast('Subtask name cannot be empty', 'error');
      return;
    }
    setBusy(`createSubtask:${taskId}`, true);
    const { error } = await createSubtask({ task_id: taskId, name });
    setBusy(`createSubtask:${taskId}`, false);
    if (error) pushToast(error, 'error');
    else {
      pushToast('Subtask created', 'success');
      await refreshData();
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Delete subtask?')) return;
    setBusy(`deleteSubtask:${subtaskId}`, true);
    const { error } = await deleteSubtask(subtaskId);
    setBusy(`deleteSubtask:${subtaskId}`, false);
    if (error) pushToast(error, 'error');
    else {
      pushToast('Subtask deleted', 'success');
      await refreshData();
    }
  };

  const handleSubtaskUpdate = async (subtaskId, updates) => {
    setBusy(`updateSubtask:${subtaskId}`, true);
    const { error } = await updateSubtask(subtaskId, updates);
    setBusy(`updateSubtask:${subtaskId}`, false);
    if (error) pushToast(error, 'error');
    else {
      pushToast('Subtask updated', 'success');
      await refreshData();
    }
  };

  if (loading) return <div className="loading-indicator">Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <p className="dashboard-subtitle">Track your academic progress below.</p>
      </div>

      {/* Toasts */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Summary */}
      {summary && (
      <div className="summary-card card-block">
        <h3 className="summary-heading">Progress Summary</h3>
        <div className="summary-grid">
          
          {/* Milestones */}
          <div className="summary-section">
            <div className="summary-header">
              <span className="summary-label">Milestones</span>
              <span className="summary-total">{summary.milestones?.total || 0}</span>
            </div>
            <ul className="summary-list">
              <li><span className="dot completed"></span>{summary.milestones?.byStatus?.Completed || 0} Completed</li>
              <li><span className="dot progress"></span>{summary.milestones?.byStatus?.['In Progress'] || 0} In Progress</li>
              <li><span className="dot pending"></span>{summary.milestones?.byStatus?.['Pending Approval'] || 0} Pending</li>
              <li><span className="dot locked"></span>{summary.milestones?.byStatus?.Locked || 0} Locked</li>
            </ul>
          </div>

          {/* Stages */}
          <div className="summary-section">
            <div className="summary-header">
              <span className="summary-label">Stages</span>
              <span className="summary-total">{summary.stages?.total || 0}</span>
            </div>
            <ul className="summary-list">
              <li><span className="dot completed"></span>{summary.stages?.byStatus?.Completed || 0} Completed</li>
              <li><span className="dot progress"></span>{summary.stages?.byStatus?.['In Progress'] || 0} In Progress</li>
              <li><span className="dot locked"></span>{summary.stages?.byStatus?.Locked || 0} Locked</li>
            </ul>
          </div>
        </div>
      </div>
    )}




      {/* Milestones */}
      <div className="milestones-list">
        {studentData.milestones.map((m) => (
          <div key={m.id} className="milestone-card card-block">
            <div className="milestone-header">
              <h3>{m.title}</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {user.role === 'student' ? (
                  <select
                    className="status-select"
                    value={m.status}
                    onChange={(e) => handleMilestoneStatusChange(m.id, e.target.value, m.status)}
                    disabled={m.status === 'Locked' || busyOps[`milestoneStatus:${m.id}`]}
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Approval">Pending Approval</option>
                  </select>
                ) : (
                  <select
                    className="status-select"
                    value={m.status}
                    onChange={(e) => handleMilestoneStatusChange(m.id, e.target.value, m.status)}
                    disabled={busyOps[`milestoneStatus:${m.id}`]}
                  >
                    <option value="Locked">Locked</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Completed">Completed</option>
                  </select>
                )}
                <span className="status-badge" style={{ marginLeft: 6 }}>{m.status}</span>
              </div>
            </div>

            {m.stages.map((st) => (
              <div key={st.id} className="stage-block">
                <div className="stage-row">
                  <h4 className="stage-title">{st.title}</h4>
                  <select
                    value={st.status}
                    onChange={(e) => handleStageStatusChange(st.id, e.target.value)}
                    className="status-select"
                    disabled={st.status === "Locked"}
                  >
                    <option value="Locked">Locked</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Tasks */}
                <div className="task-list">
                  {st.tasks.map((t) => (
                    <div key={t.id} className="task-item">
                      <div className="task-header">
                        {/* Editable Task Name */}
                        {newItemNames[`edit-task-${t.id}`] ? (
                          <div className="edit-name-row">
                            <input
                              type="text"
                              value={newItemNames[`task-${t.id}`] || t.title}
                              onChange={(e) => handleInputChange(`task-${t.id}`, e.target.value)}
                              className="editable-input"
                            />
                            <button
                              className="btn small success"
                              onClick={() => {
                                const newName = newItemNames[`task-${t.id}`] || t.title;
                                handleTaskUpdate(t.id, { name: newName });
                                setNewItemNames((prev) => ({ ...prev, [`edit-task-${t.id}`]: false }));
                              }}
                            >
                              Save
                            </button>
                            <button
                              className="btn small secondary"
                              onClick={() =>
                                setNewItemNames((prev) => ({ ...prev, [`task-${t.id}`]: t.title, [`edit-task-${t.id}`]: false }))
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="task-title-row">
                            <span>{t.title}</span>
                            <button
                              className="btn small"
                              onClick={() =>
                                setNewItemNames((prev) => ({
                                  ...prev,
                                  [`task-${t.id}`]: t.title,
                                  [`edit-task-${t.id}`]: true,
                                }))
                              }
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        )}

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
                          className="btn small danger"
                          onClick={() => handleDeleteTask(t.id)}
                          disabled={busyOps[`deleteTask:${t.id}`]}
                        >
                          {busyOps[`deleteTask:${t.id}`] ? 'Deleting...' : 'Delete Task'}
                        </button>
                      </div>

                      {/* Subtasks */}
                      <div className="subtask-list">
                        {t.subtasks.map((sub) => (
                          <div key={sub.id} className="subtask-item">
                            {newItemNames[`edit-sub-${sub.id}`] ? (
                              <div className="edit-name-row">
                                <input
                                  type="text"
                                  value={newItemNames[`sub-${sub.id}`] || sub.title}
                                  onChange={(e) => handleInputChange(`sub-${sub.id}`, e.target.value)}
                                  className="editable-input"
                                />
                                <button
                                  className="btn small success"
                                  onClick={() => {
                                    const newName = newItemNames[`sub-${sub.id}`] || sub.title;
                                    handleSubtaskUpdate(sub.id, { name: newName });
                                    setNewItemNames((prev) => ({ ...prev, [`edit-sub-${sub.id}`]: false }));
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn small secondary"
                                  onClick={() =>
                                    setNewItemNames((prev) => ({ ...prev, [`sub-${sub.id}`]: sub.title, [`edit-sub-${sub.id}`]: false }))
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="task-title-row">
                                <span>{sub.title}</span>
                                <button
                                  className="btn small"
                                  onClick={() =>
                                    setNewItemNames((prev) => ({
                                      ...prev,
                                      [`sub-${sub.id}`]: sub.title,
                                      [`edit-sub-${sub.id}`]: true,
                                    }))
                                  }
                                >
                                  ✏️ Edit
                                </button>
                              </div>
                            )}

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
                              disabled={busyOps[`deleteSubtask:${sub.id}`]}
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
                          disabled={busyOps[`createSubtask:${t.id}`]}
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
                    disabled={busyOps[`createTask:${st.id}`]}
                  >
                    Add Task
                  </button>
                </div>
              </div>
            ))}

            {/* Notes */}
            {m.notes && m.notes.length > 0 && (
              <div className="notes-section">
                <h5>Faculty Notes</h5>
                <ul>
                  {m.notes.map((note) => (
                    <li key={note.note_id}>
                      <p style={{ margin: 0 }}>{note.note}</p>
                      <div className="note-meta">{new Date(note.created_at).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboardPage;
