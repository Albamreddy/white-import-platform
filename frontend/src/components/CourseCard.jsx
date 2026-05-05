import { Link } from 'react-router-dom';

const difficultyLabels = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

export default function CourseCard({ course }) {
  const discount = course.old_price
    ? Math.round((1 - course.price / course.old_price) * 100)
    : 0;

  return (
    <Link to={`/courses/${course.slug}`} className="course-card">
      <img
        src={course.image_url}
        alt={course.title}
        className="course-card-image"
        loading="lazy"
      />
      <div className="course-card-body">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <span className="course-card-category">{course.category}</span>
          <span className={`difficulty-badge difficulty-${course.difficulty}`}>
            {difficultyLabels[course.difficulty] || course.difficulty}
          </span>
        </div>
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-desc">{course.short_description}</p>
        <div className="course-card-meta">
          <span>⏱ {course.duration_hours} ч</span>
          <span>📚 {course.lessons_count} уроков</span>
        </div>
        <div className="course-card-footer">
          <div className="course-price">
            <span className="price-current">{course.price.toLocaleString('ru-RU')} ₽</span>
            {course.old_price && (
              <span className="price-old">{course.old_price.toLocaleString('ru-RU')} ₽</span>
            )}
            {discount > 0 && (
              <span className="price-discount">-{discount}%</span>
            )}
          </div>
          <span className="btn btn-primary btn-sm">Подробнее</span>
        </div>
      </div>
    </Link>
  );
}
