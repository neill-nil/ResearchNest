import React, { useState } from 'react';
import './ProfileMenu.css';

const ProfileMenu = ({ user, onLogout, onProfileClick }) => {
  const [open, setOpen] = useState(false);

  const handleMenuToggle = () => setOpen(!open);

  return (
    <div className="profile-menu-container">
      <div className="profile-icon" onClick={handleMenuToggle}>
        <span role="img" aria-label="profile">👤</span>
      </div>
      {open && (
        <div className="profile-dropdown">
          <button className="profile-dropdown-item" onClick={() => { setOpen(false); onProfileClick(); }}>Profile</button>
          <button className="profile-dropdown-item" onClick={() => { setOpen(false); onLogout(); }}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
