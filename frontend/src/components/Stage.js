import React, { useState } from 'react';
import Task from './Task';
import './Tracker.css';

const getStatusClass = (status) => {
  switch (status) {
    case 'Completed': return 'status-completed';
    case 'In Progress': return 'status-in-progress';
    case 'Locked': return 'status-locked';
    default: return '';
  }
};

const Stage = ({ stage, path, onStatusChange, isLocked }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const effectiveStatus = isLocked ? 'Locked' : stage.status;

  return (
    <div className={`tracker-item stage ${getStatusClass(effectiveStatus)} ${isLocked ? 'locked-item' : ''}`}>
      <div className="item-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="item-title-container">
           <span className="item-icon">{isExpanded ? '▼' : '►'}</span>
           <h4 className="item-title">Stage: {stage.title}</h4>
        </div>
        <span className={`item-status ${getStatusClass(effectiveStatus)}`}>{effectiveStatus}</span>
      </div>
      {isExpanded && (
        <div className="item-children">
          {stage.tasks.map((task, taskIndex) => (
            <Task
              key={task.id}
              task={task}
              path={{ ...path, taskIndex }}
              onStatusChange={onStatusChange}
              isLocked={isLocked || task.status === 'Locked'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Stage;
