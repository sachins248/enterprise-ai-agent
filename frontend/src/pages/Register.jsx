import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import CornerFrame from '../components/ui/CornerFrame';
import DimensionTag from '../components/ui/DimensionTag';
import ThemeToggle from '../components/ui/ThemeToggle';

const ROLES = [
  { value: 'ADMIN', tag: '§ 01', desc: 'Full access, all teams' },
  { value: 'DEVELOPER', tag: '§ 02', desc: 'Chat + analytics' },
  { value: 'VIEWER', tag: '§ 03', desc: 'Read-only access' },
];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/auth/register', { method: 'POST', body: { email, password, role } });
      const data = await res.json();
      login(data.accessToken);
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
            Join the<br />
            <span className="text-accent">future</span><br />
            of code.
          </h1>
          <p className="text-[15px] text-ink-2 leading-relaxed mb-10 max-w-[340px]">
            Create your account and start chatting with your AI coding agent.
            Roles control what you can see and do across the platform.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {ROLES.map(r => (
              <div key={r.value} className="bg-card border border-hairline p-3.5 text-center">
                <DimensionTag className="block mb-1.5">{r.tag}</DimensionTag>
                <div className="font-mono text-[9px] text-accent tracking-micro mb-1.5">{r.value}</div>
                <div className="text-[10px] text-ink-2 leading-snug">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="font-mono text-[10px] text-ink-3 tracking-wide2">
          POWERED BY GEMINI · SPRING BOOT · REACT
        </div>
      </div>

      {/* Right form panel */}
      <div className="bg-bg flex items-center justify-center p-8 md:p-14">
        <div className="w-full max-w-[380px]">
          <h2 className="font-display text-[30px] font-bold text-ink mb-2">Create account</h2>
          <p className="text-sm text-ink-2 mb-10">Join the Enterprise AI Agent platform</p>

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
            <Select label="Role" value={role} onChange={e => setRole(e.target.value)}>
              <option value="DEVELOPER">Developer</option>
              <option value="VIEWER">Viewer</option>
              <option value="ADMIN">Admin</option>
            </Select>

            {error && (
              <div className="flex items-center gap-2 border border-error px-4 py-3 text-[13px] text-error">
                <Icon name="alert" size={15} />
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" disabled={loading} loading={loading} className="w-full">
              {loading ? 'Creating account…' : (
                <>
                  Create account
                  <Icon name="arrow-right" size={15} />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-[13px] text-ink-2 mt-7">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-accent font-medium">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
