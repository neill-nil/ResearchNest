import React from 'react';
import './Tracker.css';

const Subtask = ({ subtask, path, onStatusChange, isLocked }) => {

  const effectiveStatus = isLocked ? 'Locked' : subtask.status;

  const handleCheckboxChange = () => {
    if (isLocked) return;
    const newStatus = subtask.status === 'Completed' ? 'In Progress' : 'Completed';
    onStatusChange(path, newStatus);
  };

  return (
    <div className={`tracker-item subtask ${isLocked ? 'locked-item' : ''}`}>
        <label className='subtask-label'>
            <input 
                type="checkbox" 
                className='item-checkbox'
                checked={effectiveStatus === 'Completed'} 
                onChange={handleCheckboxChange}
                disabled={isLocked}
            />
            <span className="subtask-title">{subtask.title}</span>
        </label>
    </div>
  );
};

export default Subtask;
