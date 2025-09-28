import axios from 'axios';

// Create an Axios instance to communicate with the backend
const api = axios.create({
    baseURL: '/api' // This will be prefixed by the proxy in package.json
});

// Use an interceptor to automatically add the JWT token to all requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// --- AUTHENTICATION & USERS ---

export const registerUser = async (userData) => {
    const payload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      program: userData.programme, // Frontend 'programme' -> Backend 'program'
    };
    const response = await api.post('/users/register', payload);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await api.post('/users/login', credentials);
    if (response.data.token) {
        // Store token and user info upon successful login
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


// --- DATA FETCHING ---

/**
 * Fetches all students associated with a specific faculty member's department.
 * @param {string} facultyId - The ID of the faculty member.
 */
export const getAllStudentsForFaculty = async (facultyId) => {
    const response = await api.get(`/faculty/${facultyId}/students`);
    return response.data;
};

/**
 * Fetches the entire progress hierarchy (milestones, stages, etc.) for a student.
 * @param {string} studentId - The ID of the student.
 */
export const getStudentProgress = async (studentId) => {
    const response = await api.get(`/progress/${studentId}`);
    return response.data;
};


// --- DATA MODIFICATION ---

/**
 * Updates the status of a specific subtask.
 * @param {number} subtaskId - The ID of the subtask.
 * @param {string} newStatus - The new status (e.g., "Completed").
 */
export const updateSubtaskStatus = async (subtaskId, newStatus) => {
    const response = await api.patch(`/subtasks/${subtaskId}`, { status: newStatus });
    return response.data;
};

/**
 * Approves a milestone, likely marking it and all its children as complete.
 * This is an admin/faculty only action.
 * @param {number} milestoneId - The ID of the milestone to approve.
 */
export const approveMilestone = async (milestoneId) => {
    const response = await api.patch(`/milestones/${milestoneId}/approve`);
    return response.data;
};

// NOTE: You can add more functions here as needed, for example:
// export const updateTaskStatus = async (taskId, newStatus) => { ... };
// export const createTask = async (taskData) => { ... };
