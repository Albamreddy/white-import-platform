import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
    api.getAdminEnrollments().then(setEnrollments).catch(console.error);
  }, []);
  if (!stats) return <div className="loading"><div className="spinner" /></div>;

  const recentEnrollments = enrollments.slice(0, 5);

  return (
    <>
      <div className="admin-header"><h1>Дашборд</h1></div>
      <div className="stats-grid">
        <div className="stat-card stat-card-animated">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-value">{stats.total_users}</div>
          <div className="stat-card-label">Пользователей</div>
        </div>
        <div className="stat-card stat-card-animated">
          <div className="stat-card-icon">📚</div>
          <div className="stat-card-value">{stats.total_courses}</div>
          <div className="stat-card-label">Курсов</div>
        </div>
        <div className="stat-card stat-card-animated">
          <div className="stat-card-icon">📋</div>
          <div className="stat-card-value">{stats.total_enrollments}</div>
          <div className="stat-card-label">Записей</div>
        </div>
        <div className="stat-card stat-card-animated">
          <div className="stat-card-icon">✓</div>
          <div className="stat-card-value">{stats.verified_users}</div>
          <div className="stat-card-label">Верифицированных</div>
        </div>
        <div className="stat-card stat-card-animated">
          <div className="stat-card-icon">🌐</div>
          <div className="stat-card-value">{stats.published_courses}</div>
          <div className="stat-card-label">Опубликованных</div>
        </div>
      </div>

      {recentEnrollments.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Последние записи на курсы</h3>
          <div className="recent-list">
            {recentEnrollments.map(e => (
              <div key={e.id} className="recent-item">
                <div className="recent-avatar">{e.user?.email?.[0]?.toUpperCase()}</div>
                <div className="recent-info">
                  <div className="recent-name">{e.user?.full_name || e.user?.email}</div>
                  <div className="recent-detail">{e.course?.title}</div>
                </div>
                <div className="recent-meta">
                  <div className="progress-bar-mini">
                    <div className="progress-bar-fill" style={{ width: `${e.progress}%` }} />
                  </div>
                  <span className="recent-progress">{e.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.getAdminUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggle = async (id, field, value) => {
    await api.updateUser(id, { [field]: value });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Удалить пользователя?')) return;
    await api.deleteUser(id);
    load();
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="admin-header">
        <h1>Пользователи ({users.length})</h1>
        <div className="admin-search">
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th><th>Email</th><th>Имя</th><th>Статус</th><th>Курсы</th><th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.full_name || u.username}</td>
              <td>
                {u.is_admin && <span className="badge badge-blue">Админ</span>}
                {' '}
                {u.is_verified
                  ? <span className="badge badge-green">Верифицирован</span>
                  : <span className="badge badge-yellow">Не верифицирован</span>}
                {' '}
                {!u.is_active && <span className="badge badge-red">Заблокирован</span>}
              </td>
              <td>{u.enrollments_count}</td>
              <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button className="btn btn-xs btn-secondary" onClick={() => toggle(u.id, 'is_verified', !u.is_verified)}>
                  {u.is_verified ? 'Снять ✓' : 'Верифицировать'}
                </button>
                <button className="btn btn-xs btn-secondary" onClick={() => toggle(u.id, 'is_active', !u.is_active)}>
                  {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                </button>
                <button className="btn btn-xs btn-danger" onClick={() => remove(u.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function CoursePreview({ form }) {
  return (
    <div className="course-preview">
      <div className="course-preview-label">Предпросмотр</div>
      <div className="preview-card">
        {form.image_url ? (
          <img src={form.image_url} alt="" className="preview-card-image" />
        ) : (
          <div className="preview-card-image-placeholder">📷 Нет изображения</div>
        )}
        <div className="preview-card-body">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {form.category && <span className="course-card-category">{form.category}</span>}
            <span className={`difficulty-badge difficulty-${form.difficulty}`}>
              {form.difficulty === 'beginner' ? 'Начальный' : form.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
            </span>
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
            {form.title || 'Название курса'}
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {form.short_description || 'Краткое описание курса...'}
          </p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-light)', marginBottom: '12px' }}>
            <span>⏱ {form.duration_hours || 0} ч</span>
            <span>📚 {form.lessons_count || 0} уроков</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>
              {(form.price || 0).toLocaleString('ru-RU')} ₽
            </span>
            {form.old_price && (
              <span style={{ fontSize: '14px', textDecoration: 'line-through', color: 'var(--text-light)' }}>
                {parseFloat(form.old_price).toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoursesTab() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({});
  const [lessonForm, setLessonForm] = useState({});
  const [uploading, setUploading] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileRef = useRef(null);
  const imageRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.getAdminCourses().then(setCourses).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setForm({ title: '', slug: '', description: '', short_description: '', price: 0, old_price: '', image_url: '', category: '', difficulty: 'beginner', duration_hours: 0, lessons_count: 0, is_published: true, is_featured: false });
    setModal('create');
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setForm({ ...c, old_price: c.old_price || '' });
    setModal('edit');
  };

  const openLessons = (c) => {
    setEditCourse(c);
    setLessonForm({ title: '', description: '', content: '', video_url: '', order: (c.lessons?.length || 0) + 1, duration_minutes: 30, is_free: false });
    setModal('lessons');
  };

  const handleAutoSlug = (title) => {
    const slug = title.toLowerCase()
      .replace(/[а-яё]/g, c => ({
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y',
        'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
        'х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
      }[c] || c))
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setForm(f => ({ ...f, title, slug }));
  };

  const saveCourse = async () => {
    const data = { ...form, old_price: form.old_price ? parseFloat(form.old_price) : null, price: parseFloat(form.price), duration_hours: parseInt(form.duration_hours), lessons_count: parseInt(form.lessons_count) };
    if (modal === 'create') {
      await api.createCourse(data);
    } else {
      await api.updateCourse(editCourse.id, data);
    }
    setModal(null);
    load();
  };

  const removeCourse = async (id) => {
    if (!confirm('Удалить курс?')) return;
    await api.deleteCourse(id);
    load();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const result = await api.uploadImage(file);
      const url = `${API_URL}${result.url}`;
      setForm(f => ({ ...f, image_url: url }));
    } catch (err) {
      alert(err.message);
    }
    setImageUploading(false);
  };

  const handleVideoUpload = async (e, lessonId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(lessonId || 'new');
    setUploadProgress({ percent: 0, speed: '0' });
    try {
      const result = await api.uploadVideoWithProgress(file, (prog) => {
        setUploadProgress(prog);
      });
      const url = `${API_URL}${result.url}`;
      if (lessonId) {
        await api.updateLesson(lessonId, { video_url: url });
        load();
      } else {
        setLessonForm(f => ({ ...f, video_url: url }));
      }
    } catch (err) {
      alert(err.message);
    }
    setUploading('');
    setUploadProgress(null);
  };

  const addLesson = async () => {
    const data = { ...lessonForm, order: parseInt(lessonForm.order), duration_minutes: parseInt(lessonForm.duration_minutes) };
    await api.createLesson(editCourse.id, data);
    setLessonForm({ title: '', description: '', content: '', video_url: '', order: (editCourse.lessons?.length || 0) + 2, duration_minutes: 30, is_free: false });
    load();
    const updated = await api.getAdminCourses();
    setCourses(updated);
    setEditCourse(updated.find(c => c.id === editCourse.id));
  };

  const removeLesson = async (id) => {
    if (!confirm('Удалить урок?')) return;
    await api.deleteLesson(id);
    load();
    const updated = await api.getAdminCourses();
    setCourses(updated);
    setEditCourse(updated.find(c => c.id === editCourse.id));
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <div className="admin-header">
        <h1>Курсы ({courses.length})</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Новый курс</button>
      </div>

      <div className="courses-admin-grid">
        {courses.map(c => (
          <div key={c.id} className="course-admin-card">
            {c.image_url ? (
              <img src={c.image_url} alt="" className="course-admin-image" />
            ) : (
              <div className="course-admin-image-placeholder">📷</div>
            )}
            <div className="course-admin-body">
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                {c.is_published ? <span className="badge badge-green">Опубликован</span> : <span className="badge badge-red">Скрыт</span>}
                {c.is_featured && <span className="badge badge-blue">Featured</span>}
              </div>
              <h4 className="course-admin-title">{c.title}</h4>
              <div className="course-admin-meta">
                <span>{c.category}</span>
                <span>{c.price.toLocaleString('ru-RU')} ₽</span>
                <span>{c.lessons?.length || 0} уроков</span>
              </div>
              <div className="course-admin-actions">
                <button className="btn btn-xs btn-secondary" onClick={() => openEdit(c)}>Редактировать</button>
                <button className="btn btn-xs btn-primary" onClick={() => openLessons(c)}>Уроки ({c.lessons?.length || 0})</button>
                <button className="btn btn-xs btn-danger" onClick={() => removeCourse(c.id)}>Удалить</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Course Modal with Preview */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-split">
              <div className="modal-form-side">
                <h2>{modal === 'create' ? 'Новый курс' : 'Редактировать курс'}</h2>
                <div className="form-group">
                  <label>Название</label>
                  <input value={form.title} onChange={e => { if (modal === 'create') handleAutoSlug(e.target.value); else setForm({ ...form, title: e.target.value }); }} />
                </div>
                <div className="form-group">
                  <label>Slug (URL)</label>
                  <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Цена (₽)</label>
                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Старая цена (₽)</label>
                    <input type="number" value={form.old_price} onChange={e => setForm({ ...form, old_price: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Краткое описание</label>
                  <input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Полное описание</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Категория</label>
                    <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Сложность</label>
                    <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                      <option value="beginner">Начальный</option>
                      <option value="intermediate">Средний</option>
                      <option value="advanced">Продвинутый</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Часов</label>
                    <input type="number" value={form.duration_hours} onChange={e => setForm({ ...form, duration_hours: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Изображение курса</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      value={form.image_url}
                      onChange={e => setForm({ ...form, image_url: e.target.value })}
                      placeholder="URL или загрузите файл"
                      style={{ flex: 1 }}
                    />
                    <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {imageUploading ? '⏳' : '📷 Загрузить'}
                      <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                    Опубликован
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
                    Featured
                  </label>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setModal(null)}>Отмена</button>
                  <button className="btn btn-primary" onClick={saveCourse}>Сохранить</button>
                </div>
              </div>
              <CoursePreview form={form} />
            </div>
          </div>
        </div>
      )}

      {/* Lessons Modal with video preview */}
      {modal === 'lessons' && editCourse && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <h2>Уроки: {editCourse.title}</h2>

            {editCourse.lessons?.map(lesson => (
              <div key={lesson.id} className="lesson-admin-item">
                <div className="lesson-number">{lesson.order}</div>
                <div className="lesson-info" style={{ flex: 1 }}>
                  <div className="lesson-title">{lesson.title}</div>
                  <div className="lesson-meta">
                    {lesson.duration_minutes} мин
                    {lesson.video_url && ' · 🎥 Видео'}
                    {lesson.is_free && ' · Бесплатно'}
                  </div>
                  {lesson.video_url && (
                    <video
                      src={lesson.video_url}
                      className="lesson-video-preview"
                      controls
                      preload="metadata"
                    />
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <label className="btn btn-xs btn-secondary" style={{ cursor: 'pointer' }}>
                    {uploading === lesson.id ? '⏳' : '📹'}
                    <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleVideoUpload(e, lesson.id)} />
                  </label>
                  <button className="btn btn-xs btn-danger" onClick={() => removeLesson(lesson.id)}>✕</button>
                </div>
              </div>
            ))}

            <div className="add-lesson-form">
              <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Добавить урок</h3>
              <div className="form-group">
                <label>Название</label>
                <input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <input value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Порядок</label>
                  <input type="number" value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Длительность (мин)</label>
                  <input type="number" value={lessonForm.duration_minutes} onChange={e => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Видео</label>
                {lessonForm.video_url ? (
                  <div>
                    <video src={lessonForm.video_url} className="lesson-video-preview" controls preload="metadata" />
                    <button className="btn btn-xs btn-danger" style={{ marginTop: '8px' }} onClick={() => setLessonForm({ ...lessonForm, video_url: '' })}>Удалить видео</button>
                  </div>
                ) : (
                  <div className={`upload-zone ${uploading === 'new' ? 'uploading' : ''}`} onClick={() => fileRef.current?.click()}>
                    {uploading === 'new' ? '⏳ Загрузка...' : '📹 Нажмите чтобы загрузить видео'}
                    <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleVideoUpload(e)} />
                  </div>
                )}
                {uploading && uploadProgress && (
                  <div className="upload-progress">
                    <div className="upload-progress-bar">
                      <div className="upload-progress-fill" style={{ width: `${uploadProgress.percent}%` }} />
                    </div>
                    <div className="upload-progress-info">
                      <span>{uploadProgress.percent}%</span>
                      <span>{uploadProgress.speed} МБ/с</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Контент (текст)</label>
                <textarea rows={3} value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} style={{ resize: 'vertical' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
                <input type="checkbox" checked={lessonForm.is_free} onChange={e => setLessonForm({ ...lessonForm, is_free: e.target.checked })} />
                Бесплатный урок
              </label>

              <button className="btn btn-primary" onClick={addLesson} disabled={!lessonForm.title}>+ Добавить урок</button>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EnrollmentsTab() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    api.getAdminEnrollments().then(setEnrollments).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id) => {
    if (!confirm('Удалить запись?')) return;
    await api.deleteEnrollment(id);
    load();
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const filtered = enrollments.filter(e => {
    const matchSearch = (e.user?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.course?.title || '').toLowerCase().includes(search.toLowerCase());
    if (filter === 'completed') return matchSearch && e.progress >= 100;
    if (filter === 'in_progress') return matchSearch && e.progress > 0 && e.progress < 100;
    if (filter === 'not_started') return matchSearch && e.progress === 0;
    return matchSearch;
  });

  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
    : 0;
  const completedCount = enrollments.filter(e => e.progress >= 100).length;

  return (
    <>
      <div className="admin-header">
        <h1>Аналитика записей ({enrollments.length})</h1>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card stat-card-animated">
          <div className="stat-card-icon">📊</div>
          <div className="stat-card-value">{avgProgress}%</div>
          <div className="stat-card-label">Средний прогресс</div>
        </div>
        <div className="stat-card stat-card-animated">
          <div className="stat-card-icon">🏆</div>
          <div className="stat-card-value">{completedCount}</div>
          <div className="stat-card-label">Завершили курс</div>
        </div>
        <div className="stat-card stat-card-animated">
          <div className="stat-card-icon">📈</div>
          <div className="stat-card-value">{enrollments.length - completedCount}</div>
          <div className="stat-card-label">В процессе</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Поиск по email или курсу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <div className="filter-tabs">
          {[['all', 'Все'], ['in_progress', 'В процессе'], ['completed', 'Завершено'], ['not_started', 'Не начато']].map(([v, l]) => (
            <button key={v} className={`filter-tab ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Пользователь</th><th>Курс</th><th>Прогресс</th><th>Дата записи</th><th>Последний просмотр</th><th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(e => (
            <tr key={e.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="recent-avatar small">{e.user?.email?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{e.user?.full_name || e.user?.username}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{e.user?.email}</div>
                  </div>
                </div>
              </td>
              <td style={{ fontWeight: 600, color: 'var(--text)' }}>{e.course?.title}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="progress-bar-mini" style={{ width: '80px' }}>
                    <div className="progress-bar-fill" style={{
                      width: `${e.progress}%`,
                      background: e.progress >= 100 ? 'var(--success)' : e.progress > 0 ? 'var(--primary)' : 'var(--border)'
                    }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: e.progress >= 100 ? 'var(--success)' : 'var(--text)' }}>
                    {e.progress}%
                  </span>
                </div>
              </td>
              <td>{new Date(e.enrolled_at).toLocaleDateString('ru-RU')}</td>
              <td>{e.last_watched_at ? new Date(e.last_watched_at).toLocaleDateString('ru-RU') : '—'}</td>
              <td>
                <button className="btn btn-xs btn-danger" onClick={() => remove(e.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = () => {
    setLoading(true);
    api.getAdminReviews().then(setReviews).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (id) => {
    await api.updateReview(id, editForm);
    setEditId(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Удалить отзыв?')) return;
    await api.deleteReview(id);
    load();
  };

  const toggleApprove = async (r) => {
    await api.updateReview(r.id, { is_approved: !r.is_approved });
    load();
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <div className="admin-header"><h1>Отзывы ({reviews.length})</h1></div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th><th>Автор</th><th>Оценка</th><th>Текст</th><th>Статус</th><th>Дата</th><th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.author_name || '—'}</td>
              <td>{'★'.repeat(r.rating)}</td>
              <td>
                {editId === r.id ? (
                  <textarea value={editForm.text} onChange={e => setEditForm({...editForm, text: e.target.value})} rows={2} style={{ width: '100%', fontSize: '13px' }} />
                ) : (
                  <span style={{ maxWidth: '300px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.text}</span>
                )}
              </td>
              <td>
                {r.is_approved
                  ? <span className="badge badge-green">Одобрен</span>
                  : <span className="badge badge-yellow">На модерации</span>}
              </td>
              <td>{new Date(r.created_at).toLocaleDateString('ru-RU')}</td>
              <td style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {editId === r.id ? (
                  <>
                    <button className="btn btn-xs btn-primary" onClick={() => save(r.id)}>Сохранить</button>
                    <button className="btn btn-xs btn-secondary" onClick={() => setEditId(null)}>Отмена</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-xs btn-secondary" onClick={() => { setEditId(r.id); setEditForm({ text: r.text, rating: r.rating }); }}>Ред.</button>
                    <button className="btn btn-xs btn-secondary" onClick={() => toggleApprove(r)}>
                      {r.is_approved ? 'Скрыть' : 'Одобрить'}
                    </button>
                    <button className="btn btn-xs btn-danger" onClick={() => remove(r.id)}>Удалить</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function WebinarsTab() {
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', platform: 'telegram', link: '', is_active: true });

  const load = () => {
    setLoading(true);
    api.getWebinars().then(setWebinars).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    await api.createWebinar({ ...form, date: new Date(form.date).toISOString() });
    setForm({ title: '', description: '', date: '', platform: 'telegram', link: '', is_active: true });
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Удалить вебинар?')) return;
    await api.deleteWebinar(id);
    load();
  };

  const toggleActive = async (w) => {
    await api.updateWebinar(w.id, { is_active: !w.is_active });
    load();
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <div className="admin-header">
        <h1>Вебинары ({webinars.length})</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Добавить вебинар'}
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card" style={{ marginBottom: '24px' }}>
          <div className="form-group">
            <label>Название</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Тема вебинара" />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Краткое описание" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Дата и время</label>
              <input type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Платформа</label>
              <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text)' }}>
                <option value="telegram">Telegram</option>
                <option value="vk">ВКонтакте</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Ссылка</label>
            <input value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://t.me/..." />
          </div>
          <button className="btn btn-primary" onClick={create} disabled={!form.title || !form.date}>
            Создать вебинар
          </button>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th><th>Название</th><th>Дата</th><th>Платформа</th><th>Статус</th><th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {webinars.map(w => (
            <tr key={w.id}>
              <td>{w.id}</td>
              <td>{w.title}</td>
              <td>{new Date(w.date).toLocaleString('ru-RU')}</td>
              <td>{w.platform === 'telegram' ? 'Telegram' : 'ВКонтакте'}</td>
              <td>
                {w.is_active
                  ? <span className="badge badge-green">Активный</span>
                  : <span className="badge badge-red">Неактивный</span>}
              </td>
              <td style={{ display: 'flex', gap: '4px' }}>
                <button className="btn btn-xs btn-secondary" onClick={() => toggleActive(w)}>
                  {w.is_active ? 'Скрыть' : 'Показать'}
                </button>
                <button className="btn btn-xs btn-danger" onClick={() => remove(w.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    if (!user?.is_admin) navigate('/');
  }, [user, navigate]);

  if (!user?.is_admin) return null;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">Админ-панель</div>
        <button className={`admin-nav-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
          <span className="nav-icon">📊</span> Дашборд
        </button>
        <button className={`admin-nav-item ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <span className="nav-icon">👥</span> Пользователи
        </button>
        <button className={`admin-nav-item ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')}>
          <span className="nav-icon">📚</span> Курсы
        </button>
        <button className={`admin-nav-item ${tab === 'enrollments' ? 'active' : ''}`} onClick={() => setTab('enrollments')}>
          <span className="nav-icon">📈</span> Аналитика
        </button>
        <button className={`admin-nav-item ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          <span className="nav-icon">⭐</span> Отзывы
        </button>
        <button className={`admin-nav-item ${tab === 'webinars' ? 'active' : ''}`} onClick={() => setTab('webinars')}>
          <span className="nav-icon">📡</span> Вебинары
        </button>
      </aside>
      <div className="admin-content">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'users' && <UsersTab />}
        {tab === 'courses' && <CoursesTab />}
        {tab === 'enrollments' && <EnrollmentsTab />}
        {tab === 'reviews' && <ReviewsTab />}
        {tab === 'webinars' && <WebinarsTab />}
      </div>
    </div>
  );
}
