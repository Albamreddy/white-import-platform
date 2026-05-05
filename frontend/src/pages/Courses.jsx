import { useState, useEffect } from 'react';
import { api } from '../api';
import CourseCard from '../components/CourseCard';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = activeCategory ? `category=${encodeURIComponent(activeCategory)}` : '';
    api.getCourses(params)
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory]);

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
    </section>
  );
}
