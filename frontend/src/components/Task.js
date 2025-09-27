import React, { useState } from 'react';
import Subtask from './Subtask';
import './Tracker.css';

const getStatusClass = (status) => {
  switch (status) {
    case 'Completed': return 'status-completed';
    case 'In Progress': return 'status-in-progress';
    case 'Locked': return 'status-locked';
    default: return '';
  }
};

const Task = ({ task, path, onStatusChange, isLocked }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const effectiveStatus = isLocked ? 'Locked' : task.status;

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const handleTaskStatusChange = () => {
    if (isLocked || hasSubtasks) return; // Cannot change status directly if it has subtasks
    const newStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
    onStatusChange(path, newStatus);
  };

  return (
    <div className={`tracker-item task ${getStatusClass(effectiveStatus)} ${isLocked ? 'locked-item' : ''}`}>
      <div className="item-header" onClick={() => hasSubtasks && setIsExpanded(!isExpanded)}>
        <div className="item-title-container">
           {hasSubtasks && <span className="item-icon">{isExpanded ? '▼' : '►'}</span>}
           <p className="item-title">Task: {task.title}</p>
        </div>
        {!hasSubtasks ? (
             <input 
                type="checkbox" 
                className='item-checkbox'
                checked={effectiveStatus === 'Completed'} 
                onChange={handleTaskStatusChange}
                disabled={isLocked}
            />
        ) : (
             <span className={`item-status ${getStatusClass(effectiveStatus)}`}>{effectiveStatus}</span>
        )}
      </div>
      {isExpanded && hasSubtasks && (
        <div className="item-children">
          {task.subtasks.map((subtask, subtaskIndex) => (
            <Subtask
              key={subtask.id}
              subtask={subtask}
              path={{ ...path, subtaskIndex }}
              onStatusChange={onStatusChange}
              isLocked={isLocked || subtask.status === 'Locked'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Task;
