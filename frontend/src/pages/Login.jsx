import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const { login, setUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login');
  const [code, setCode] = useState('');
  const [displayCode, setDisplayCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await api.request2FA(form.email, form.password);
      if (resp.requires_2fa) {
        setDisplayCode(resp.message);
        setStep('2fa');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await api.verify2FA(form.email, code);
      localStorage.setItem('token', resp.access_token);
      setUser(resp.user);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === '2fa') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Подтверждение входа</h1>
          <p className="subtitle">Введите код подтверждения</p>

          <div className="alert alert-success" style={{ marginBottom: '16px', fontSize: '13px' }}>
            {displayCode}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>Код подтверждения</label>
              <input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
              {loading ? 'Проверяем...' : 'Подтвердить'}
            </button>
          </form>

          <p className="form-link" style={{ marginTop: '12px' }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => { setStep('login'); setCode(''); setError(''); }}
            >
              Назад
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Вход</h1>
        <p className="subtitle">Войдите в свой аккаунт</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="form-link">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
