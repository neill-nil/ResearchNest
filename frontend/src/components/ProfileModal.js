import React from 'react';
import './ProfileModal.css';

const ProfileModal = ({ user, onClose }) => {
  if (!user) return null;
  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <h2>User Profile</h2>
        <div className="profile-details">
          <p><strong>Name:</strong> {user.name || 'N/A'}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          
          {user.programme && <p><strong>Programme:</strong> {user.programme}</p>}
          {user.department && <p><strong>Department:</strong> {user.department}</p>}
        </div>
        <button className="close-modal-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ProfileModal;
