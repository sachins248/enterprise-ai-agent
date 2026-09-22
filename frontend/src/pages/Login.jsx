import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import IndexedList from '../components/ui/IndexedList';
import CornerFrame from '../components/ui/CornerFrame';
import ThemeToggle from '../components/ui/ThemeToggle';

const FEATURES = [
  'Real-time AI chat with Gemini streaming',
  'JWT auth · Role-based access control',
  'GitHub webhook pipeline analysis',
  'Kafka event bus · Full audit trail',
  'Analytics dashboard with usage metrics',
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans">
      <ThemeToggle className="fixed top-5 right-5 z-10" />

      {/* Left brand panel */}
      <div className="hidden md:flex blueprint-grid bg-surface border-r border-hairline p-14 flex-col justify-between">
        <CornerFrame className="self-start">
          <div className="flex items-baseline gap-0.5 leading-none">
            <span className="font-mono font-semibold text-[14px] text-accent">&lt;</span>
            <span className="font-display font-extrabold text-[15px] text-ink tracking-tight">AGENT</span>
            <span className="font-mono font-semibold text-[14px] text-accent">/&gt;</span>
          </div>
        </CornerFrame>

        <div>
          <h1 className="font-display font-extrabold text-[48px] leading-[1.05] text-ink mb-6 tracking-tight">
            Enterprise<br />
            <span className="text-accent">AI</span><br />
            Platform.
          </h1>
          <p className="text-[15px] text-ink-2 leading-relaxed mb-10 max-w-[340px]">
            A production-grade AI coding agent built on 5 Spring Boot
            microservices, real-time Gemini streaming, and full observability.
          </p>
          <IndexedList items={FEATURES} />
        </div>

        <div className="font-mono text-[10px] text-ink-3 tracking-wide2">
          POWERED BY GEMINI · SPRING BOOT · REACT
        </div>
      </div>

      {/* Right form panel */}
      <div className="bg-bg flex items-center justify-center p-8 md:p-14">
        <div className="w-full max-w-[380px]">
          <h2 className="font-display text-[30px] font-bold text-ink mb-2">Welcome back</h2>
          <p className="text-sm text-ink-2 mb-10">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            {error && (
              <div className="flex items-center gap-2 border border-error px-4 py-3 text-[13px] text-error">
                <Icon name="alert" size={15} />
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" disabled={loading} loading={loading} className="w-full">
              {loading ? 'Signing in…' : (
                <>
                  Sign in
                  <Icon name="arrow-right" size={15} />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-[13px] text-ink-2 mt-7">
            No account?{' '}
            <button onClick={() => navigate('/register')} className="text-accent font-medium">
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
