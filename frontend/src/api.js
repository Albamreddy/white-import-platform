const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  if (!options.isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Ошибка сервера');
  return data;
}

async function uploadFile(path, file) {
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Ошибка загрузки');
  return data;
}

function uploadFileWithProgress(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem('token');
    const form = new FormData();
    form.append('file', file);
    let startTime = Date.now();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? (e.loaded / 1024 / 1024 / elapsed) : 0;
        onProgress({ percent: pct, loaded: e.loaded, total: e.total, speed: speed.toFixed(1) });
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.detail || 'Ошибка загрузки'));
      } catch { reject(new Error('Ошибка загрузки')); }
    });

    xhr.addEventListener('error', () => reject(new Error('Ошибка сети')));
    xhr.open('POST', `${API_URL}${path}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(form);
  });
}

export const api = {
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/api/auth/me'),
  requestVerification: () => request('/api/auth/request-verification', { method: 'POST' }),
  verifyEmail: (token) => request('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  getCourses: (params = '') => request(`/api/courses${params ? '?' + params : ''}`),
  getCourse: (slug) => request(`/api/courses/${slug}`),
  getCategories: () => request('/api/categories'),
  enrollCourse: (slug) => request(`/api/courses/${slug}/enroll`, { method: 'POST' }),
  getEnrollments: () => request('/api/enrollments'),
  updateProgress: (enrollmentId, lessonId, progress) => request(`/api/enrollments/${enrollmentId}/progress`, { method: 'POST', body: JSON.stringify({ lesson_id: lessonId, progress }) }),

  // Upload
  uploadVideo: (file) => uploadFile('/api/upload/video', file),
  uploadVideoWithProgress: (file, onProgress) => uploadFileWithProgress('/api/upload/video', file, onProgress),
  uploadImage: (file) => uploadFile('/api/upload/image', file),

  // Admin
  getStats: () => request('/api/admin/stats'),
  getAdminUsers: () => request('/api/admin/users'),
  updateUser: (id, data) => request(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  getAdminCourses: () => request('/api/admin/courses'),
  createCourse: (data) => request('/api/admin/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => request(`/api/admin/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCourse: (id) => request(`/api/admin/courses/${id}`, { method: 'DELETE' }),
  createLesson: (courseId, data) => request(`/api/admin/courses/${courseId}/lessons`, { method: 'POST', body: JSON.stringify(data) }),
  updateLesson: (id, data) => request(`/api/admin/lessons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLesson: (id) => request(`/api/admin/lessons/${id}`, { method: 'DELETE' }),
  getAdminEnrollments: () => request('/api/admin/enrollments'),
  deleteEnrollment: (id) => request(`/api/admin/enrollments/${id}`, { method: 'DELETE' }),

  // Chat
  sendChat: (messages, sessionId) => request('/api/chat', { method: 'POST', body: JSON.stringify({ messages, session_id: sessionId }) }),
  injectManagerMessage: (sessionId, content) => request(`/api/admin/chat/${sessionId}/inject`, { method: 'POST', body: JSON.stringify({ content }) }),

  // 2FA
  request2FA: (email, password) => request('/api/auth/2fa/request', { method: 'POST', body: JSON.stringify({ email, password }) }),
  verify2FA: (email, code) => request('/api/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),

  // Reviews
  getReviews: () => request('/api/reviews'),
  createReview: (data) => request('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getAdminReviews: () => request('/api/admin/reviews'),
  updateReview: (id, data) => request(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteReview: (id) => request(`/api/admin/reviews/${id}`, { method: 'DELETE' }),

  // Webinars
  getWebinars: () => request('/api/webinars'),
  createWebinar: (data) => request('/api/admin/webinars', { method: 'POST', body: JSON.stringify(data) }),
  updateWebinar: (id, data) => request(`/api/admin/webinars/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteWebinar: (id) => request(`/api/admin/webinars/${id}`, { method: 'DELETE' }),

  // Calculator
  getCalcCategories: () => request('/api/calculator/categories'),
  calculate: (data) => request('/api/calculator', { method: 'POST', body: JSON.stringify(data) }),
};
