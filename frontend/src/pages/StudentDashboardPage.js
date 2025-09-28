import React, { useState, useEffect } from 'react';
import { getStudentProgress, updateSubtaskStatus } from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

/**
 * A transformer function to convert the backend data structure
 * into the structure the frontend components expect.
 * This is essential for compatibility between the frontend and backend.
 */
const transformData = (backendData) => {
  if (!backendData || !Array.isArray(backendData.milestones)) {
    return { ...backendData, milestones: [] }; // Ensure milestones is always an array
  }

  const transformSubtasks = (subtasks = []) => 
    subtasks.map(sub => ({
      id: sub.subtask_id,
      title: sub.name,
      status: sub.status,
    }));

  const transformTasks = (tasks = []) =>
    tasks.map(task => ({
      id: task.task_id,
      title: task.name,
      status: task.status,
      subtasks: transformSubtasks(task.Subtasks),
    }));

  const transformStages = (stages = []) =>
    stages.map(stage => ({
      id: stage.stage_id,
      title: stage.name,
      status: stage.status,
      tasks: transformTasks(stage.Tasks),
    }));

  const transformMilestones = (milestones = []) =>
    milestones.map(milestone => ({
      id: milestone.milestone_id,
      title: milestone.name,
      status: milestone.status,
      stages: transformStages(milestone.Stages),
    }));
  
  return {
    ...backendData,
    milestones: transformMilestones(backendData.milestones),
  };
};


const StudentDashboardPage = ({ userId }) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // A simplified data fetching effect, closer to your original code's structure.
    const fetchStudentData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await getStudentProgress(userId);
        const transformedData = transformData(data);
        setStudentData(transformedData);
      } catch (err) {
        console.error("Failed to fetch student data:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [userId]); // This effect runs whenever the userId changes.

  const handleStatusChange = async (path, newStatus) => {
    if (path.subtaskIndex !== undefined && studentData) {
      const subtask = studentData.milestones[path.milestoneIndex]
                        .stages[path.stageIndex]
                        .tasks[path.taskIndex]
                        .subtasks[path.subtaskIndex];
      try {
        await updateSubtaskStatus(subtask.id, newStatus);
        // Re-fetch data to ensure all parent statuses are updated
        const data = await getStudentProgress(userId);
        setStudentData(transformData(data));
      } catch (err) {
        console.error("Failed to update subtask:", err);
        alert("Could not update the subtask status.");
      }
    }
  };

  if (loading) {
    return <div className="dashboard-message">Loading student data...</div>;
  }

  if (error) {
    return <div className="dashboard-message error">Could not load student data. Please try again later.</div>;
  }

  // Handle case for new users with no milestones assigned
  if (!studentData || studentData.milestones.length === 0) {
    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">Welcome, {studentData?.name || 'Student'}</h2>
            <div className="dashboard-message info">
                <h3>Your journey begins now!</h3>
                <p>It looks like there are no milestones assigned to you yet. A faculty member will create your progress plan soon.</p>
            </div>
        </div>
    );
  }

  // This is the main display, just like your old version, which shows the milestones.
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

