import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import CourseCard from '../components/CourseCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const AUTHOR_IMAGE = 'https://app.devin.ai/attachments/e68d0e19-8d65-4598-b2d7-128503793dce/author.jpg';

const NEWS_CATEGORIES = [
  { key: 'all', label: 'Все' },
  { key: 'news', label: 'Новости' },
  { key: 'announcement', label: 'Анонсы' },
  { key: 'hscode', label: 'ТН ВЭД' },
];

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [webinars, setWebinars] = useState([]);
  const [news, setNews] = useState([]);
  const [newsTab, setNewsTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ text: '', rating: 5 });
  const [reviewMsg, setReviewMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getCourses('featured=true').then(setCourses).catch(console.error),
      api.getReviews().then(setReviews).catch(() => {}),
      api.getWebinars().then(setWebinars).catch(() => {}),
      api.getNews().then(setNews).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createReview({ text: reviewForm.text, rating: reviewForm.rating });
      setReviewMsg('Спасибо за отзыв!');
      setReviewForm({ text: '', rating: 5 });
      api.getReviews().then(setReviews);
    } catch (err) {
      setReviewMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const upcoming = webinars.filter(w => new Date(w.date) > new Date()).slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge animate-fade-in">🎓 Образовательная платформа</div>
          <h1 className="animate-slide-up">Белый импорт из Китая — просто и понятно</h1>
          <p className="animate-slide-up delay-1">
            Научим легально ввозить товары, работать с таможней и маркировкой.
            20 лет опыта в ВЭД и 6 лет в таможенных органах — теперь в формате онлайн-курсов.
          </p>
          <div className="animate-slide-up delay-2" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/courses" className="btn btn-accent btn-lg btn-glow">
              Смотреть курсы →
            </Link>
            <Link to="/calculator" className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
              Калькулятор пошлин
            </Link>
          </div>
          <div className="hero-stats animate-slide-up delay-3">
            <div className="hero-stat">
              <strong>20+</strong>
              <span>лет опыта в ВЭД</span>
            </div>
            <div className="hero-stat">
              <strong>6</strong>
              <span>лет в таможенных органах</span>
            </div>
            <div className="hero-stat">
              <strong>1000+</strong>
              <span>успешных поставок</span>
            </div>
            <div className="hero-stat">
              <strong>50+</strong>
              <span>часов обучения</span>
            </div>
          </div>
        </div>
      </section>

      {/* Author Section */}
      <section className="author-section">
        <div className="author-inner">
          <div className="author-image-wrap">
            <img src={AUTHOR_IMAGE} alt="Виктория Шахурова" className="author-image" />
          </div>
          <div className="author-info">
            <div className="author-badge">Ваш эксперт</div>
            <h2>Виктория Шахурова</h2>
            <p>Автор курсов и основатель платформы «Белый Ввоз». Более 20 лет опыта в области внешнеэкономической деятельности, 6 лет работы в таможенных органах.</p>
            <div className="author-highlights">
              <div className="author-highlight">
                <span className="highlight-icon">🎯</span>
                <span>Практик с реальным опытом</span>
              </div>
              <div className="author-highlight">
                <span className="highlight-icon">📋</span>
                <span>Эксперт по маркировке и таможне</span>
              </div>
              <div className="author-highlight">
                <span className="highlight-icon">💡</span>
                <span>Понятное объяснение сложных тем</span>
              </div>
            </div>
            <a href="https://t.me/beliy_vvoz" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Связаться в Telegram →
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Почему белый ввоз?</h2>
        <p className="section-subtitle">Преимущества легального импорта для вашего бизнеса</p>
        <div className="features-grid">
          <div className="feature-card interactive-card">
            <div className="feature-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>🛡️</div>
            <h3>Безопасность бизнеса</h3>
            <p>Никаких штрафов, конфискаций и проверок. Работайте спокойно и уверенно.</p>
          </div>
          <div className="feature-card interactive-card">
            <div className="feature-icon" style={{ background: 'rgba(34,197,94,0.12)' }}>📦</div>
            <h3>Товар на полку</h3>
            <p>С правильными документами и маркировкой ваш товар попадёт на любую площадку.</p>
          </div>
          <div className="feature-card interactive-card">
            <div className="feature-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>📊</div>
            <h3>Маркетплейсы</h3>
            <p>Продавайте на Wildberries, Ozon, Яндекс.Маркет без рисков блокировки.</p>
          </div>
          <div className="feature-card interactive-card">
            <div className="feature-icon" style={{ background: 'rgba(168,85,247,0.12)' }}>🏷️</div>
            <h3>Честный ЗНАК</h3>
            <p>Научим работать с системой маркировки по всем актуальным правилам 2025-2026.</p>
          </div>
          <div className="feature-card interactive-card">
            <div className="feature-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>💰</div>
            <h3>Экономия на штрафах</h3>
            <p>Один штраф за нарушение маркировки стоит дороже всех наших курсов вместе взятых.</p>
          </div>
          <div className="feature-card interactive-card">
            <div className="feature-icon" style={{ background: 'rgba(34,197,94,0.12)' }}>🤝</div>
            <h3>Поддержка экспертов</h3>
            <p>Консультации от практиков с реальным опытом работы в таможенных органах.</p>
          </div>
        </div>
      </section>

      {/* Webinars */}
      {upcoming.length > 0 && (
        <section className="section">
          <h2 className="section-title">Ближайшие вебинары</h2>
          <p className="section-subtitle">Бесплатные прямые эфиры с экспертами</p>
          <div className="webinar-cards">
            {upcoming.map(w => (
              <div key={w.id} className="webinar-card interactive-card">
                {w.image_url && (
                  <img
                    src={w.image_url.startsWith('http') ? w.image_url : `${API_URL}${w.image_url}`}
                    alt={w.title}
                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px 12px 0 0', display: 'block' }}
                  />
                )}
                <div style={{ padding: '16px' }}>
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
                    <a href={w.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>
                      Участвовать →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Calculator promo */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="calc-promo interactive-card">
          <div className="calc-promo-icon">🧮</div>
          <h2>Калькулятор таможенных пошлин</h2>
          <p>Рассчитайте стоимость растаможки товаров из Китая за 30 секунд. Актуальные ставки пошлин и НДС.</p>
          <Link to="/calculator" className="btn btn-accent btn-lg">
            Рассчитать →
          </Link>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Популярные курсы</h2>
        <p className="section-subtitle">Начните обучение с наших лучших программ</p>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/courses" className="btn btn-primary btn-lg">
            Все курсы →
          </Link>
        </div>
      </section>

      {/* Reviews */}
      <section className="section">
        <h2 className="section-title">Отзывы учеников</h2>
        <p className="section-subtitle">Что говорят наши выпускники</p>

        {reviews.length > 0 ? (
          <div className="reviews-grid">
            {reviews.slice(0, 6).map(r => (
              <div key={r.id} className="review-card interactive-card">
                <div className="review-stars">
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>
                <p className="review-text">«{r.text}»</p>
                <div className="review-author">
                  <div className="review-avatar">
                    {(r.author_name || '?')[0].toUpperCase()}
                  </div>
                  <span>{r.author_name || 'Аноним'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Пока нет отзывов. Станьте первым!</p>
        )}

        {/* Review form */}
        <div className="review-form-wrap">
          <h3>Оставить отзыв</h3>
          {reviewMsg && <div className="alert alert-success" style={{ marginBottom: '12px' }}>{reviewMsg}</div>}
          <form onSubmit={submitReview} className="review-form">
            <div className="form-group">
              <label>Оценка</label>
              <div className="star-selector">
                {[1,2,3,4,5].map(s => (
                  <button
                    type="button"
                    key={s}
                    className={`star-btn ${reviewForm.rating >= s ? 'active' : ''}`}
                    onClick={() => setReviewForm({...reviewForm, rating: s})}
                  >★</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <textarea
                placeholder="Расскажите о вашем опыте обучения..."
                value={reviewForm.text}
                onChange={e => setReviewForm({...reviewForm, text: e.target.value})}
                rows={3}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Отправляем...' : 'Отправить отзыв'}
            </button>
          </form>
        </div>
      </section>

      {/* News & Announcements */}
      {news.length > 0 && (
        <section className="section">
          <h2 className="section-title">Новости и анонсы</h2>
          <p className="section-subtitle">Актуальные обновления по таможне, ТН ВЭД и импорту</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {NEWS_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`btn btn-sm ${newsTab === cat.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setNewsTab(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {news
              .filter(n => newsTab === 'all' || n.category === newsTab)
              .slice(0, 6)
              .map(item => (
                <div key={item.id} className="interactive-card" style={{
                  background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden',
                  border: '1px solid var(--border)',
                }}>
                  {item.image_url && (
                    <img
                      src={item.image_url.startsWith('http') ? item.image_url : `${API_URL}${item.image_url}`}
                      alt={item.title}
                      style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <span className={`badge ${item.category === 'announcement' ? 'badge-blue' : item.category === 'hscode' ? 'badge-purple' : 'badge-green'}`}>
                        {item.category === 'announcement' ? 'Анонс' : item.category === 'hscode' ? 'ТН ВЭД' : 'Новость'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(item.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600 }}>{item.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="cta-section">
        <div className="cta-inner">
          <h2>Готовы начать?</h2>
          <p>
            Зарегистрируйтесь бесплатно и получите доступ к вводным урокам каждого курса.
            Убедитесь в качестве обучения перед покупкой.
          </p>
          <Link to="/register" className="btn btn-accent btn-lg btn-glow">
            Создать аккаунт бесплатно
          </Link>
        </div>
      </section>
    </>
  );
}
