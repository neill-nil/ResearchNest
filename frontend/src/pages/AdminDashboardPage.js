import React, { useState, useEffect, useCallback } from 'react';
import { getStudentProgress, getAllStudentsForFaculty, approveMilestone } from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

// Data transformer to ensure consistency between backend and frontend component props
const transformProgressData = (backendData) => {
    if (!backendData || !Array.isArray(backendData.milestones)) return { ...backendData, milestones: [] };
    const transformSubtasks = (subtasks = []) => subtasks.map(sub => ({ id: sub.subtask_id, title: sub.name, status: sub.status }));
    const transformTasks = (tasks = []) => tasks.map(task => ({ id: task.task_id, title: task.name, status: task.status, subtasks: transformSubtasks(task.Subtasks) }));
    const transformStages = (stages = []) => stages.map(stage => ({ id: stage.stage_id, title: stage.name, status: stage.status, tasks: transformTasks(stage.Tasks) }));
    const transformMilestones = (milestones = []) => milestones.map(milestone => ({ id: milestone.milestone_id, title: milestone.name, status: milestone.status, stages: transformStages(milestone.Stages) }));
    return { ...backendData, milestones: transformMilestones(backendData.milestones) };
};

const AdminDashboardPage = ({ facultyId }) => {
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch the list of all students for this faculty member
  useEffect(() => {
    const fetchStudents = async () => {
      if (!facultyId) return;
      try {
        setLoading(true);
        const data = await getAllStudentsForFaculty(facultyId);
        
        // --- THIS IS THE FIX ---
        // Safely check if the returned data is an array. If not, use an empty array.
        if (Array.isArray(data)) {
          setAllStudents(data);
          if (data.length > 0) {
            setSelectedStudentId(data[0].id); // Select the first student by default
          }
        } else {
          setAllStudents([]); // Default to empty array to prevent crash
        }

      } catch (err) {
        setError("Failed to fetch the list of students.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [facultyId]);

  // Fetch the progress data for the currently selected student
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!selectedStudentId) {
        setStudentData(null);
        return;
      };
      try {
        setLoading(true);
        const data = await getStudentProgress(selectedStudentId);
        setStudentData(transformProgressData(data));
      } catch (err) {
        setError(`Failed to fetch progress for student ID: ${selectedStudentId}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [selectedStudentId]);
  
  const handleOverride = useCallback(async (milestonePath) => {
    if (!studentData) return;
    const milestone = studentData.milestones[milestonePath.milestoneIndex];
    if (window.confirm(`Are you sure you want to approve and complete the milestone "${milestone.title}"?`)) {
      try {
        await approveMilestone(milestone.id);
        // Refresh data after override
        const data = await getStudentProgress(selectedStudentId);
        setStudentData(transformProgressData(data));
      } catch (err) {
        alert("Failed to approve the milestone.");
      }
    }
  }, [studentData, selectedStudentId]);

  // The filter now safely runs on an array that is guaranteed to exist.
  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.id && student.id.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Faculty Dashboard</h2>
      
      <div className="student-selector-container">
        <label htmlFor="student-search">Search Students (by Name or ID):</label>
        <input
            type="text"
            id="student-search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
        <label htmlFor="student-select">Select from list:</label>
        <select id="student-select" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
          {filteredStudents.length === 0 ? (
            <option value="" disabled>No students found</option>
          ) : (
            filteredStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.id})
              </option>
            ))
          )}
        </select>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && studentData ? (
        <>
          <p className="dashboard-subtitle">Viewing progress for: <strong>{studentData.name} ({studentData.studentId})</strong></p>
          <div className="milestones-container">
            {studentData.milestones.map((milestone, index) => (
              <Milestone
                key={milestone.id}
                milestone={milestone}
                milestoneIndex={index}
                onStatusChange={() => {}} // Admin does not change subtask status directly
                isLocked={false} // Admin view is never locked
                isAdmin={true}
                onOverride={handleOverride}
              />
            ))}
          </div>
        </>
      ) : (
        !loading && <p>Please select a student to view their progress.</p>
      )}
    </div>
  );
};

export default AdminDashboardPage;

