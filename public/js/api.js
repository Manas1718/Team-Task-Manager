// API Helper for Ethara Task Manager
const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('ethara_token');
  },

  setAuth(token, user) {
    localStorage.setItem('ethara_token', token);
    localStorage.setItem('ethara_user', JSON.stringify(user));
  },

  getUser() {
    const u = localStorage.getItem('ethara_user');
    return u ? JSON.parse(u) : null;
  },

  clearAuth() {
    localStorage.removeItem('ethara_token');
    localStorage.removeItem('ethara_user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    };
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        this.clearAuth();
        window.location.hash = '';
        location.reload();
      }
      throw new Error(data.error || 'Request failed');
    }
    return data;
  },

  // Auth
  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: { email, password } });
  },
  signup(name, email, password, role) {
    return this.request('/auth/signup', { method: 'POST', body: { name, email, password, role } });
  },
  getMe() {
    return this.request('/auth/me');
  },
  getUsers() {
    return this.request('/auth/users');
  },

  // Dashboard
  getDashboard() {
    return this.request('/dashboard');
  },

  // Projects
  getProjects() {
    return this.request('/projects');
  },
  getProject(id) {
    return this.request(`/projects/${id}`);
  },
  createProject(data) {
    return this.request('/projects', { method: 'POST', body: data });
  },
  updateProject(id, data) {
    return this.request(`/projects/${id}`, { method: 'PUT', body: data });
  },
  deleteProject(id) {
    return this.request(`/projects/${id}`, { method: 'DELETE' });
  },
  addMember(projectId, userId, role) {
    return this.request(`/projects/${projectId}/members`, { method: 'POST', body: { user_id: userId, role } });
  },
  removeMember(projectId, userId) {
    return this.request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
  },

  // Tasks
  getTasks(query = '') {
    return this.request(`/tasks${query ? '?' + query : ''}`);
  },
  createTask(projectId, data) {
    return this.request(`/tasks/project/${projectId}`, { method: 'POST', body: data });
  },
  updateTask(id, data) {
    return this.request(`/tasks/${id}`, { method: 'PUT', body: data });
  },
  deleteTask(id) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  },
};
