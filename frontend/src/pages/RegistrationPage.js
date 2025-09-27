import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegistrationPage.css';

const RegistrationPage = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState(''); 
  const [role, setRole] = useState('student');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (name && email && password && role && (role === 'admin' || studentId)) {
      onRegister({ name, email, password, role, studentId });
    } else {
      alert('Please fill out all fields, including Student ID for students.');
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <h2>Create Your Account</h2>
        <p>Join ResearchNest to track your academic progress</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Doe"
              required
            />
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
           {/* Conditionally render Student ID input only if role is 'student' */}
          {role === 'student' && (
            <div className="input-group">
                <label htmlFor="studentId">Student ID</label>
                <input
                type="text"
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., S2023001"
                required
                />
            </div>
           )}
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              required
            />
          </div>
           <div className="input-group">
            <label htmlFor="role">I am a</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="admin">Faculty/Admin</option>
            </select>
          </div>
          <button type="submit" className="register-button">Create Account</button>
        </form>
        <div className="navigation-link">
          <p>Already have an account? <span onClick={() => navigate('/login')}>Login</span></p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;

