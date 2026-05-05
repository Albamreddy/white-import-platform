import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">Белый Ввоз</div>
            <div className="footer-author">
              Автор: <strong>Виктория Шахурова</strong>
            </div>
            <p className="footer-desc">Образовательная платформа по белому импорту из Китая</p>
          </div>
          <div className="footer-links-group">
            <h4>Навигация</h4>
            <Link to="/courses">Курсы</Link>
            <Link to="/register">Начать обучение</Link>
            <Link to="/login">Войти</Link>
          </div>
          <div className="footer-links-group">
            <h4>Контакты</h4>
            <a href="https://t.me/beliy_vvoz" target="_blank" rel="noopener noreferrer">
              Telegram канал
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} Белый Ввоз. Все права защищены.
          </div>
        </div>
      </div>
    </footer>
  );
}
