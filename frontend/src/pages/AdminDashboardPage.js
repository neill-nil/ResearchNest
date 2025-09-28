import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllStudentsForFaculty,
  getStudentProgress,
  approveMilestone
} from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

// --- Transformer ---
const transformProgressData = (backendData) => {
  if (!backendData || !Array.isArray(backendData.milestones))
    return { ...backendData, milestones: [] };

  const transformSubtasks = (subtasks = []) =>
    subtasks.map(sub => ({
      id: sub.subtask_id,
      title: sub.name,
      status: sub.status
    }));

  const transformTasks = (tasks = []) =>
    tasks.map(task => ({
      id: task.task_id,
      title: task.name,
      status: task.status,
      subtasks: transformSubtasks(task.Subtasks)
    }));

  const transformStages = (stages = []) =>
    stages.map(stage => ({
      id: stage.stage_id,
      title: stage.name,
      status: stage.status,
      tasks: transformTasks(stage.Tasks)
    }));

  const transformMilestones = (milestones = []) =>
    milestones.map(milestone => ({
      id: milestone.milestone_id,
      title: milestone.name,
      status: milestone.status,
      stages: transformStages(milestone.Stages)
    }));

  return {
    ...backendData,
    milestones: transformMilestones(backendData.milestones)
  };
};

const AdminDashboardPage = ({ user }) => {
  const facultyId = user?.id;

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Fetch all students in this faculty’s department ---
  useEffect(() => {
    const fetchStudents = async () => {
      if (!facultyId) return;
      try {
        setLoading(true);
        const data = await getAllStudentsForFaculty(facultyId);

        // Ensure array
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length > 0) setSelectedStudentId(data[0].id);
        } else {
          setStudents([]);
        }
      } catch (err) {
        setError("Failed to fetch students.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [facultyId]);

  // --- Fetch progress for a selected student ---
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

  // --- Approve milestone (faculty override) ---
  const handleOverride = useCallback(
    async (milestonePath) => {
      if (!studentData) return;
      const milestone = studentData.milestones[milestonePath.milestoneIndex];
      if (
        window.confirm(
          `Are you sure you want to approve and complete milestone "${milestone.title}"?`
        )
      ) {
        try {
          await approveMilestone(milestone.id);
          // Refresh
          const data = await getStudentProgress(selectedStudentId);
          setStudentData(transformProgressData(data));
        } catch (err) {
          alert("Failed to approve milestone.");
        }
      }
    },
    [studentData, selectedStudentId]
  );

  // --- Filter students ---
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.id && s.id.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Faculty Dashboard</h2>

      {/* Student search + select */}
      <div className="student-selector-container">
        <label htmlFor="student-search">Search Students:</label>
        <input
          type="text"
          id="student-search"
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <label htmlFor="student-select">Select Student:</label>
        <select
          id="student-select"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          {filteredStudents.length === 0 ? (
            <option value="" disabled>
              No students found
            </option>
          ) : (
            filteredStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))
          )}
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Progress */}
      {!loading && !error && studentData ? (
        <>
          <p className="dashboard-subtitle">
            Viewing progress for:{" "}
            <strong>
              {studentData.name} ({studentData.studentId})
            </strong>
          </p>

          <div className="milestones-container">
            {studentData.milestones.map((milestone, idx) => (
              <Milestone
                key={milestone.id}
                milestone={milestone}
                milestoneIndex={idx}
                onStatusChange={() => {}}
                isLocked={false}
                isAdmin={true}
                onOverride={handleOverride}
              />
            ))}
          </div>
        </>
      ) : (
        !loading && <p>Please select a student to view progress.</p>
      )}
    </div>
  );
};

export default AdminDashboardPage;
