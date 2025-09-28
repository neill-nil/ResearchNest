import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Import Pages
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// Import Components 
import ProfileMenu from './components/ProfileMenu';
import ProfileModal from './components/ProfileModal';
import Toast from './components/Toast';
import './components/Toast.css';

// Import API services
import { loginUser, registerUser, logoutUser, getLoggedInUser } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = getLoggedInUser();
    if (loggedInUser) {
      setUser(loggedInUser);
    }
    setLoading(false);
  }, []);

  const pushToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const handleLogin = async (credentials) => {
    const { data, error } = await loginUser(credentials);

    if (error || !data?.token) {
      pushToast(error || 'Login failed. Please check your credentials.', 'error');
      return;
    }

    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    pushToast('Login successful!', 'success');

    if (data.user.role === 'student') {
      navigate('/dashboard');
    } else if (data.user.role === 'faculty') {
      navigate('/admin-dashboard');
    }
  };

  const handleRegister = async (userData) => {
    const { data, error } = await registerUser(userData);

    if (error) {
      pushToast(error || 'Registration failed. Please try again.', 'error');
      return;
    }

    pushToast(data.message || 'Registration successful!', 'success');
    navigate('/login');
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    navigate('/login');
    pushToast('Logged out successfully.', 'info');
  };

  const handleProfileClick = () => setProfileModalOpen(true);
  const handleCloseModal = () => setProfileModalOpen(false);

  if (loading) {
    return <div>Loading Application...</div>;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ResearchNest</h1>
        {user && (
          <ProfileMenu
            user={user}
            onLogout={handleLogout}
            onProfileClick={handleProfileClick}
          />
        )}
      </header>

      <main>
        <Routes>
          <Route 
            path="/login" 
            element={
              !user 
                ? <LoginPage onLogin={handleLogin} /> 
                : <Navigate to={user.role === 'student' ? "/dashboard" : "/admin-dashboard"} />
            } 
          />
          <Route 
            path="/register" 
            element={
              !user 
                ? <RegistrationPage onRegister={handleRegister} /> 
                : <Navigate to={user.role === 'student' ? "/dashboard" : "/admin-dashboard"} />
            } 
          />

          {/* Student Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              user && user.role === 'student' 
                ? <StudentDashboardPage user={user} /> 
                : <Navigate to="/login" />
            } 
          />

          {/* Faculty Dashboard */}
          <Route 
            path="/admin-dashboard" 
            element={
              user && user.role === 'faculty'
                ? <AdminDashboardPage user={user} />
                : <Navigate to="/login" />
            } 
          />

          <Route 
            path="*" 
            element={<Navigate to={user ? (user.role === 'student' ? "/dashboard" : "/admin-dashboard") : "/login"} />} 
          />
        </Routes>
      </main>

      {isProfileModalOpen && <ProfileModal user={user} onClose={handleCloseModal} />}

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
