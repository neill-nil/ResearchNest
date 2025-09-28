import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

// --- AUTHENTICATION & USERS ---

export const registerUser = async (userData) => {
  try {
    const payload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role
    };

    if (userData.role === 'student') {
      payload.program = userData.program || userData.programme || '';
    } else if (userData.role === 'faculty') {
      payload.department = userData.department || '';
    }

    const response = await api.post('/users/register', payload);
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const loginUser = async (credentials) => {
  try {
    if (!credentials || !credentials.role) {
      throw new Error('Missing role in credentials. Call loginUser({ role, email, password })');
    }

    const response = await api.post('/users/login', credentials);

    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getLoggedInUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// --- DATA FETCHING ---

export const getAllStudentsForFaculty = async (facultyId) => {
  try {
    const response = await api.get(`/faculty/${facultyId}/students`);
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const getStudentProgress = async (studentId) => {
  try {
    const response = await api.get(`/progress/${studentId}`);
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const getStudentSummary = async (studentId) => {
  try {
    const response = await api.get(`/progress/${studentId}/summary`);
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const getStudentNotes = async (studentId) => {
  try {
    const response = await api.get(`/notes/${studentId}`);
    return response.data;
  } catch (err) {
    throw err;
  }
};

// Aggregator for student dashboard
export const getStudentDashboard = async (studentId) => {
  try {
    const [progress, summary, notes] = await Promise.all([
      getStudentProgress(studentId),
      getStudentSummary(studentId),
      getStudentNotes(studentId)
    ]);
    return { progress, summary, notes };
  } catch (err) {
    throw err;
  }
};

// --- DATA MODIFICATION ---

export const updateSubtaskStatus = async (subtaskId, newStatus) => {
  try {
    const response = await api.patch(`/subtasks/${subtaskId}`, { status: newStatus });
    return response.data;
  } catch (err) {
    throw err;
  }
};

export const approveMilestone = async (milestoneId) => {
  try {
    const response = await api.patch(`/milestones/${milestoneId}/approve`);
    return response.data;
  } catch (err) {
    throw err;
  }
};

// add more functions as needed...
