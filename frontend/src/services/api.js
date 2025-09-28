import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* ------------------------- AUTH ------------------------- */
export const registerUser = async (userData) => {
  const payload = {
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role,
  };
  if (userData.role === 'student') payload.program = userData.program || '';
  if (userData.role === 'faculty') payload.department = userData.department || '';

  const response = await api.post('/users/register', payload);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/users/login', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getLoggedInUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/* ------------------------- FACULTY ------------------------- */
export const getAllStudents = async () => {
  const response = await api.get(`/faculty/students`);
  return response.data;
};

export const getFacultyMilestones = async (facultyId) => {
  const response = await api.get(`/faculty/${facultyId}/milestones`);
  return response.data;
};

/* ------------------------- STUDENT PROGRESS ------------------------- */
export const getStudentProgress = async (studentId) => {
  const response = await api.get(`/progress/${studentId}`);
  return response.data;
};

export const getStudentSummary = async (studentId) => {
  const response = await api.get(`/progress/${studentId}/summary`);
  return response.data;
};

export const getStudentNotes = async (studentId) => {
  const response = await api.get(`/notes/${studentId}`);
  return response.data;
};

export const getStudentDashboard = async (studentId) => {
  const [progress, summary, notes] = await Promise.all([
    getStudentProgress(studentId),
    getStudentSummary(studentId),
    getStudentNotes(studentId),
  ]);
  return { progress, summary, notes };
};

/* ------------------------- MILESTONES ------------------------- */
export const createMilestone = async (milestoneData) => {
  const response = await api.post('/milestones', milestoneData);
  return response.data;
};

export const deleteMilestone = async (milestoneId) => {
  const response = await api.delete(`/milestones/${milestoneId}`);
  return response.data;
};

export const updateMilestoneStatus = async (milestoneId, status) => {
  const response = await api.patch(`/milestones/${milestoneId}/status`, { status });
  return response.data;
};

export const freezeMilestone = async (milestoneId, freeze) => {
  const response = await api.patch(`/milestones/${milestoneId}/freeze`, { freeze });
  return response.data;
};

/* ------------------------- STAGES ------------------------- */
export const createStage = async (stageData) => {
  const response = await api.post('/stages', stageData);
  return response.data;
};

export const deleteStage = async (stageId) => {
  const response = await api.delete(`/stages/${stageId}`);
  return response.data;
};

export const updateStageStatus = async (stageId, status) => {
  const response = await api.patch(`/stages/${stageId}/status`, { status });
  return response.data;
};

/* ------------------------- TASKS ------------------------- */
export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export const updateTaskName = async (taskId, name) => {
  const response = await api.patch(`/tasks/${taskId}`, { name });
  return response.data;
};

/* ------------------------- SUBTASKS ------------------------- */
export const createSubtask = async (subtaskData) => {
  const response = await api.post('/subtasks', subtaskData);
  return response.data;
};

export const deleteSubtask = async (subtaskId) => {
  const response = await api.delete(`/subtasks/${subtaskId}`);
  return response.data;
};

export const updateSubtaskStatus = async (subtaskId, newStatus) => {
  const response = await api.patch(`/subtasks/${subtaskId}`, { status: newStatus });
  return response.data;
};

export const updateSubtaskName = async (subtaskId, name) => {
  const response = await api.patch(`/subtasks/${subtaskId}`, { name });
  return response.data;
};

/* ------------------------- NOTES ------------------------- */
export const createNote = async (noteData) => {
  const response = await api.post('/notes', noteData);
  return response.data;
};

export const deleteNote = async (noteId) => {
  const response = await api.delete(`/notes/${noteId}`);
  return response.data;
};
