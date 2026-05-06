import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

const difficultyLabels = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

function ProtectedVideo({ src, userId }) {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const videoUrl = src.startsWith('http') ? src : `${apiBase}${src}`;

  return (
    <div className="video-protected" onContextMenu={(e) => e.preventDefault()}>
      <video
        key={videoUrl}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        style={{ width: '100%', borderRadius: '8px', display: 'block' }}
        src={videoUrl}
        autoPlay
      />
      <div className="video-watermark-corner">
        ID: {userId || '***'} · БЕЛЫЙ ВВОЗ
      </div>
    </div>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [message, setMessage] = useState('');
  const [activeLesson, setActiveLesson] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getCourse(slug)
      .then(data => {
        setCourse(data);
        if (user) {
          api.getEnrollments().then(enrollments => {
            setEnrolled(enrollments.some(e => e.course_id === data.id));
          }).catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, user]);

  const handleEnroll = async () => {
    if (!user) {
      window.location.href = '/#/login';
      return;
    }
    setEnrolling(true);
    try {
      await api.enrollCourse(slug);
      setEnrolled(true);
      setMessage('Вы успешно записались на курс!');
      const updated = await api.getCourse(slug);
      setCourse(updated);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="loading" style={{ minHeight: '50vh' }}><div className="spinner" /></div>;
  }

  if (!course) {
    return (
      <div className="empty-state" style={{ minHeight: '50vh' }}>
        <div className="empty-state-icon">🔍</div>
        <h3>Курс не найден</h3>
        <Link to="/courses" className="btn btn-primary">К каталогу</Link>
      </div>
    );
  }

  const discount = course.old_price
    ? Math.round((1 - course.price / course.old_price) * 100)
    : 0;

  return (
    <>
      <section className="course-detail-hero">
        <div className="course-detail-inner">
          <div className="course-detail-info">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span className="course-card-category">{course.category}</span>
              <span className={`difficulty-badge difficulty-${course.difficulty}`}>
                {difficultyLabels[course.difficulty]}
              </span>
            </div>
            <h1>{course.title}</h1>
            <p>{course.short_description}</p>
            <div className="course-detail-stats">
              <div className="course-detail-stat">
                <strong>{course.duration_hours} ч</strong>
                <span>Длительность</span>
              </div>
              <div className="course-detail-stat">
                <strong>{course.lessons_count}</strong>
                <span>Уроков</span>
              </div>
              <div className="course-detail-stat">
                <strong>{course.lessons.filter(l => l.is_free).length}</strong>
                <span>Бесплатных</span>
              </div>
            </div>
          </div>

          <div className="course-sidebar">
            <div className="course-sidebar-price">
              <span className="price-current">{course.price.toLocaleString('ru-RU')} ₽</span>
              {course.old_price && (
                <span className="price-old">{course.old_price.toLocaleString('ru-RU')} ₽</span>
              )}
              {discount > 0 && (
                <span className="price-discount">-{discount}%</span>
              )}
            </div>

            {message && (
              <div className={`alert ${enrolled ? 'alert-success' : 'alert-error'}`}>
                {message}
              </div>
            )}

            {enrolled ? (
              <div className="alert alert-success">
                Вы записаны на этот курс
              </div>
            ) : (
              <button
                className="btn btn-accent btn-lg btn-block"
                onClick={handleEnroll}
                disabled={enrolling}
                style={{ marginTop: '16px' }}
              >
                {enrolling ? 'Записываем...' : 'Записаться на курс'}
              </button>
            )}

            <ul className="course-sidebar-features">
              <li>{course.duration_hours} часов видео-уроков</li>
              <li>{course.lessons_count} практических уроков</li>
              <li>Доступ навсегда</li>
              <li>Сертификат о прохождении</li>
              <li>Поддержка в Telegram</li>
            </ul>

            {!user && (
              <Link to="/register" className="btn btn-secondary btn-block" style={{ marginTop: '8px' }}>
                Создать аккаунт
              </Link>
            )}
          </div>
        </div>
      </section>

      {activeLesson && activeLesson.video_url && (
        <section key={activeLesson.id} className="section" style={{ paddingBottom: '0' }}>
          <h2 className="section-title" style={{ marginBottom: '8px' }}>
            Урок {activeLesson.order}: {activeLesson.title}
          </h2>
          <ProtectedVideo src={activeLesson.video_url} userId={user?.id} />
        </section>
      )}

      <section className="section">
        <h2 className="section-title" style={{ marginBottom: '8px' }}>О курсе</h2>
        <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', maxWidth: '800px', marginBottom: '48px', lineHeight: '1.8' }}>
          {course.description}
        </p>

        <h2 className="section-title" style={{ marginBottom: '24px' }}>Программа курса</h2>
        <div className="lessons-list">
          {course.lessons.map(lesson => (
            <div
              key={lesson.id}
              className={`lesson-item ${activeLesson?.id === lesson.id ? 'lesson-active' : ''}`}
              onClick={() => {
                if (lesson.video_url || lesson.is_free || enrolled) {
                  setActiveLesson(lesson);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              style={{ cursor: (lesson.video_url || lesson.is_free || enrolled) ? 'pointer' : 'default' }}
            >
              <div className="lesson-number">{lesson.order}</div>
              <div className="lesson-info">
                <div className="lesson-title">{lesson.title}</div>
                <div className="lesson-meta">
                  {lesson.description} · {lesson.duration_minutes} мин
                </div>
              </div>
              {lesson.is_free ? (
                <span className="lesson-badge-free">Бесплатно</span>
              ) : enrolled && lesson.video_url ? (
                <span className="lesson-badge-free" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary-light)' }}>Смотреть</span>
              ) : (
                <span className="lesson-badge-locked">🔒</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
