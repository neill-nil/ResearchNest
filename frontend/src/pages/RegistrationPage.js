import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegistrationPage.css';

const RegistrationPage = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [studentId, setStudentId] = useState('');
  const [programme, setProgramme] = useState('');
  const [department, setDepartment] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const isStudentValid = role === 'student' && studentId && programme;
    const isAdminValid = role === 'admin' && department;

    if (name && email && password && (isStudentValid || isAdminValid)) {
      onRegister({ name, email, password, role, studentId, programme, department });
    } else {
      alert('Please fill out all required fields.');
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
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" required />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., student@example.com" required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a strong password" required />
          </div>
           <div className="input-group">
            <label htmlFor="role">I am a</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="admin">Faculty/Admin</option>
            </select>
          </div>

          {/* Conditional Fields for Student */}
          {role === 'student' && (
            <>
              <div className="input-group">
                <label htmlFor="studentId">Student ID</label>
                <input type="text" id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g., S12345" required={role === 'student'} />
              </div>
              <div className="input-group">
                <label htmlFor="programme">Programme</label>
                <input type="text" id="programme" value={programme} onChange={(e) => setProgramme(e.target.value)} placeholder="e.g., M.Tech CSE" required={role === 'student'} />
              </div>
            </>
          )}

          {/* Conditional Field for Faculty/Admin */}
          {role === 'admin' && (
            <div className="input-group">
              <label htmlFor="department">Department</label>
              <input type="text" id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Computer Science" required={role === 'admin'} />
            </div>
          )}

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

