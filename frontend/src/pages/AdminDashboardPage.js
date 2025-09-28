import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllStudents,
  getStudentProgress,
  approveMilestone,
  createMilestone,
  freezeMilestone,
  deleteMilestone,
  createStage,
  deleteStage,
  createTask,
  deleteTask,
  createNote,
  deleteNote
} from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

// --- Transformer ---
const transformProgressData = (backendData) => {
  if (!backendData || !Array.isArray(backendData.milestones))
    return { ...backendData, milestones: [] };

  const transformSubtasks = (subtasks = []) =>
    subtasks.map(sub => ({ id: sub.subtask_id, title: sub.name, status: sub.status }));

  const transformTasks = (tasks = []) =>
    tasks.map(task => ({ id: task.task_id, title: task.name, status: task.status, subtasks: transformSubtasks(task.Subtasks) }));

  const transformStages = (stages = []) =>
    stages.map(stage => ({ id: stage.stage_id, title: stage.name, status: stage.status, tasks: transformTasks(stage.Tasks) }));

  const transformMilestones = (milestones = []) =>
    milestones.map(m => ({ id: m.milestone_id, title: m.name, status: m.status, stages: transformStages(m.Stages) }));

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
  const [newTaskName, setNewTaskName] = useState('');
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
  useEffect(() => {
    const fetchProgress = async () => {
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
    fetchProgress();
  }, [selectedStudentId]);

  // --- Milestone actions ---
  const handleOverride = useCallback(async (milestonePath) => {
    if (!studentData) return;
    const milestone = studentData.milestones[milestonePath.milestoneIndex];
    if (window.confirm(`Approve milestone "${milestone.title}"?`)) {
      try {
        await approveMilestone(milestone.id);
        const data = await getStudentProgress(selectedStudentId);
        setStudentData(transformProgressData(data));
      } catch {
        alert('Failed to approve milestone.');
      }
    }
  }, [studentData, selectedStudentId]);

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
        status: "Locked"
      });
      const data = await getStudentProgress(selectedStudentId);
      setStudentData(transformProgressData(data));
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
      const data = await getStudentProgress(selectedStudentId);
      setStudentData(transformProgressData(data));
    } catch {
      alert('Failed to update freeze status.');
    }
  };

  const handleDelete = async (milestoneId) => {
    if (window.confirm('Delete this milestone?')) {
      try {
        await deleteMilestone(milestoneId);
        const data = await getStudentProgress(selectedStudentId);
        setStudentData(transformProgressData(data));
      } catch {
        alert('Failed to delete milestone.');
      }
    }
  };

  // --- Stage actions ---
  const handleCreateStage = async (milestoneId) => {
    if (!newStageName.trim()) return;
    await createStage({ milestone_id: milestoneId, name: newStageName });
    const data = await getStudentProgress(selectedStudentId);
    setStudentData(transformProgressData(data));
    setNewStageName('');
  };
  const handleDeleteStage = async (stageId) => {
    if (window.confirm('Delete this stage?')) {
      await deleteStage(stageId);
      const data = await getStudentProgress(selectedStudentId);
      setStudentData(transformProgressData(data));
    }
  };

  // --- Task actions ---
  const handleCreateTask = async (stageId) => {
    if (!newTaskName.trim()) return;
    await createTask({ stage_id: stageId, name: newTaskName });
    const data = await getStudentProgress(selectedStudentId);
    setStudentData(transformProgressData(data));
    setNewTaskName('');
  };
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      await deleteTask(taskId);
      const data = await getStudentProgress(selectedStudentId);
      setStudentData(transformProgressData(data));
    }
  };

  // --- Notes ---
  const handleAddNote = async (milestoneId) => {
    if (!newNote.trim()) return;
    await createNote({ student_id: selectedStudentId, milestone_id: milestoneId, note: newNote });
    setNewNote('');
  };
  const handleDeleteNote = async (noteId) => {
    await deleteNote(noteId);
  };

  // --- Filter students ---
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.student_id?.toString().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Faculty Dashboard</h2>

      {/* Student selector */}
      <div className="student-selector-container">
        <input
          type="text"
          placeholder="Search student..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          {filteredStudents.map((s) => (
            <option key={s.student_id} value={s.student_id}>
              {s.name} ({s.student_id})
            </option>
          ))}
        </select>
      </div>

      {/* Create milestone */}
      <div className="milestone-create">
        <input
          type="text"
          placeholder="Milestone name..."
          value={newMilestoneName}
          onChange={(e) => setNewMilestoneName(e.target.value)}
        />
        <button onClick={handleCreateMilestone} disabled={creating}>
          {creating ? 'Creating...' : 'Add Milestone'}
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && studentData && (
        <>
          <div className="milestones-container">
            {studentData.milestones.map((m) => (
              <div key={m.id} className="milestone-wrapper">
                <Milestone milestone={m} isAdmin={true} onOverride={handleOverride} />
                <div className="milestone-controls">
                  <button onClick={() => handleFreeze(m.id, !m.is_frozen)}>
                    {m.is_frozen ? 'Unfreeze' : 'Freeze'}
                  </button>
                  <button onClick={() => handleDelete(m.id)}>Delete</button>
                </div>

                {/* Stage + Task management */}
                <div>
                  <input
                    type="text"
                    placeholder="Stage name..."
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                  />
                  <button onClick={() => handleCreateStage(m.id)}>Add Stage</button>
                </div>
                {m.stages.map((st) => (
                  <div key={st.id} className="stage-block">
                    <h4>{st.title}</h4>
                    <button onClick={() => handleDeleteStage(st.id)}>Delete Stage</button>
                    <div>
                      <input
                        type="text"
                        placeholder="Task name..."
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                      />
                      <button onClick={() => handleCreateTask(st.id)}>Add Task</button>
                    </div>
                    {st.tasks.map((t) => (
                      <div key={t.id}>
                        {t.title}
                        <button onClick={() => handleDeleteTask(t.id)}>Delete Task</button>
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
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
