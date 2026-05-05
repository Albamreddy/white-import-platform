import { useState, useEffect } from 'react';
import { api } from '../api';
import CourseCard from '../components/CourseCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORY_LABELS = { news: 'Новость', announcement: 'Анонс', hscode: 'ТН ВЭД' };
const CATEGORY_BADGE = { news: 'badge-green', announcement: 'badge-blue', hscode: 'badge-purple' };

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [newsTab, setNewsTab] = useState('all');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
    api.getNews().then(setNews).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = activeCategory ? `category=${encodeURIComponent(activeCategory)}` : '';
    api.getCourses(params)
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const filteredNews = newsTab === 'all' ? news : news.filter(n => n.category === newsTab);

  return (
    <section className="section" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <h1 className="section-title">Каталог курсов</h1>
      <p className="section-subtitle">Выберите программу обучения для вашего бизнеса</p>

      <div className="categories-filter">
        <button
          className={`category-btn ${!activeCategory ? 'active' : ''}`}
          onClick={() => setActiveCategory('')}
        >
          Все курсы
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: news.length > 0 ? '1fr 320px' : '1fr', gap: '32px', alignItems: 'start' }}>
        <div>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Курсы не найдены</h3>
              <p>В этой категории пока нет курсов</p>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>

        {news.length > 0 && (
          <aside style={{ position: 'sticky', top: '88px' }}>
            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Новости и анонсы</h3>
                <div style={{ display: 'flex', gap: '6px', paddingBottom: '12px', flexWrap: 'wrap' }}>
                  {[['all', 'Все'], ['news', 'Новости'], ['announcement', 'Анонсы'], ['hscode', 'ТН ВЭД']].map(([key, label]) => (
                    <button
                      key={key}
                      className={`btn btn-xs ${newsTab === key ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNewsTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {filteredNews.slice(0, 10).map(item => (
                  <div key={item.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                    {item.image_url && (
                      <img
                        src={item.image_url.startsWith('http') ? item.image_url : `${API_URL}${item.image_url}`}
                        alt={item.title}
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                      <span className={`badge ${CATEGORY_BADGE[item.category] || 'badge-green'}`} style={{ fontSize: '11px' }}>
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {new Date(item.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 4px', lineHeight: 1.4 }}>{item.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.content}
                    </p>
                  </div>
                ))}
                {filteredNews.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Нет записей в этой категории
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
