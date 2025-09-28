import React, { useState } from 'react';
import Stage from './Stage';
import './Tracker.css';

// Utility function to get status class
const getStatusClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'status-completed';
    case 'In Progress':
      return 'status-in-progress';
    case 'Locked':
      return 'status-locked';
    default:
      return '';
  }
};


const Milestone = ({ milestone, milestoneIndex, onStatusChange, isLocked, isAdmin, onOverride }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const effectiveStatus = isLocked ? 'Locked' : milestone.status;
  const isOverridable = isAdmin && milestone.status !== 'Completed';

  return (
    <div className={`tracker-item milestone ${getStatusClass(effectiveStatus)} ${isLocked ? 'locked-item' : ''}`}>
      <div className="item-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="item-title-container">
           <span className="item-icon">{isExpanded ? '▼' : '►'}</span>
           <h3 className="item-title">Milestone: {milestone.title}</h3>
        </div>
        <div className='item-controls'>
            {isOverridable && <button className="override-button" onClick={(e) => { e.stopPropagation(); onOverride({milestoneIndex})}}>Override</button>}
            <span className={`item-status ${getStatusClass(effectiveStatus)}`}>{effectiveStatus}</span>
        </div>
      </div>
      {isExpanded && (
        <div className="item-children">
          {milestone.stages.map((stage, stageIndex) => (
            <Stage
              key={stage.id}
              stage={stage}
              path={{ milestoneIndex, stageIndex }}
              onStatusChange={onStatusChange}
              isLocked={isLocked || stage.status === 'Locked'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Milestone;
