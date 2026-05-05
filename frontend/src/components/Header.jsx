import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function LogoIcon() {
  return (
    <div className="logo-icon-wrap">
      <svg viewBox="0 0 40 40" className="logo-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
        {/* Ship/cargo icon */}
        <path d="M10 26 L14 18 L20 14 L26 18 L30 26 Z" fill="rgba(255,255,255,0.95)" stroke="none" />
        <path d="M8 27 L32 27 L30 30 Q20 32 10 30 Z" fill="rgba(255,255,255,0.7)" />
        <line x1="20" y1="14" x2="20" y2="10" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
        <polygon points="20,10 24,13 20,12" fill="rgba(255,255,255,0.6)" />
        <rect x="17" y="20" width="6" height="5" rx="1" fill="rgba(99,102,241,0.6)" />
      </svg>
    </div>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <LogoIcon />
          <span>Белый Ввоз</span>
        </Link>

        <nav className="nav-links">
          <Link to="/courses" className={`nav-link ${path === '/courses' ? 'active' : ''}`}>
            Курсы
          </Link>
          <Link to="/calculator" className={`nav-link ${path === '/calculator' ? 'active' : ''}`}>
            Калькулятор
          </Link>
          <a
            href="https://t.me/beliy_vvoz"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-tg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Telegram
          </a>
          {user ? (
            <>
              {user.is_admin && (
                <Link to="/admin" className={`nav-link nav-admin ${path.startsWith('/admin') ? 'active' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Админ
                </Link>
              )}
              <Link to="/profile" className={`nav-link ${path === '/profile' ? 'active' : ''}`}>
                Мой профиль
              </Link>
              <button className="btn btn-secondary btn-sm" onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Войти</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
