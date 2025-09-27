import React, { useState, useEffect } from 'react';
import { getStudentDataById, updateStudentData, overrideMilestoneStatus, getAllStudents } from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

const AdminDashboardPage = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Effect 1: Fetch the list of all students only once on component mount
  useEffect(() => {
    const students = getAllStudents();
    setAllStudents(students);
    if (students.length > 0) {
      setSelectedStudentId(students[0].id);
    } else {
      setLoading(false);
    }
  }, []);

  // Filter students based on the search query
  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.studentId && student.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Effect 2 (THE FIX): Synchronize the selected student with the filtered list.
  // This runs whenever the search query (and thus the filtered list) changes.
  useEffect(() => {
    const isSelectedStudentInFilteredList = filteredStudents.some(student => student.id === selectedStudentId);

    // If the current selection is not in the filtered list, update it.
    if (!isSelectedStudentInFilteredList) {
      if (filteredStudents.length > 0) {
        // Automatically select the first student in the new filtered list
        setSelectedStudentId(filteredStudents[0].id);
      } else {
        // If the search results in no students, clear the selection
        setSelectedStudentId('');
      }
    }
  }, [searchQuery, filteredStudents]); // Dependency array ensures this runs when the filter changes


  // Effect 3: Fetch data for the selected student whenever the selection changes.
  // This is now correctly triggered by both manual selection and the auto-selection from Effect 2.
  useEffect(() => {
    if (!selectedStudentId) {
        setStudentData(null);
        setLoading(false);
        return;
    }
    setLoading(true);
    const data = getStudentDataById(selectedStudentId);
    setStudentData(data);
    setLoading(false);
  }, [selectedStudentId]);

  const handleStatusChange = (path, newStatus) => {
    const updatedData = updateStudentData(selectedStudentId, path, newStatus);
    setStudentData(updatedData);
  };

  const handleOverride = (milestonePath) => {
      const updatedData = overrideMilestoneStatus(selectedStudentId, milestonePath);
      setStudentData(updatedData);
  }
  
  const handleStudentSelect = (e) => {
      setSelectedStudentId(e.target.value);
  }

  const handleSearchChange = (e) => {
      setSearchQuery(e.target.value);
  }

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
            onChange={handleSearchChange}
        />
        <label htmlFor="student-select">Select from list:</label>
        <select id="student-select" value={selectedStudentId} onChange={handleStudentSelect}>
          {/* If there are no results, show a disabled option */}
          {filteredStudents.length === 0 ? (
            <option value="" disabled>No students found</option>
          ) : (
            filteredStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.studentId})
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
                onStatusChange={handleStatusChange}
                isLocked={false}
                isAdmin={true}
                onOverride={handleOverride}
              />
            ))}
          </div>
        </>
      ) : (
        <p>Please register a new student or select one from the list to view their progress.</p>
      )}
    </div>
  );
};

export default AdminDashboardPage;

