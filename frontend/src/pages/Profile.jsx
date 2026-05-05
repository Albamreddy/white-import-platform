import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyMsg, setVerifyMsg] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
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

  if (!user) return null;

  const upcoming = webinars.filter(w => new Date(w.date) > new Date()).slice(0, 3);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {(user.full_name || user.username || '?')[0].toUpperCase()}
        </div>
        <div className="profile-info">
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
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Выйти</button>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 className="section-title" style={{ fontSize: '20px' }}>Ближайшие вебинары</h2>
          <div className="webinar-cards">
            {upcoming.map(w => (
              <div key={w.id} className="webinar-card">
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
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--success)',
                  }}>
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
