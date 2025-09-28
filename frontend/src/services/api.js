// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const safeRequest = async (fn) => {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Unexpected error occurred';
    return { data: null, error: message };
  }
};

/* ------------------------- AUTH ------------------------- */
export const registerUser = (userData) => safeRequest(() => api.post('/users/register', userData));

export const loginUser = (credentials) => safeRequest(() => api.post('/users/login', credentials));

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getLoggedInUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};

/* ------------------------- FACULTY ------------------------- */
export const getAllStudents = () => safeRequest(() => api.get(`/faculty/students`));
export const getFacultyMilestones = (facultyId) => safeRequest(() => api.get(`/faculty/${facultyId}/milestones`));

/* ------------------------- STUDENT PROGRESS ------------------------- */
export const getStudentProgress = (studentId) => safeRequest(() => api.get(`/progress/${studentId}`));
export const getStudentSummary = (studentId) => safeRequest(() => api.get(`/progress/${studentId}/summary`));
export const getStudentNotes = (studentId) => safeRequest(() => api.get(`/notes/${studentId}`));

export const getStudentDashboard = async (studentId) => {
  // returns { data: { progress, summary, notes }, error }
  const [pRes, sRes, nRes] = await Promise.all([
    getStudentProgress(studentId),
    getStudentSummary(studentId),
    getStudentNotes(studentId),
  ]);

  const errors = [pRes?.error, sRes?.error, nRes?.error].filter(Boolean);
  if (errors.length) {
    return { data: null, error: errors.join(' | ') };
  }

  return { data: { progress: pRes.data, summary: sRes.data, notes: nRes.data }, error: null };
};

/* ------------------------- MILESTONES ------------------------- */
export const createMilestone = (milestoneData) => safeRequest(() => api.post('/milestones', milestoneData));
export const deleteMilestone = (milestoneId) => safeRequest(() => api.delete(`/milestones/${milestoneId}`));
export const updateMilestoneStatus = (milestoneId, status) =>
  safeRequest(() => api.patch(`/milestones/${milestoneId}/status`, { status }));
export const freezeMilestone = (milestoneId, freeze) =>
  safeRequest(() => api.patch(`/milestones/${milestoneId}/freeze`, { freeze }));

/* ------------------------- STAGES ------------------------- */
export const createStage = (stageData) => safeRequest(() => api.post('/stages', stageData));
export const deleteStage = (stageId) => safeRequest(() => api.delete(`/stages/${stageId}`));
export const updateStageStatus = (stageId, status) =>
  safeRequest(() => api.patch(`/stages/${stageId}/status`, { status }));

/* ------------------------- TASKS ------------------------- */
export const createTask = (taskData) => safeRequest(() => api.post('/tasks', taskData));
export const deleteTask = (taskId) => safeRequest(() => api.delete(`/tasks/${taskId}`));
export const updateTask = (taskId, updates) => safeRequest(() => api.patch(`/tasks/${taskId}`, updates));

/* ------------------------- SUBTASKS ------------------------- */
export const createSubtask = (subtaskData) => safeRequest(() => api.post('/subtasks', subtaskData));
export const deleteSubtask = (subtaskId) => safeRequest(() => api.delete(`/subtasks/${subtaskId}`));
export const updateSubtask = (subtaskId, updates) => safeRequest(() => api.patch(`/subtasks/${subtaskId}`, updates));

/* ------------------------- NOTES ------------------------- */
export const createNote = (noteData) => safeRequest(() => api.post('/notes', noteData));
export const deleteNote = (noteId) => safeRequest(() => api.delete(`/notes/${noteId}`));
