import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Токен не найден');
      return;
    }
    api.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Ваш email успешно подтверждён!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [params]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div className="loading"><div className="spinner" /></div>
            <p>Подтверждаем email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h1 style={{ color: 'var(--success)' }}>Готово!</h1>
            <p className="subtitle">{message}</p>
            <Link to="/profile" className="btn btn-primary">Перейти в профиль</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✗</div>
            <h1 style={{ color: 'var(--danger)' }}>Ошибка</h1>
            <p className="subtitle">{message}</p>
            <Link to="/" className="btn btn-primary">На главную</Link>
          </>
        )}
      </div>
    </div>
  );
}
