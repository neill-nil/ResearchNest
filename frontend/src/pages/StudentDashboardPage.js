import React, { useState, useEffect } from 'react';
import { getStudentDataByEmail, updateStudentData } from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

const StudentDashboardPage = ({ userEmail }) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const data = getStudentDataByEmail(userEmail);
    if (data) {
        setStudentData(data);
    }
    setLoading(false);
  }, [userEmail]);

  const handleStatusChange = (path, newStatus) => {

    const updatedData = updateStudentData(studentData.id, path, newStatus);
    setStudentData(updatedData);
  };

  if (loading) {
    return <div>Loading student data...</div>;
  }

  if (!studentData) {
    return <div>Could not load student data for {userEmail}. Please contact support.</div>;
  }

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Welcome, {studentData.name}</h2>
      <p className="dashboard-subtitle">Here is your academic progress track.</p>
      <div className="milestones-container">
        {studentData.milestones.map((milestone, index) => (
          <Milestone
            key={milestone.id}
            milestone={milestone}
            milestoneIndex={index}
            onStatusChange={handleStatusChange}
            isLocked={index > 0 && studentData.milestones[index - 1].status !== 'Completed'}
            isAdmin={false}
          />
        ))}
      </div>
    </div>
  );
};

export default StudentDashboardPage;

