import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyMsg, setVerifyMsg] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', avatar_url: '', background_url: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const avatarInputRef = useRef(null);
  const bgInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setFormData({
      full_name: user.full_name || '',
      avatar_url: user.avatar_url || '',
      background_url: user.background_url || '',
    });
    Promise.all([
      api.getEnrollments().then(setEnrollments).catch(console.error),
      api.getWebinars().then(setWebinars).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user, navigate]);

  const handleVerify = async () => {
    try {
      const result = await api.requestVerification();
      setVerifyMsg(result.message);
    } catch (err) {
      setVerifyMsg(err.message);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { url } = await api.uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatar_url: url }));
    } catch (err) {
      setSaveMsg('Ошибка загрузки аватара: ' + err.message);
    }
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { url } = await api.uploadAvatar(file);
      setFormData(prev => ({ ...prev, background_url: url }));
    } catch (err) {
      setSaveMsg('Ошибка загрузки фона: ' + err.message);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const updated = await api.updateProfile({
        full_name: formData.full_name || null,
        avatar_url: formData.avatar_url || null,
        background_url: formData.background_url || null,
      });
      setUser(updated);
      setEditMode(false);
      setSaveMsg('Профиль обновлён');
    } catch (err) {
      setSaveMsg('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const upcoming = webinars.filter(w => new Date(w.date) > new Date()).slice(0, 3);
  const avatarSrc = (user.avatar_url || formData.avatar_url)
    ? `${API_URL}${user.avatar_url || formData.avatar_url}`
    : null;
  const bgSrc = (user.background_url || formData.background_url)
    ? `${API_URL}${user.background_url || formData.background_url}`
    : null;

  return (
    <div className="profile-page">
      <div
        className="profile-header"
        style={bgSrc ? { backgroundImage: `url(${bgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            className="profile-avatar"
            onClick={() => editMode && avatarInputRef.current?.click()}
            style={{ cursor: editMode ? 'pointer' : 'default', overflow: 'hidden', position: 'relative' }}
            title={editMode ? 'Нажмите чтобы изменить аватар' : ''}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (user.full_name || user.username || '?')[0].toUpperCase()
            )}
            {editMode && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '12px', fontWeight: 600,
              }}>
                Изменить
              </div>
            )}
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
        </div>

        <div className="profile-info">
          {editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                className="form-input"
                placeholder="Имя и фамилия"
                value={formData.full_name}
                onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                style={{ marginBottom: 0 }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => bgInputRef.current?.click()}
                style={{ alignSelf: 'flex-start' }}
              >
                Изменить фон профиля
              </button>
              <input ref={bgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgUpload} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditMode(false); setSaveMsg(''); }}>
                  Отмена
                </button>
              </div>
              {saveMsg && <div style={{ fontSize: '12px', color: 'var(--success)' }}>{saveMsg}</div>}
            </div>
          ) : (
            <>
              <h2>{user.full_name || user.username}</h2>
              <p>{user.email}</p>
              <div className="profile-verify">
                {user.is_verified ? (
                  <span className="verified-badge">✓ Email подтверждён</span>
                ) : (
                  <>
                    <span className="unverified-badge">Email не подтверждён</span>
                    <button className="btn btn-sm btn-secondary" onClick={handleVerify}>
                      Подтвердить
                    </button>
                  </>
                )}
              </div>
              {verifyMsg && (
                <div className="alert alert-success" style={{ marginTop: '8px', fontSize: '12px' }}>
                  {verifyMsg}
                </div>
              )}
              {saveMsg && <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>{saveMsg}</div>}
            </>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          {!editMode && (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>
              Редактировать
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={logout}>Выйти</button>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 className="section-title" style={{ fontSize: '20px' }}>Ближайшие вебинары</h2>
          <div className="webinar-cards">
            {upcoming.map(w => (
              <div key={w.id} className="webinar-card">
                {w.image_url && (
                  <img
                    src={w.image_url.startsWith('http') ? w.image_url : `${API_URL}${w.image_url}`}
                    alt={w.title}
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
                  />
                )}
                <div className="webinar-card-date">
                  <span className="webinar-day">{new Date(w.date).getDate()}</span>
                  <span className="webinar-month">{new Date(w.date).toLocaleString('ru-RU', { month: 'short' })}</span>
                </div>
                <div className="webinar-card-info">
                  <h4>{w.title}</h4>
                  <p>{w.description}</p>
                  <div className="webinar-meta">
                    <span className="badge badge-blue">{w.platform === 'telegram' ? 'Telegram' : 'ВКонтакте'}</span>
                    <span>{new Date(w.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} МСК</span>
                  </div>
                </div>
                {w.link && (
                  <a href={w.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                    Участвовать
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="section-title">Обучение</h2>
      <p className="section-subtitle">Курсы, на которые вы записаны</p>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : enrollments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>Пока нет курсов</h3>
          <p>Запишитесь на курс, чтобы начать обучение</p>
          <Link to="/courses" className="btn btn-primary">Выбрать курс</Link>
        </div>
      ) : (
        <div className="courses-grid" style={{ marginTop: '24px' }}>
          {enrollments.map(enrollment => (
            <Link
              key={enrollment.id}
              to={`/courses/${enrollment.course.slug}`}
              className="course-card"
            >
              <img
                src={enrollment.course.image_url}
                alt={enrollment.course.title}
                className="course-card-image"
              />
              <div className="course-card-body">
                <span className="course-card-category">{enrollment.course.category}</span>
                <h3 className="course-card-title">{enrollment.course.title}</h3>
                <p className="course-card-desc">{enrollment.course.short_description}</p>
                <div className="course-card-footer">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>
                    Записан ✓
                  </span>
                  <span className="btn btn-primary btn-sm">Продолжить</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
