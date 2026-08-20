import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

const FEATURES = [
  'Real-time AI chat with Gemini streaming',
  'JWT auth · Role-based access control',
  'GitHub webhook pipeline analysis',
  'Kafka event bus · Full audit trail',
  'Analytics dashboard with usage metrics',
];

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--text-1)',
  fontSize: '14px',
  fontFamily: 'Outfit, sans-serif',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
      const data = await res.json();
      login(data.accessToken);
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'Outfit, sans-serif',
    }}>
      {/* ── Left panel: brand ──────────────────────── */}
      <div
        className="dot-grid"
        style={{
          background: 'var(--surface)',
          padding: '56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Accent orb */}
        <div style={{
          position: 'absolute',
          bottom: '-140px',
          left: '-140px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 68%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.22em',
            color: 'var(--accent)',
          }}>
            {'<AGENT/>'}
          </div>
        </div>

        {/* Hero text + features */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '52px',
            fontWeight: 800,
            lineHeight: 1.05,
            color: 'var(--text-1)',
            marginBottom: '22px',
            letterSpacing: '-0.02em',
          }}>
            Enterprise<br />
            <span style={{ color: 'var(--accent)' }}>AI</span><br />
            Platform.
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-2)',
            lineHeight: 1.75,
            marginBottom: '40px',
            maxWidth: '340px',
          }}>
            A production-grade AI coding agent built on 5 Spring Boot
            microservices, real-time Gemini streaming, and full observability.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FEATURES.map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 7px var(--accent)',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          color: 'var(--text-3)',
          letterSpacing: '0.15em',
        }}>
          POWERED BY GEMINI · SPRING BOOT · REACT
        </div>
      </div>

      {/* ── Right panel: form ──────────────────────── */}
      <div style={{
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '30px',
            fontWeight: 700,
            color: 'var(--text-1)',
            marginBottom: '8px',
          }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '40px' }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit}>
            <FieldLabel label="Email" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              style={{ ...inputStyle, marginBottom: '20px' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.07)'; }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />

            <FieldLabel label="Password" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ ...inputStyle, marginBottom: '28px' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.07)'; }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />

            {error && <ErrorBox message={error} />}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? 'rgba(0,230,118,0.35)' : 'var(--accent)',
                border: 'none',
                borderRadius: '10px',
                color: '#07080e',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'Outfit, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1aff88'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-2)', marginTop: '28px' }}>
            No account?{' '}
            <button
              onClick={() => navigate('/register')}
              style={{
                background: 'none', border: 'none',
                color: 'var(--accent)', cursor: 'pointer',
                fontSize: '13px', fontFamily: 'Outfit, sans-serif', fontWeight: 500,
              }}
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ label }) {
  return (
    <label style={{
      display: 'block',
      fontSize: '11px',
      fontWeight: 500,
      color: 'var(--text-2)',
      marginBottom: '8px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {label}
    </label>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={{
      padding: '12px 16px',
      background: 'var(--error-bg)',
      border: '1px solid rgba(255,82,82,0.22)',
      borderRadius: '10px',
      color: 'var(--error)',
      fontSize: '13px',
      marginBottom: '20px',
    }}>
      {message}
    </div>
  );
}
