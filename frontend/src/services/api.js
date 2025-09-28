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

// helper wrapper
const safeRequest = async (fn) => {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    const msg = err.response?.data?.message || err.message || "Unexpected error";
    return { data: null, error: msg };
  }
};

/* ------------------------- AUTH ------------------------- */
export const registerUser = (userData) =>
  safeRequest(() => api.post('/users/register', userData));

export const loginUser = (credentials) =>
  safeRequest(() => api.post('/users/login', credentials));

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getLoggedInUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/* ------------------------- FACULTY ------------------------- */
export const getAllStudents = () =>
  safeRequest(() => api.get(`/faculty/students`));

export const getFacultyMilestones = (facultyId) =>
  safeRequest(() => api.get(`/faculty/${facultyId}/milestones`));

/* ------------------------- STUDENT PROGRESS ------------------------- */
export const getStudentProgress = (studentId) =>
  safeRequest(() => api.get(`/progress/${studentId}`));

export const getStudentSummary = (studentId) =>
  safeRequest(() => api.get(`/progress/${studentId}/summary`));

export const getStudentNotes = (studentId) =>
  safeRequest(() => api.get(`/notes/${studentId}`));

export const getStudentDashboard = async (studentId) => {
  const [progress, summary, notes] = await Promise.all([
    getStudentProgress(studentId),
    getStudentSummary(studentId),
    getStudentNotes(studentId),
  ]);
  return { progress: progress.data, summary: summary.data, notes: notes.data };
};

/* ------------------------- MILESTONES ------------------------- */
export const createMilestone = (milestoneData) =>
  safeRequest(() => api.post('/milestones', milestoneData));

export const deleteMilestone = (milestoneId) =>
  safeRequest(() => api.delete(`/milestones/${milestoneId}`));

export const updateMilestoneStatus = (milestoneId, status) =>
  safeRequest(() => api.patch(`/milestones/${milestoneId}/status`, { status }));

export const freezeMilestone = (milestoneId, freeze) =>
  safeRequest(() => api.patch(`/milestones/${milestoneId}/freeze`, { freeze }));

/* ------------------------- STAGES ------------------------- */
export const createStage = (stageData) =>
  safeRequest(() => api.post('/stages', stageData));

export const deleteStage = (stageId) =>
  safeRequest(() => api.delete(`/stages/${stageId}`));

export const updateStageStatus = (stageId, status) =>
  safeRequest(() => api.patch(`/stages/${stageId}/status`, { status }));

/* ------------------------- TASKS ------------------------- */
export const createTask = (taskData) =>
  safeRequest(() => api.post('/tasks', taskData));

export const deleteTask = (taskId) =>
  safeRequest(() => api.delete(`/tasks/${taskId}`));

export const updateTask = (taskId, updates) =>
  safeRequest(() => api.patch(`/tasks/${taskId}`, updates));

/* ------------------------- SUBTASKS ------------------------- */
export const createSubtask = (subtaskData) =>
  safeRequest(() => api.post('/subtasks', subtaskData));

export const deleteSubtask = (subtaskId) =>
  safeRequest(() => api.delete(`/subtasks/${subtaskId}`));

export const updateSubtask = (subtaskId, updates) =>
  safeRequest(() => api.patch(`/subtasks/${subtaskId}`, updates));

/* ------------------------- NOTES ------------------------- */
export const createNote = (noteData) =>
  safeRequest(() => api.post('/notes', noteData));

export const deleteNote = (noteId) =>
  safeRequest(() => api.delete(`/notes/${noteId}`));
