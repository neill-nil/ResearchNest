import React, { useState, useEffect } from 'react';
import {
  getAllStudents,
  getStudentProgress,
  createMilestone,
  freezeMilestone,
  deleteMilestone,
  createStage,
  deleteStage,
  createNote,
  updateMilestoneStatus,
  updateStageStatus,
} from '../services/api';
import './Dashboard.css';

// --- Transformer ---
const transformProgressData = (backendData) => {
  if (!backendData || !Array.isArray(backendData.milestones))
    return { ...backendData, milestones: [] };

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

const AdminDashboardPage = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [creating, setCreating] = useState(false);

  // --- Fetch ALL students ---
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await getAllStudents();
        setStudents(data.students || []);
        if (data.students?.length > 0) {
          setSelectedStudentId(data.students[0].student_id);
        }
      } catch (err) {
        setError('Failed to fetch students.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // --- Fetch progress ---
  const refreshProgress = async () => {
    if (!selectedStudentId) {
      setStudentData(null);
      return;
    }
    try {
      setLoading(true);
      const data = await getStudentProgress(selectedStudentId);
      setStudentData(transformProgressData(data));
    } catch (err) {
      setError(`Failed to fetch progress for student ${selectedStudentId}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProgress();
  }, [selectedStudentId]);

  // --- Milestone actions ---
  const handleCreateMilestone = async () => {
    if (!selectedStudentId || !newMilestoneName.trim()) {
      alert('Enter milestone name and select a student.');
      return;
    }
    try {
      setCreating(true);
      await createMilestone({
        name: newMilestoneName,
        student_id: selectedStudentId,
        department: user.department,
        status: 'Locked',
      });
      await refreshProgress();
      setNewMilestoneName('');
    } catch {
      alert('Failed to create milestone.');
    } finally {
      setCreating(false);
    }
  };

  const handleFreeze = async (milestoneId, freeze) => {
    try {
      await freezeMilestone(milestoneId, freeze);
      await refreshProgress();
    } catch {
      alert('Failed to update freeze status.');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (window.confirm('Delete this milestone?')) {
      try {
        await deleteMilestone(milestoneId);
        await refreshProgress();
      } catch {
        alert('Failed to delete milestone.');
      }
    }
  };

  // --- Stage actions ---
  const handleCreateStage = async (milestoneId) => {
    if (!newStageName.trim()) return;
    await createStage({ milestone_id: milestoneId, name: newStageName });
    await refreshProgress();
    setNewStageName('');
  };

  const handleDeleteStage = async (stageId) => {
    if (window.confirm('Delete this stage?')) {
      await deleteStage(stageId);
      await refreshProgress();
    }
  };

  // --- Notes ---
  const handleAddNote = async (milestoneId) => {
    if (!newNote.trim()) return;
    await createNote({
      student_id: selectedStudentId,
      milestone_id: milestoneId,
      note: newNote,
    });
    setNewNote('');
    await refreshProgress(); // ✅ ensure notes refresh after add
  };

  // --- Filter students ---
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id?.toString().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Faculty Dashboard</h2>

      {/* Student selector */}
      <div className="student-selector-container card">
        <input
          type="text"
          placeholder="Search student..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
        />
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="input"
        >
          {filteredStudents.map((s) => (
            <option key={s.student_id} value={s.student_id}>
              {s.name} ({s.student_id})
            </option>
          ))}
        </select>
      </div>

      {/* Create milestone */}
      <div className="milestone-create card">
        <input
          type="text"
          placeholder="Milestone name..."
          value={newMilestoneName}
          onChange={(e) => setNewMilestoneName(e.target.value)}
          className="input"
        />
        <button onClick={handleCreateMilestone} disabled={creating} className="btn primary">
          {creating ? 'Creating...' : 'Add Milestone'}
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && studentData && (
        <div className="milestones-container">
          {studentData.milestones.map((m) => (
            <div key={m.id} className="milestone-wrapper card">
              {/* Milestone header */}
              <div className="milestone-header">
                <h3>Milestone: {m.title}</h3>
                <div className="milestone-actions">
                  {/* Milestone status dropdown */}
                  <select
                    value={m.status}
                    onChange={async (e) => {
                      await updateMilestoneStatus(m.id, e.target.value);
                      await refreshProgress();
                    }}
                    className="status-select"
                  >
                    <option value="Locked">Locked</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <button onClick={() => handleFreeze(m.id, !m.is_frozen)} className="btn small">
                    {m.is_frozen ? 'Unfreeze' : 'Freeze'}
                  </button>
                  <button onClick={() => handleDeleteMilestone(m.id)} className="btn danger small">
                    Delete Milestone
                  </button>
                </div>
              </div>

              {/* Stage management */}
              <div className="stage-create">
                <input
                  type="text"
                  placeholder="Stage name..."
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="input"
                />
                <button onClick={() => handleCreateStage(m.id)} className="btn secondary">
                  Add Stage
                </button>
              </div>

              {/* Stage list */}
              {m.stages.map((st) => (
                <div key={st.id} className="stage-block">
                  <div className="stage-row">
                    <h4 className="stage-title">{st.title}</h4>
                    <div className="stage-actions">
                      {/* Stage status dropdown */}
                      <select
                        value={st.status}
                        onChange={async (e) => {
                          await updateStageStatus(st.id, e.target.value);
                          await refreshProgress();
                        }}
                        className="status-select"
                      >
                        <option value="Locked">Locked</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>

                      <button
                        onClick={() => handleDeleteStage(st.id)}
                        className="btn danger small"
                      >
                        Delete Stage
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div className="notes-section">
                <input
                  type="text"
                  placeholder="Add note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="input"
                />
                <button onClick={() => handleAddNote(m.id)} className="btn">
                  Add Note
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
