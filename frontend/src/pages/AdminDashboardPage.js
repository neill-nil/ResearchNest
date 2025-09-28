import React, { useState, useEffect, useCallback } from 'react';
import { 
    getAllStudentsForFaculty, 
    getStudentProgress, 
    approveMilestone 
} from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

const AdminDashboardPage = ({ user }) => {
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch the list of all students for this faculty member
  useEffect(() => {
    const fetchStudents = async () => {
        try {
            // Use the logged-in faculty's ID to get their students
            const students = await getAllStudentsForFaculty(user.id);
            setAllStudents(students);
            // If students are found, select the first one by default
            if (students.length > 0) {
              setSelectedStudentId(students[0].id); 
            }
        } catch (error) {
            console.error("Failed to fetch students:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchStudents();
  }, [user.id]);

  // Fetch the progress data for the currently selected student
  const fetchStudentData = useCallback(async () => {
    if (!selectedStudentId) {
        setStudentData(null);
        return;
    }
    setLoading(true);
    try {
        const data = await getStudentProgress(selectedStudentId);
        // Transform data keys to match frontend component props (e.g., name -> title)
        const transformedData = {
          ...data,
          milestones: data.milestones.map(m => ({
              ...m, id: m.milestone_id, title: m.name,
              stages: m.Stages.map(s => ({
                  ...s, id: s.stage_id, title: s.name,
                  tasks: s.Tasks.map(t => ({
                      ...t, id: t.task_id, title: t.name,
                      subtasks: t.Subtasks.map(st => ({ ...st, id: st.subtask_id, title: st.name }))
                  }))
              }))
          }))
        };
        setStudentData(transformedData);
    } catch (error) {
        console.error("Failed to fetch student progress:", error);
        setStudentData(null);
    } finally {
        setLoading(false);
    }
  }, [selectedStudentId]);
  
  useEffect(() => {
      fetchStudentData();
  }, [fetchStudentData]);

  // Handler for the "Override" button on a milestone
  const handleOverride = async (milestoneId) => {
      try {
          await approveMilestone(milestoneId);
          // Re-fetch data to show the updated statuses
          fetchStudentData();
      } catch (error) {
          console.error("Failed to approve milestone:", error);
          alert("Could not approve the milestone. Please try again.");
      }
  }

  // Filter students based on search query
  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.id && student.id.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Faculty Dashboard</h2>
      
      <div className="student-selector-container">
        <label htmlFor="student-search">Search Students:</label>
        <input
            type="text"
            id="student-search"
            placeholder="By name or ID..."
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

      {loading ? (
        <p>Loading student data...</p>
      ) : studentData ? (
        <>
          <p className="dashboard-subtitle">Viewing progress for: <strong>{studentData.name} ({studentData.studentId})</strong></p>
          <div className="milestones-container">
            {studentData.milestones.map((milestone, index) => (
              <Milestone
                key={milestone.id}
                milestone={milestone}
                milestoneIndex={index}
                isLocked={false} // Admins see everything as unlocked
                isAdmin={true}
                onOverride={() => handleOverride(milestone.id)} // Pass the ID to the handler
              />
            ))}
          </div>
        </>
      ) : (
        <p>Please select a student to view their progress.</p>
      )}
    </div>
  );
};

export default AdminDashboardPage;
