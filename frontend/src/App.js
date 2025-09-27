
import React, { useState } from 'react';
import ProfileMenu from './components/ProfileMenu';
import ProfileModal from './components/ProfileModal';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import RegistrationPage from './pages/RegistrationPage';
import { registerUser, getUserByEmail } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (credentials) => {
    const foundUser = getUserByEmail(credentials.email);
    if (foundUser) {
      setUser({
        email: foundUser.email,
        role: foundUser.role,
        name: foundUser.name,
        studentId: foundUser.studentId,
        programme: foundUser.programme,
        department: foundUser.department
      });
    } else {
      alert('Login failed: No user found with that email.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowProfile(false);
  };

  const handleRegistration = (userData) => {
    const { success, user: newUser, message } = registerUser(userData);
    if (success) {
      alert('Registration successful! Please log in with your credentials.');
      navigate('/login');
    } else {
      alert(`Registration failed: ${message}`);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ResearchNest</h1>
        {user && (
          <ProfileMenu
            user={user}
            onLogout={handleLogout}
            onProfileClick={() => setShowProfile(true)}
          />
        )}
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/login" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <RegistrationPage onRegister={handleRegistration} />} />
          <Route 
            path="/student/dashboard" 
            element={user && user.role === 'student' ? <StudentDashboardPage userEmail={user.email} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin/dashboard" 
            element={user && user.role === 'admin' ? <AdminDashboardPage /> : <Navigate to="/login" />} 
          />
          {/* Default route redirects authenticated users to their dashboard, others to login */}
          <Route path="*" element={<Navigate to={user ? `/${user.role}/dashboard` : "/login"} />} />
        </Routes>
        {showProfile && (
          <ProfileModal user={user} onClose={() => setShowProfile(false)} />
        )}
      </main>
    </div>
  );
}


export default App;

