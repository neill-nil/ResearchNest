import React, { useState, useEffect, useCallback } from 'react';
import { getStudentProgress, updateSubtaskStatus, approveMilestone } from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

const StudentDashboardPage = ({ user }) => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Use useCallback to memoize the fetch function
  const fetchStudentData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError('');
      // Fetch the full progress hierarchy for the logged-in student
      const data = await getStudentProgress(user.id);
      
      // *** IMPORTANT DATA TRANSFORMATION STEP ***
      // The frontend components expect keys like 'id' and 'title'.
      // The API sends 'milestone_id' and 'name'. We map them here.
      const transformedData = {
          ...data,
          milestones: data.milestones.map(m => ({
              ...m,
              id: m.milestone_id,
              title: m.name,
              stages: m.Stages.map(s => ({
                  ...s,
                  id: s.stage_id,
                  title: s.name,
                  tasks: s.Tasks.map(t => ({
                      ...t,
                      id: t.task_id,
                      title: t.name,
                      subtasks: t.Subtasks.map(st => ({
                          ...st,
                          id: st.subtask_id,
                          title: st.name
                      }))
                  }))
              }))
          }))
      };
      setProgressData(transformedData);
    } catch (err) {
      console.error("Failed to fetch student data:", err);
      setError('Could not load your progress data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // useEffect to call the fetch function on component mount and when the user changes
  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);
  
  // This function is passed down to the subtask component
  const handleStatusChange = async (path, newStatus, itemId) => {
    try {
      // Your API has different endpoints for each item type.
      // For now, we only handle subtasks as per the provided mock logic.
      if (path.subtaskIndex !== undefined) {
        await updateSubtaskStatus(itemId, newStatus);
        // After a successful update, re-fetch all data to ensure UI consistency
        // This is the simplest way to guarantee that parent statuses are recalculated correctly.
        fetchStudentData();
      }
      // TODO: Add handlers for updating Tasks, Stages if needed.
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('There was an error updating the status. Please try again.');
    }
  };
  
  // Render different UI based on the state
  if (loading) {
    return <div className="dashboard-container"><p>Loading your progress...</p></div>;
  }

  if (error) {
    return <div className="dashboard-container"><p className="error-message">{error}</p></div>;
  }

  if (!progressData || !progressData.milestones) {
    return <div className="dashboard-container"><p>No progress data found. Please contact your faculty advisor.</p></div>;
  }

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Welcome, {user.name}</h2>
      <p className="dashboard-subtitle">Here is your academic progress track.</p>
      <div className="milestones-container">
        {progressData.milestones.map((milestone, index) => (
          <Milestone
            key={milestone.id}
            milestone={milestone}
            milestoneIndex={index}
            onStatusChange={handleStatusChange}
            // A milestone is locked if the one before it is not completed.
            isLocked={index > 0 && progressData.milestones[index - 1].status !== 'Completed'}
            isAdmin={false} // Students are not admins
          />
        ))}
      </div>
    </div>
  );
};

export default StudentDashboardPage;
