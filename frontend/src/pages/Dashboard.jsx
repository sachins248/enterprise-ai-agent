import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../api/client';
import Select from '../components/ui/Select';
import Icon from '../components/ui/Icon';
import Panel from '../components/ui/Panel';
import StatTile from '../components/ui/StatTile';
import Table from '../components/ui/Table';
import Empty from '../components/ui/Empty';
import Divider from '../components/ui/Divider';

// Flat token-driven colors — resolved from the theme so charts stay in
// sync with the light/dark toggle. Falls back to a computed hex if a raw
// SVG presentation attribute doesn't resolve var(...) in the browser.
const LIGHT_COLORS = { requests: '#35507A', tokens: '#C1541A', pipeline: '#A87C1F', success: '#5C7A52',
  border: '#D9D3C4', text3: '#A39C89', card: '#FAF7EF' };
const DARK_COLORS = { requests: '#6E8FC2', tokens: '#E07A3E', pipeline: '#D3A63E', success: '#7FA36C',
  border: '#262E3D', text3: '#4B5468', card: '#181F2B' };

function SquareDot({ cx, cy, fill }) {
  if (cx == null || cy == null) return null;
  return <rect x={cx - 2} y={cy - 2} width={4} height={4} fill={fill} />;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const { theme } = useTheme();

  const [usage, setUsage]       = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [teams, setTeams]       = useState(null);
  const [days, setDays]         = useState(7);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const C = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  useEffect(() => {
    async function load() {
      setLoading(true); setError('');
      try {
        const usageRes = await apiFetch(`/analytics/usage?userId=${user.userId}&days=${days}`, {}, token);
        setUsage(await usageRes.json());

        const pipeRes = await apiFetch('/analytics/pipeline', {}, token);
        setPipeline(await pipeRes.json());

        if (isAdmin) {
          const teamsRes = await apiFetch('/analytics/teams', {}, token);
          setTeams(await teamsRes.json());
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.userId, token, days, isAdmin]);

  const totalRequests = usage.reduce((s, d) => s + d.requestCount, 0);
  const totalTokens   = usage.reduce((s, d) => s + d.totalTokens, 0);

  const statCards = [
    { label: 'Requests',       value: totalRequests.toLocaleString(),              tone: 'accent-ink' },
    { label: 'Tokens used',    value: totalTokens.toLocaleString(),                tone: 'accent'     },
    { label: 'Pipeline runs',  value: pipeline?.totalRuns?.toLocaleString() ?? '—', tone: 'role-admin' },
    { label: 'Repos analyzed', value: pipeline?.byRepo?.length?.toLocaleString() ?? '—', tone: 'success' },
  ];

  const tooltipStyle = useMemo(() => ({
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 2, fontSize: 11, fontFamily: 'IBM Plex Mono',
  }), [C]);
  const axisStyle = useMemo(() => ({ fill: C.text3, fontSize: 10, fontFamily: 'IBM Plex Mono' }), [C]);

  const runColumns = [
    { key: 'repoName', label: 'Repository', mono: true },
    { key: 'processedAt', label: 'Processed at', render: r => new Date(r.processedAt).toLocaleString() },
    { key: 'tokenCount', label: 'Tokens', align: 'right', mono: true, render: r => r.tokenCount.toLocaleString() },
  ];

  const teamColumns = [
    { key: 'teamId', label: 'Team' },
    { key: 'totalUsers', label: 'Users', align: 'right', mono: true, render: t => t.totalUsers?.toLocaleString() },
    { key: 'totalRequests', label: 'Requests', align: 'right', mono: true, render: t => t.totalRequests?.toLocaleString() },
    { key: 'totalTokens', label: 'Tokens', align: 'right', mono: true, render: t => t.totalTokens?.toLocaleString() },
  ];

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-[960px] mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display text-[28px] font-extrabold text-ink tracking-tight mb-1">Analytics</h1>
            <p className="font-mono text-[10px] text-ink-3 tracking-wide2">
              {isAdmin ? 'ADMIN VIEW · ALL TEAMS' : `USER · ${user?.email?.split('@')[0]?.toUpperCase()}`}
            </p>
          </div>

          <Select value={days} onChange={e => setDays(Number(e.target.value))} className="w-44">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </Select>
        </div>

        {error && (
          <div className="flex items-center gap-2 border border-error px-4 py-3.5 text-[13px] text-error mb-6">
            <Icon name="alert" size={15} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 h-[300px] font-mono text-[11px] text-ink-3 tracking-wide2">
            <Icon name="spinner" size={14} className="spin" />
            LOADING DATA…
          </div>
        ) : (
          <>
            {/* Stat tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {statCards.map(s => <StatTile key={s.label} {...s} />)}
            </div>

            <Divider />

            {/* Charts */}
            <div className="flex flex-col gap-5">

              <Panel title="Requests per day" indexTag="FIG. 01">
                {usage.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={usage} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={axisStyle} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.requests }} />
                      <Line type="monotone" dataKey="requestCount" name="Requests" stroke={C.requests}
                        strokeWidth={1.5} dot={<SquareDot fill={C.requests} />} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              <Panel title="Tokens used per day" indexTag="FIG. 02">
                {usage.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={usage} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={axisStyle} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.tokens }} />
                      <Line type="monotone" dataKey="totalTokens" name="Tokens" stroke={C.tokens}
                        strokeWidth={1.5} dot={<SquareDot fill={C.tokens} />} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              {pipeline?.byRepo?.length > 0 && (
                <Panel title="Pipeline runs by repository" indexTag="FIG. 03">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={pipeline.byRepo} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="repoName" tick={axisStyle} />
                      <YAxis tick={axisStyle} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="runCount" name="Runs" fill={C.pipeline} radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
              )}

              {pipeline?.recentRuns?.length > 0 && (
                <Panel title="Recent pipeline runs" indexTag="TBL. 01">
                  <Table columns={runColumns} rows={pipeline.recentRuns} />
                </Panel>
              )}

              {isAdmin && teams && (
                <Panel title="Team analytics" indexTag="TBL. 02">
                  {teams.length === 0 ? <Empty /> : <Table columns={teamColumns} rows={teams} />}
                </Panel>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
