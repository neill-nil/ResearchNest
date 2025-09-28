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
} from '../services/api';
import './Dashboard.css';

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

const AdminDashboardPage = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshProgress = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    try {
      const data = await getStudentProgress(selectedStudentId);
      setStudentData(transformProgressData(data));
    } catch (err) {
      console.error('❌ Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllStudents();
        setStudents(data.students || []);
        if (data.students?.length > 0) setSelectedStudentId(data.students[0].student_id);
      } catch (err) {
        console.error('❌ Student fetch error:', err);
      }
    })();
  }, []);

  useEffect(() => {
    refreshProgress();
  }, [selectedStudentId]);

  const handleCreateMilestone = async () => {
    if (!newMilestoneName.trim()) return;
    await createMilestone({
      name: newMilestoneName,
      student_id: selectedStudentId,
      department: user.department,
      status: 'Locked',
    });
    setNewMilestoneName('');
    refreshProgress();
  };

  const handleCreateStage = async (milestoneId) => {
    if (!newStageName.trim()) return;
    await createStage({ milestone_id: milestoneId, name: newStageName });
    setNewStageName('');
    refreshProgress();
  };

  const handleAddNote = async (milestoneId) => {
    if (!newNote.trim()) return;
    await createNote({ student_id: selectedStudentId, milestone_id: milestoneId, note: newNote });
    setNewNote('');
    refreshProgress();
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Faculty Dashboard</h2>

      {/* Student Selector */}
      <div className="card-block">
        <h3>Select Student</h3>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="input"
        >
          {students.map((s) => (
            <option key={s.student_id} value={s.student_id}>
              {s.name} ({s.student_id})
            </option>
          ))}
        </select>
      </div>

      {/* Create Milestone */}
      <div className="card-block">
        <h3>Create Milestone</h3>
        <input
          className="input"
          type="text"
          placeholder="Milestone name"
          value={newMilestoneName}
          onChange={(e) => setNewMilestoneName(e.target.value)}
        />
        <button className="btn primary" onClick={handleCreateMilestone}>
          Add Milestone
        </button>
      </div>

      {loading && <p>Loading progress...</p>}

      {!loading &&
        studentData?.milestones.map((m) => (
          <div key={m.id} className="card-block">
            <div className="milestone-header">
              <h3>{m.title}</h3>
              <div className="milestone-actions">
                <select
                  value={m.status}
                  className="status-select"
                  onChange={async (e) => {
                    await updateMilestoneStatus(m.id, e.target.value);
                    refreshProgress();
                  }}
                >
                  <option value="Locked">Locked</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Completed">Completed</option>
                </select>
                <button className="btn small danger" onClick={() => deleteMilestone(m.id)}>
                  Delete
                </button>
              </div>
            </div>

            {/* Stages */}
            <div className="stage-create">
              <input
                className="input"
                type="text"
                placeholder="Stage name"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
              />
              <button className="btn secondary" onClick={() => handleCreateStage(m.id)}>
                Add Stage
              </button>
            </div>

            {m.stages.map((st) => (
              <div key={st.id} className="stage-block">
                <div className="stage-row">
                  <h4>{st.title}</h4>
                  <div className="stage-actions">
                    <select
                      value={st.status}
                      className="status-select"
                      onChange={async (e) => {
                        await updateStageStatus(st.id, e.target.value);
                        refreshProgress();
                      }}
                    >
                      <option value="Locked">Locked</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <button className="btn small danger" onClick={() => deleteStage(st.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Notes */}
            <div className="notes-section">
              <h5>Faculty Notes</h5>
              {m.notes.map((note) => (
                <p key={note.note_id} className="note-meta">
                  {note.note} — {note.created_at}
                </p>
              ))}
              <input
                className="input"
                type="text"
                placeholder="Add note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button className="btn" onClick={() => handleAddNote(m.id)}>
                Add Note
              </button>
            </div>
          </div>
        ))}
    </div>
  );
};

export default AdminDashboardPage;
