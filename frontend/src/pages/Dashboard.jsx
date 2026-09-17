import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

const CHART_COLORS = {
  requests: '#00e676',
  tokens:   '#22d3ee',
  pipeline: '#a78bfa',
  accent:   '#fb923c',
};

export default function Dashboard() {
  const { token, user } = useAuth();

  const [usage, setUsage]       = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [teams, setTeams]       = useState(null);
  const [days, setDays]         = useState(7);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const isAdmin = user?.role === 'ADMIN';

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
    { label: 'Requests',       value: totalRequests.toLocaleString(),              color: CHART_COLORS.requests },
    { label: 'Tokens used',    value: totalTokens.toLocaleString(),                color: CHART_COLORS.tokens   },
    { label: 'Pipeline runs',  value: pipeline?.totalRuns?.toLocaleString() ?? '—', color: CHART_COLORS.pipeline },
    { label: 'Repos analyzed', value: pipeline?.byRepo?.length?.toLocaleString() ?? '—', color: CHART_COLORS.accent },
  ];

  const tooltipStyle = { background: '#111628', border: '1px solid #1c2038', borderRadius: 8, fontSize: 12 };
  const axisStyle    = { fill: '#6a7898', fontSize: 11 };
  const gridStyle    = '#1c2038';

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--text-1)',
              letterSpacing: '-0.01em',
              marginBottom: '4px',
            }}>
              Analytics
            </h1>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              color: 'var(--text-3)',
              letterSpacing: '0.15em',
            }}>
              {isAdmin
                ? 'ADMIN VIEW · ALL TEAMS'
                : `USER · ${user?.email?.split('@')[0]?.toUpperCase()}`}
            </p>
          </div>

          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-1)',
              fontSize: '13px',
              fontFamily: 'Outfit, sans-serif',
              padding: '9px 14px',
              outline: 'none',
              cursor: 'pointer',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.38)'; }}
            onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; }}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>

        {error && (
          <div style={{
            padding: '14px 18px',
            background: 'var(--error-bg)',
            border: '1px solid rgba(255,82,82,0.22)',
            borderRadius: '10px',
            color: 'var(--error)',
            fontSize: '13px',
            marginBottom: '24px',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: 'var(--text-3)',
              letterSpacing: '0.15em',
            }}>
              LOADING DATA…
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {statCards.map(({ label, value, color }) => (
                <div key={label} style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Top accent bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '2px',
                    background: color,
                  }} />
                  <p style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px',
                    color: 'var(--text-3)',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}>
                    {label}
                  </p>
                  <p style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '28px',
                    fontWeight: 800,
                    color: 'var(--text-1)',
                    lineHeight: 1,
                  }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <Panel title="Requests per day">
                {usage.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={usage} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStyle} />
                      <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={axisStyle} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#dde5f8' }} itemStyle={{ color: CHART_COLORS.requests }} />
                      <Line type="monotone" dataKey="requestCount" name="Requests" stroke={CHART_COLORS.requests} strokeWidth={2} dot={{ fill: CHART_COLORS.requests, r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              <Panel title="Tokens used per day">
                {usage.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={usage} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStyle} />
                      <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={axisStyle} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#dde5f8' }} itemStyle={{ color: CHART_COLORS.tokens }} />
                      <Line type="monotone" dataKey="totalTokens" name="Tokens" stroke={CHART_COLORS.tokens} strokeWidth={2} dot={{ fill: CHART_COLORS.tokens, r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              {pipeline?.byRepo?.length > 0 && (
                <Panel title="Pipeline runs by repository">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={pipeline.byRepo} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStyle} />
                      <XAxis dataKey="repoName" tick={axisStyle} />
                      <YAxis tick={axisStyle} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: CHART_COLORS.pipeline }} />
                      <Bar dataKey="runCount" name="Runs" fill={CHART_COLORS.pipeline} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
              )}

              {pipeline?.recentRuns?.length > 0 && (
                <Panel title="Recent pipeline runs">
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Repository', 'Processed at', 'Tokens'].map(h => (
                            <th key={h} style={{
                              textAlign: h === 'Tokens' ? 'right' : 'left',
                              padding: '8px 0',
                              paddingRight: h !== 'Tokens' ? '24px' : 0,
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '9px',
                              letterSpacing: '0.12em',
                              color: 'var(--text-3)',
                              borderBottom: '1px solid var(--border)',
                              fontWeight: 400,
                            }}>
                              {h.toUpperCase()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pipeline.recentRuns.map((run, i) => (
                          <tr key={i}>
                            <td style={{ padding: '10px 24px 10px 0', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
                              {run.repoName}
                            </td>
                            <td style={{ padding: '10px 24px 10px 0', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
                              {new Date(run.processedAt).toLocaleString()}
                            </td>
                            <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-1)', borderBottom: '1px solid var(--border)' }}>
                              {run.tokenCount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}

              {isAdmin && teams && (
                <Panel title="Team analytics">
                  {teams.length === 0 ? <Empty /> : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {['Team', 'Users', 'Requests', 'Tokens'].map(h => (
                              <th key={h} style={{
                                textAlign: h === 'Team' ? 'left' : 'right',
                                padding: '8px 0',
                                paddingRight: h !== 'Tokens' ? '24px' : 0,
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '9px',
                                letterSpacing: '0.12em',
                                color: 'var(--text-3)',
                                borderBottom: '1px solid var(--border)',
                                fontWeight: 400,
                              }}>
                                {h.toUpperCase()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {teams.map((t, i) => (
                            <tr key={i}>
                              <td style={{ padding: '10px 24px 10px 0', fontSize: '13px', color: 'var(--text-1)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{t.teamId}</td>
                              <td style={{ padding: '10px 24px 10px 0', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{t.totalUsers?.toLocaleString()}</td>
                              <td style={{ padding: '10px 24px 10px 0', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{t.totalRequests?.toLocaleString()}</td>
                              <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>{t.totalTokens?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '22px 24px',
    }}>
      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--text-1)',
        marginBottom: '20px',
        letterSpacing: '0.01em',
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <p style={{
      textAlign: 'center',
      fontSize: '11px',
      color: 'var(--text-3)',
      padding: '32px 0',
      fontFamily: 'JetBrains Mono, monospace',
      letterSpacing: '0.08em',
    }}>
      NO DATA YET
    </p>
  );
}
