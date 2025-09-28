// src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import {
  getAllStudents,
  getStudentProgress,
  createMilestone,
  deleteMilestone,
  updateMilestoneStatus,
  freezeMilestone,
  createStage,
  deleteStage,
  updateStageStatus,
  createNote,
  deleteTask,
  deleteSubtask,
} from '../services/api';
import Toast from '../components/Toast';
import '../styles/Dashboard.css';
import '../components/Toast.jsx';

const transformProgressData = (backendData) => {
  if (!backendData || !Array.isArray(backendData.milestones)) return { milestones: [] };

  const transformTasks = (tasks = []) =>
    tasks.map((task) => ({
      id: task.task_id,
      title: task.name,
      status: task.status,
      subtasks: (task.Subtasks || []).map((sub) => ({
        id: sub.subtask_id,
        title: sub.name,
        status: sub.status,
      })),
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
      department: m.department,
    }));

  return { ...backendData, milestones: transformMilestones(backendData.milestones) };
};

const AdminDashboardPage = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState({ milestones: [] });
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [busyOps, setBusyOps] = useState({});

  const pushToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  const setBusy = (key, val) => setBusyOps((s) => ({ ...s, [key]: val }));

  useEffect(() => {
    (async () => {
      const res = await getAllStudents();
      if (res.error) pushToast(res.error, 'error');
      else {
        const list = res.data?.students || [];
        setStudents(list);
        if (list.length > 0) setSelectedStudentId(list[0].student_id);
      }
    })();
  }, []);

  const refreshProgress = async (sid = selectedStudentId) => {
    if (!sid) return;
    setLoading(true);
    const res = await getStudentProgress(sid);
    if (res.error) {
      pushToast(res.error, 'error');
      setStudentData({ milestones: [] });
    } else {
      setStudentData(transformProgressData(res.data));
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  const handleCreateMilestone = async () => {
    if (!newMilestoneName.trim()) {
      pushToast('Provide a milestone name', 'error');
      return;
    }
    setBusy('createMilestone', true);
    const res = await createMilestone({
      name: newMilestoneName,
      student_id: selectedStudentId,
      department: user.department,
      status: 'Locked',
    });
    setBusy('createMilestone', false);
    if (res.error) pushToast(res.error, 'error');
    else {
      pushToast('Milestone created', 'success');
      setNewMilestoneName('');
      await refreshProgress();
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Delete milestone? This will remove its stages and tasks.')) return;
    setBusy(`deleteMilestone:${milestoneId}`, true);
    const res = await deleteMilestone(milestoneId);
    setBusy(`deleteMilestone:${milestoneId}`, false);
    if (res.error) pushToast(res.error, 'error');
    else {
      pushToast('Milestone deleted', 'success');
      await refreshProgress();
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId, newStatus) => {
    setBusy(`milestoneStatus:${milestoneId}`, true);
    const res = await updateMilestoneStatus(milestoneId, newStatus);
    setBusy(`milestoneStatus:${milestoneId}`, false);
    if (res.error) pushToast(res.error, 'error');
    else {
      pushToast('Milestone status updated', 'success');
      await refreshProgress();
    }
  };

  const handleFreezeMilestone = async (milestoneId, freeze) => {
    setBusy(`freeze:${milestoneId}`, true);
    const res = await freezeMilestone(milestoneId, freeze);
    setBusy(`freeze:${milestoneId}`, false);
    if (res.error) pushToast(res.error, 'error');
    else {
      pushToast(`Milestone ${freeze ? 'frozen' : 'unfrozen'}`, 'success');
      await refreshProgress();
    }
  };

  const handleCreateStage = async (milestoneId) => {
    if (!newStageName.trim()) {
      pushToast('Provide a stage name', 'error');
      return;
    }
    setBusy(`createStage:${milestoneId}`, true);
    const res = await createStage({ milestone_id: milestoneId, name: newStageName });
    setBusy(`createStage:${milestoneId}`, false);
    if (res.error) pushToast(res.error, 'error');
    else {
      pushToast('Stage created', 'success');
      setNewStageName('');
      await refreshProgress();
    }
  };

  const handleDeleteStage = async (stageId) => {
    if (!window.confirm('Delete stage?')) return;
    setBusy(`deleteStage:${stageId}`, true);
    const res = await deleteStage(stageId);
    setBusy(`deleteStage:${stageId}`, false);
    if (res.error) pushToast(res.error, 'error');
    else {
      pushToast('Stage deleted', 'success');
      await refreshProgress();
    }
  };

  const handleUpdateStageStatus = async (stageId, newStatus) => {
    setBusy(`stageStatus:${stageId}`, true);
    const res = await updateStageStatus(stageId, newStatus);
    setBusy(`stageStatus:${stageId}`, false);
    if (res.error) pushToast(res.error, 'error');
    else {
      pushToast('Stage status updated', 'success');
      await refreshProgress();
    }
  };

  const handleAddNote = async (milestoneId) => {
    if (!newNote.trim()) {
      pushToast('Note cannot be empty', 'error');
      return;
    }
    setBusy(`createNote:${milestoneId}`, true);
    const res = await createNote({ student_id: selectedStudentId, milestone_id: milestoneId, note: newNote });
    setBusy(`createNote:${milestoneId}`, false);
    if (res.error) pushToast(res.error, 'error');
    else {
      pushToast('Note added', 'success');
      setNewNote('');
      await refreshProgress();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete task?')) return;
    const res = await deleteTask(taskId);
    if (res.error) pushToast(res.error, 'error');
    else {
      pushToast('Task deleted', 'success');
      await refreshProgress();
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Delete subtask?')) return;
    const res = await deleteSubtask(subtaskId);
    if (res.error) pushToast(res.error, 'error');
    else {
      pushToast('Subtask deleted', 'success');
      await refreshProgress();
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Faculty Dashboard</h2>
      </div>

      {/* Toasts */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      <div className="card-block">
        <h3>Select Student</h3>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="input"
        >
          <option value="">-- Select student --</option>
          {students.map((s) => (
            <option key={s.student_id} value={s.student_id}>
              {s.name} ({s.student_id})
            </option>
          ))}
        </select>
      </div>

      <div className="card-block">
        <h3>Create Milestone</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            type="text"
            placeholder="Milestone name"
            value={newMilestoneName}
            onChange={(e) => setNewMilestoneName(e.target.value)}
          />
          <button className="btn primary" onClick={handleCreateMilestone} disabled={busyOps.createMilestone}>
            {busyOps.createMilestone ? 'Creating...' : 'Add Milestone'}
          </button>
        </div>
      </div>

      {loading && <p>Loading progress...</p>}

      {!loading &&
        studentData?.milestones.map((m) => {
          const allowed = m.department === user.department;
          return (
            <div key={m.id} className="card-block">
              <div className="milestone-header">
                <h3>{m.title}</h3>
                <div className="milestone-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={m.status}
                    className="status-select"
                    onChange={(e) => handleUpdateMilestoneStatus(m.id, e.target.value)}
                    disabled={!allowed || busyOps[`milestoneStatus:${m.id}`]}
                  >
                    <option value="Locked">Locked</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <button
                    className="btn small danger"
                    onClick={() => handleDeleteMilestone(m.id)}
                    disabled={!allowed || busyOps[`deleteMilestone:${m.id}`]}
                  >
                    {busyOps[`deleteMilestone:${m.id}`] ? 'Deleting...' : 'Delete'}
                  </button>

                  <button
                    className="btn small"
                    onClick={() => handleFreezeMilestone(m.id, true)}
                    disabled={!allowed || busyOps[`freeze:${m.id}`]}
                  >
                    Freeze
                  </button>
                  <button
                    className="btn small"
                    onClick={() => handleFreezeMilestone(m.id, false)}
                    disabled={!allowed || busyOps[`freeze:${m.id}`]}
                  >
                    Unfreeze
                  </button>
                </div>
              </div>

              {/* Stages */}
              <div className="stage-create" style={{ marginTop: 10 }}>
                <input
                  className="input"
                  type="text"
                  placeholder="Stage name"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                />
                <button className="btn secondary" onClick={() => handleCreateStage(m.id)} disabled={busyOps[`createStage:${m.id}`]}>
                  {busyOps[`createStage:${m.id}`] ? 'Adding...' : 'Add Stage'}
                </button>
              </div>

              {m.stages.map((st) => (
                <div key={st.id} className="stage-block">
                  <div className="stage-row">
                    <h4>{st.title}</h4>
                    <div className="stage-actions" style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={st.status}
                        className="status-select"
                        onChange={(e) => handleUpdateStageStatus(st.id, e.target.value)}
                        disabled={!allowed || busyOps[`stageStatus:${st.id}`]}
                      >
                        <option value="Locked">Locked</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        className="btn small danger"
                        onClick={() => handleDeleteStage(st.id)}
                        disabled={!allowed || busyOps[`deleteStage:${st.id}`]}
                      >
                        {busyOps[`deleteStage:${st.id}`] ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {/* ✅ Tasks (read-only, faculty can delete) */}
                  <div className="task-list">
                    {st.tasks.map((t) => (
                      <div key={t.id} className="task-item">
                        <div className="task-header">
                          <span>{t.title}</span>
                          <span className="status-badge">{t.status}</span>
                          <button className="btn small danger" onClick={() => handleDeleteTask(t.id)}>
                            Delete Task
                          </button>
                        </div>

                        {/* Subtasks */}
                        <div className="subtask-list">
                          {t.subtasks.map((sub) => (
                            <div key={sub.id} className="subtask-item">
                              <span>{sub.title}</span>
                              <span className="status-badge">{sub.status}</span>
                              <button className="btn-icon" onClick={() => handleDeleteSubtask(sub.id)}>
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div className="notes-section" style={{ marginTop: 12 }}>
                <h5>Faculty Notes</h5>
                {m.notes.map((note) => (
                  <p key={note.note_id} className="note-meta">
                    {note.note} — {new Date(note.created_at).toLocaleString()}
                  </p>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    type="text"
                    placeholder="Add note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <button className="btn" onClick={() => handleAddNote(m.id)} disabled={busyOps[`createNote:${m.id}`]}>
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default AdminDashboardPage;
