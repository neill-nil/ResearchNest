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

// Import API services
import { loginUser, registerUser, logoutUser, getLoggedInUser } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = getLoggedInUser();
    if (loggedInUser) {
      setUser(loggedInUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const response = await loginUser(credentials);
      setUser(response.user);

      // redirect based on role
      if (response.user.role === 'student') {
        navigate('/dashboard');
      } else if (response.user.role === 'faculty') {
        navigate('/admin-dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      alert(errorMessage);
    }
  };

  const handleRegister = async (userData) => {
    try {
      const response = await registerUser(userData);
      alert(response.message || "Registration successful!");
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      alert(errorMessage);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    navigate('/login');
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
            element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to={user.role === 'student' ? "/dashboard" : "/admin-dashboard"} />} 
          />
          <Route 
            path="/register" 
            element={!user ? <RegistrationPage onRegister={handleRegister} /> : <Navigate to={user.role === 'student' ? "/dashboard" : "/admin-dashboard"} />} 
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
    </div>
  );
}

export default App;
