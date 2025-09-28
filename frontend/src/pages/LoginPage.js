import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // Add state to track the selected role
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      // Pass the selected role along with email and password to the login handler
      onLogin({ email, password, role });
    } else {
      alert('Please enter email and password.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome to ResearchNest</h2>
        <p>Login to continue</p>
        <form onSubmit={handleSubmit}>
          {/* NEW: Role Selector Dropdown */}
          <div className="input-group">
            <label htmlFor="role">Login as</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="faculty">Faculty/Admin</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., student@example.com"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="login-button">Login</button>
        </form>
        <div className="navigation-link">
          <p>Don't have an account? <span onClick={() => navigate('/register')}>Register now</span></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
