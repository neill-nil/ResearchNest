import React, { useState, useEffect } from 'react';
import { getStudentDashboard, updateSubtaskStatus } from '../services/api';
import Milestone from '../components/Milestone';
import './Dashboard.css';

// Transformer to adapt backend → frontend
const transformData = (backendData) => {
  if (!backendData || !Array.isArray(backendData.milestones)) {
    return { ...backendData, milestones: [] };
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

const StudentDashboardPage = ({ user }) => {
  const [studentData, setStudentData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const { progress, summary, notes } = await getStudentDashboard(user.id);
        setStudentData(transformData(progress));
        setSummary(summary);
        setNotes(notes);
      } catch (err) {
        console.error("Failed to fetch student dashboard:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const handleStatusChange = async (path, newStatus) => {
    if (path.subtaskIndex !== undefined && studentData) {
      const subtask = studentData.milestones[path.milestoneIndex]
        .stages[path.stageIndex]
        .tasks[path.taskIndex]
        .subtasks[path.subtaskIndex];

      try {
        await updateSubtaskStatus(subtask.id, newStatus);

        // Re-fetch to update parent statuses too
        const { progress } = await getStudentDashboard(user.id);
        setStudentData(transformData(progress));
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
    return (
      <div className="dashboard-message error">
        Could not load student data. Please try again later.
      </div>
    );
  }

  if (!studentData || studentData.milestones.length === 0) {
    return (
      <div className="dashboard-container">
        <h2 className="dashboard-title">Welcome, {studentData?.name || user.name}</h2>
        <div className="dashboard-message info">
          <h3>Your journey begins now!</h3>
          <p>
            It looks like there are no milestones assigned to you yet. A faculty
            member will create your progress plan soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Welcome, {user.name}</h2>
      <p className="dashboard-subtitle">Here is your academic progress track.</p>

      {/* ✅ Summary Section */}
      {summary && (
        <div className="summary-section">
          <h3>Progress Summary</h3>
          <ul>
            <li>Total milestones: {summary.totalMilestones}</li>
            <li>Completed: {summary.completedMilestones}</li>
            <li>In Progress: {summary.inProgressMilestones}</li>
            <li>Pending Approval: {summary.pendingApprovalMilestones}</li>
          </ul>
        </div>
      )}

      {/* ✅ Milestones Tree */}
      <div className="milestones-container">
        {studentData.milestones.map((milestone, index) => (
          <Milestone
            key={milestone.id}
            milestone={milestone}
            milestoneIndex={index}
            onStatusChange={handleStatusChange}
            isLocked={
              index > 0 &&
              studentData.milestones[index - 1].status !== 'Completed'
            }
            isAdmin={false}
          />
        ))}
      </div>

      {/* ✅ Notes Section */}
      {notes.length > 0 && (
        <div className="notes-section">
          <h3>Faculty Notes</h3>
          <ul>
            {notes.map((note) => (
              <li key={note.note_id}>
                <strong>{note.created_at}:</strong> {note.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StudentDashboardPage;
