// src/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Drop this file in your React  src/  folder.
// Replace every localStorage call and hardcoded data with these functions.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:5000/api';

// ── Token / user helpers ─────────────────────────────────────────────────────
export const saveToken  = (t) => localStorage.setItem('token', t);
export const getToken   = ()  => localStorage.getItem('token');
export const removeToken= ()  => localStorage.removeItem('token');
export const saveUser   = (u) => localStorage.setItem('user', JSON.stringify(u));
export const getUser    = ()  => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
export const removeUser = ()  => localStorage.removeItem('user');

// ── Internal fetch ───────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  // Only set JSON content-type when we are not sending FormData.
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      removeToken(); removeUser();
      window.location.reload();
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH  ←  used in AuthForm.js
// ═══════════════════════════════════════════════════════════════════════════════
export const authAPI = {

  /**
   * Login → saves token+user to localStorage, returns user object.
   * Replace the  login()  function in AuthForm.js:
   *
   *   const user = await authAPI.login(email, password, role);
   *   setDashboard(user.role);
   */
  login: async (email, password, role) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    saveToken(data.token);
    saveUser(data.user);
    return data.user;
  },

  /**
   * Signup
   *   await authAPI.signup({ name, email, password, role, enroll, course, semester });
   */
  signup: async (fields) =>
    api('/auth/signup', { method: 'POST', body: JSON.stringify(fields) }),

  /**
   * Forgot password (demo: confirms email)
   *   await authAPI.forgotPassword(email);
   */
  forgotPassword: async (email) =>
    api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  /** Logout — clears state */
  logout: () => { removeToken(); removeUser(); },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT  ←  used in StudentDashboard.js, ProfilePage.js
// ═══════════════════════════════════════════════════════════════════════════════
export const studentAPI = {

  /** Get own profile → replaces localStorage.getItem('profile') */
  getProfile: () => api('/student/profile'),

  /**
   * Update profile → replaces localStorage.setItem('profile', ...)
   *   await studentAPI.updateProfile({ name, phone, dob, gender, address, ... profileImage });
   */
  updateProfile: (fields) =>
    api('/student/profile', { method: 'PUT', body: JSON.stringify(fields) }),

  /**
   * Get marks for a semester/exam combination.
   * Replaces the allSubjectsData object in StudentDashboard.js.
   *   const rows = await studentAPI.getMarks({ semester: 'Sem1', exam_type: 'CIE1' });
   *   // rows = [{ subject, marks, max_marks, pct, exam_type, semester }, ...]
   */
  getMarks: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return api(`/student/marks${qs ? '?' + qs : ''}`);
  },

  /** Summary for analysis/progress views */
  getMarksSummary: () => api('/student/marks/summary'),

  /**
   * Announcements → replaces the announcements prop.
   *   const anns = await studentAPI.getAnnouncements();
   */
  getAnnouncements: () => api('/student/announcements').then(data => Array.isArray(data) ? data : []),

  /**
   * Submit a concern → replaces localStorage "student_queries" write in StudentDashboard.js
   *   await studentAPI.postConcern({ subject, examType, marksObtained, description });
   */
  postConcern: (data) =>
    api('/student/concerns', { method: 'POST', body: JSON.stringify(data) }),

  /**
   * Fetch own concern history → replaces loadConcerns() from localStorage
   *   const concerns = await studentAPI.getConcerns();
   */
  getConcerns: () => api('/student/concerns'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// FACULTY  ←  used in FacultyDashboard.js
// ═══════════════════════════════════════════════════════════════════════════════
export const facultyAPI = {

  /** Profile */
  getProfile:    ()      => api('/faculty/profile'),
  updateProfile: (data)  => api('/faculty/profile', { method: 'PUT', body: JSON.stringify(data) }),

  /**
   * Get faculty's subject allocations (courses, semesters, subjects, sections)
   * Replaces hardcoded dropdowns in FacultyDashboard.js
   */
  getAllocations: () => api('/faculty/allocations'),

  /**
   * Get student list for a course/semester.
   * Replaces allMarksData filtering in FacultyDashboard.js
   */
  getStudents: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return api(`/faculty/students${qs ? '?' + qs : ''}`);
  },

  /** Get subjects for dropdowns */
  getSubjects: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return api(`/faculty/subjects${qs ? '?' + qs : ''}`);
  },

  /**
   * Get marks grid for the upload/results table.
   * ?course=MCA&semester=Sem1&subject_id=1&exam_type=CIE1
   */
  getMarks: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return api(`/faculty/marks${qs ? '?' + qs : ''}`);
  },

  /**
   * Enter / update one student's marks.
   * Replaces handleUpdateMarks in FacultyDashboard.js
   *   await facultyAPI.enterMarks({ student_id, subject_id, exam_type, marks, max_marks });
   */
  enterMarks: (entry) =>
    api('/faculty/marks', { method: 'POST', body: JSON.stringify(entry) }),

  /**
   * Bulk upload after clicking "Save All".
   *   await facultyAPI.enterMarksBulk(entries);
   *   // entries = [{ student_id, subject_id, exam_type, marks }, ...]
   */
  enterMarksBulk: (entries) =>
    api('/faculty/marks/bulk', { method: 'POST', body: JSON.stringify({ entries }) }),

  /**
   * Final result table for ViewResults / class overview.
   * Returns { students, subjects }
   */
  getClassResults: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return api(`/faculty/class-results${qs ? '?' + qs : ''}`);
  },

  /** Remove mark entry by id */
  deleteMark: (id) => api(`/faculty/marks/${id}`, { method: 'DELETE' }),

  /** Announcements */
  getAnnouncements:    ()      => api('/faculty/announcements'),
  postAnnouncement:    (data, file)  => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('message', data.message);
    formData.append('type', data.type || 'Notice');
    formData.append('course', data.course);
    formData.append('semester', data.semester);
    formData.append('subject', data.subject);
    formData.append('class', data.class || 'All');
    if (file) {
      formData.append('file', file);
    }
    
    // Send FormData with authentication
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    return fetch(`${BASE}/faculty/announcements`, {
      method: 'POST',
      headers,
      body: formData
    }).then(async res => {
      // Try to parse JSON response
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        // Response might not be JSON
        data = { error: res.statusText || 'Request failed' };
      }
      
      if (res.status === 401) {
        removeToken(); removeUser();
        window.location.reload();
      }
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Request failed`);
      }
      
      return data;
    }).catch(error => {
      console.error('postAnnouncement error:', error);
      throw error;
    });
  },
  deleteAnnouncement:  (id)    => api(`/faculty/announcements/${id}`, { method: 'DELETE' }),

  /**
   * Update a mark by mark_id (admin/faculty)
   */
  updateMark: (mark_id, data) =>
    api(`/faculty/marks/${mark_id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN  ←  used in AdminDashboard.js
// ═══════════════════════════════════════════════════════════════════════════════
export const adminAPI = {
  /** Dashboard stat cards */
  getStats: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return api(`/admin/stats${qs ? '?'+qs : ''}`);
  },

  /** User management */
  getUsers: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return api(`/admin/users${qs ? '?'+qs : ''}`);
  },
  createUser: (data) => api('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (id) => api(`/admin/users/${id}`, { method: 'DELETE' }),

  /** Subjects (admin pages may use this later) */
  getSubjects: () => api('/admin/subjects'),
  addSubject: (s) => api('/admin/subjects', { method: 'POST', body: JSON.stringify(s) }),
  deleteSubject: (id) => api(`/admin/subjects/${id}`, { method: 'DELETE' }),

  /** Leaderboard */
  getLeaderboard: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return api(`/admin/leaderboard${qs ? '?'+qs : ''}`);
  },

  /** Announcements */
  getAnnouncements: () => api('/admin/announcements'),
  postAnnouncement: (data, file) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    if (file) formData.append('attachment', file);
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${BASE}/admin/announcements`, {
      method: 'POST',
      headers,
      body: formData
    }).then(async res => {
      let data = {};
      try { data = await res.json(); } catch { data = { error: res.statusText || 'Request failed' }; }
      if (res.status === 401) { removeToken(); removeUser(); window.location.reload(); }
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}: Request failed`);
      return data;
    });
  },

  /** Analytics */
  getAnalytics: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return api(`/admin/analytics${qs ? '?'+qs : ''}`);
  },

  /** Admin profile */
  getProfile: () => api('/admin/profile'),
  updateProfile: (data) => api('/admin/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export default { authAPI, studentAPI, facultyAPI, adminAPI };
