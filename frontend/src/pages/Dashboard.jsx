// React tools: state and a way to run code on load
import { useState, useEffect } from 'react';
// The chart pieces from the Recharts library
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
// Lets us read the token and the current user
import { useAuth } from '../context/AuthContext';
// Our helper for sending requests to the server
import { apiFetch } from '../api/client';

// The colors used across the different charts, kept in one place
const CHART_COLORS = {
  // The color for the requests line
  requests: '#00e676',
  // The color for the tokens line
  tokens:   '#22d3ee',
  // The color for the pipeline bars
  pipeline: '#a78bfa',
  // A spare accent color
  accent:   '#fb923c',
};

// The analytics dashboard page
export default function Dashboard() {
  // The token and the current user
  const { token, user } = useAuth();

  // The daily usage numbers for the chosen range
  const [usage, setUsage]       = useState([]);
  // The CI/CD pipeline stats
  const [pipeline, setPipeline] = useState(null);
  // The team stats (only loaded for admins)
  const [teams, setTeams]       = useState(null);
  // How many days back to show (7, 14 or 30)
  const [days, setDays]         = useState(7);
  // True while the data is loading
  const [loading, setLoading]   = useState(true);
  // An error message to show, if anything failed
  const [error, setError]       = useState('');

  // True if the logged-in user is an admin
  const isAdmin = user?.role === 'ADMIN';

  // Load the dashboard data whenever the user, token, range or admin status changes
  useEffect(() => {
    // Loads everything the dashboard needs
    async function load() {
      // Start loading and clear any old error
      setLoading(true); setError('');
      // The requests can fail, so we use try
      try {
        // Load the daily usage for this user
        const usageRes = await apiFetch(`/analytics/usage?userId=${user.userId}&days=${days}`, {}, token);
        // Save it
        setUsage(await usageRes.json());

        // Load the pipeline stats (everyone can see these)
        const pipeRes = await apiFetch('/analytics/pipeline', {}, token);
        // Save it
        setPipeline(await pipeRes.json());

        // Admins also get team-wide stats
        if (isAdmin) {
          // Load the team stats
          const teamsRes = await apiFetch('/analytics/teams', {}, token);
          // Save them
          setTeams(await teamsRes.json());
        }
      } catch (err) {
        // Show the error
        setError(err.message);
      } finally {
        // Either way, we are done loading
        setLoading(false);
      }
    }
    // Run it
    load();
  }, [user.userId, token, days, isAdmin]);

  // Add up the requests for every day shown
  const totalRequests = usage.reduce((s, d) => s + d.requestCount, 0);
  // Add up the tokens for every day shown
  const totalTokens   = usage.reduce((s, d) => s + d.totalTokens, 0);

  // The four summary cards at the top of the page
  const statCards = [
    { label: 'Requests',       value: totalRequests.toLocaleString(),              color: CHART_COLORS.requests },
    { label: 'Tokens used',    value: totalTokens.toLocaleString(),                color: CHART_COLORS.tokens   },
    { label: 'Pipeline runs',  value: pipeline?.totalRuns?.toLocaleString() ?? '—', color: CHART_COLORS.pipeline },
    { label: 'Repos analyzed', value: pipeline?.byRepo?.length?.toLocaleString() ?? '—', color: CHART_COLORS.accent },
  ];

  // Shared style for chart tooltips
  const tooltipStyle = { background: '#111628', border: '1px solid #1c2038', borderRadius: 8, fontSize: 12 };
  // Shared style for chart axis labels
  const axisStyle    = { fill: '#6a7898', fontSize: 11 };
  // Shared color for the chart grid lines
  const gridStyle    = '#1c2038';

  return (
    // The whole page, scrollable, with space around the edges
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px' }}>
      {/* Keep the content centered and not too wide */}
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        {/* The title row, with the day-range dropdown on the right */}
        <div style={{
          // Put the title and dropdown side by side
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          // Space below the header
          marginBottom: '32px',
          // Let them wrap on narrow screens
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            {/* The page title */}
            <h1 style={{
              // The heading font
              fontFamily: 'Syne, sans-serif',
              // A large size
              fontSize: '28px',
              // Very bold text
              fontWeight: 800,
              // The main text color
              color: 'var(--text-1)',
              // Pull the letters slightly closer together
              letterSpacing: '-0.01em',
              // Space below the title
              marginBottom: '4px',
            }}>
              Analytics
            </h1>
            {/* Shows whether we are looking at all teams or just this user */}
            <p style={{
              // The code-style font
              fontFamily: 'JetBrains Mono, monospace',
              // A small text size
              fontSize: '10px',
              // The faintest text color
              color: 'var(--text-3)',
              // Wide space between letters
              letterSpacing: '0.15em',
            }}>
              {/* Admins see "all teams", other users see their own email */}
              {isAdmin
                ? 'ADMIN VIEW · ALL TEAMS'
                : `USER · ${user?.email?.split('@')[0]?.toUpperCase()}`}
            </p>
          </div>

          {/* The dropdown that picks how many days to show */}
          <select
            // Show the current range
            value={days}
            // Update the range when the user picks a new one
            onChange={e => setDays(Number(e.target.value))}
            style={{
              // The box color
              background: 'var(--card)',
              // A thin border
              border: '1px solid var(--border)',
              // Rounded corners
              borderRadius: '8px',
              // The text color
              color: 'var(--text-1)',
              // The text size
              fontSize: '13px',
              // The text font
              fontFamily: 'Outfit, sans-serif',
              // Space inside the box
              padding: '9px 14px',
              // Remove the browser's default outline
              outline: 'none',
              // A hand cursor
              cursor: 'pointer',
            }}
            // When the box is clicked: show a green border
            onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.38)'; }}
            // When the box is left: go back to the normal border
            onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; }}
          >
            {/* The three choices */}
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>

        {/* Show the error box only if something failed */}
        {error && (
          <div style={{
            // Space inside the box
            padding: '14px 18px',
            // A light red background
            background: 'var(--error-bg)',
            // A thin red border
            border: '1px solid rgba(255,82,82,0.22)',
            // Rounded corners
            borderRadius: '10px',
            // Red text
            color: 'var(--error)',
            // The text size
            fontSize: '13px',
            // Space below the box
            marginBottom: '24px',
          }}>
            {error}
          </div>
        )}

        {/* Show a loading message while data is loading, otherwise show the dashboard */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            {/* The loading text */}
            <p style={{
              // The code-style font
              fontFamily: 'JetBrains Mono, monospace',
              // A small text size
              fontSize: '11px',
              // The faintest text color
              color: 'var(--text-3)',
              // Wide space between letters
              letterSpacing: '0.15em',
            }}>
              LOADING DATA…
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            {/* The row of four summary cards */}
            <div style={{
              // A grid with four equal columns
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              // Space between cards
              gap: '16px',
              // Space below the row
              marginBottom: '24px',
            }}>
              {/* Make one card for each stat */}
              {statCards.map(({ label, value, color }) => (
                <div key={label} style={{
                  // The card color
                  background: 'var(--card)',
                  // A thin border
                  border: '1px solid var(--border)',
                  // Rounded corners
                  borderRadius: '14px',
                  // Space inside the card
                  padding: '20px',
                  // Lets the colored bar be placed at the top
                  position: 'relative',
                  // Hide anything that sticks out
                  overflow: 'hidden',
                }}>
                  {/* Top accent bar */}
                  {/* A thin colored line along the top of the card */}
                  <div style={{
                    // Stick it to the top edge, full width
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    // A thin bar
                    height: '2px',
                    // Use this stat's own color
                    background: color,
                  }} />
                  {/* The stat's label */}
                  <p style={{
                    // The code-style font
                    fontFamily: 'JetBrains Mono, monospace',
                    // A tiny text size
                    fontSize: '9px',
                    // The faintest text color
                    color: 'var(--text-3)',
                    // Wide space between letters
                    letterSpacing: '0.15em',
                    // Show it in capital letters
                    textTransform: 'uppercase',
                    // Space below the label
                    marginBottom: '10px',
                  }}>
                    {label}
                  </p>
                  {/* The stat's number */}
                  <p style={{
                    // The heading font
                    fontFamily: 'Syne, sans-serif',
                    // A large size
                    fontSize: '28px',
                    // Very bold text
                    fontWeight: 800,
                    // The main text color
                    color: 'var(--text-1)',
                    // No extra line space
                    lineHeight: 1,
                  }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts */}
            {/* The list of chart panels, stacked from top to bottom */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* The requests-per-day line chart */}
              <Panel title="Requests per day">
                {/* Show a message if there is no data, otherwise draw the chart */}
                {usage.length === 0 ? <Empty /> : (
                  // Make the chart resize to fit its panel
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={usage} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      {/* The dashed background grid */}
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStyle} />
                      {/* The bottom axis: shows the date, trimmed to just month-day */}
                      <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d.slice(5)} />
                      {/* The left axis: shows the request count */}
                      <YAxis tick={axisStyle} />
                      {/* The popup shown when hovering over a point */}
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#dde5f8' }} itemStyle={{ color: CHART_COLORS.requests }} />
                      {/* The line itself, with dots at each data point */}
                      <Line type="monotone" dataKey="requestCount" name="Requests" stroke={CHART_COLORS.requests} strokeWidth={2} dot={{ fill: CHART_COLORS.requests, r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              {/* The tokens-per-day line chart */}
              <Panel title="Tokens used per day">
                {/* Show a message if there is no data, otherwise draw the chart */}
                {usage.length === 0 ? <Empty /> : (
                  // Make the chart resize to fit its panel
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={usage} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      {/* The dashed background grid */}
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStyle} />
                      {/* The bottom axis: shows the date, trimmed to just month-day */}
                      <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d.slice(5)} />
                      {/* The left axis: shows the token count */}
                      <YAxis tick={axisStyle} />
                      {/* The popup shown when hovering over a point */}
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#dde5f8' }} itemStyle={{ color: CHART_COLORS.tokens }} />
                      {/* The line itself, with dots at each data point */}
                      <Line type="monotone" dataKey="totalTokens" name="Tokens" stroke={CHART_COLORS.tokens} strokeWidth={2} dot={{ fill: CHART_COLORS.tokens, r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Panel>

              {/* Only show this chart if there is at least one repository with runs */}
              {pipeline?.byRepo?.length > 0 && (
                <Panel title="Pipeline runs by repository">
                  {/* Make the chart resize to fit its panel */}
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={pipeline.byRepo} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      {/* The dashed background grid */}
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStyle} />
                      {/* The bottom axis: shows the repository name */}
                      <XAxis dataKey="repoName" tick={axisStyle} />
                      {/* The left axis: shows the run count */}
                      <YAxis tick={axisStyle} />
                      {/* The popup shown when hovering over a bar */}
                      <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: CHART_COLORS.pipeline }} />
                      {/* One bar per repository, with slightly rounded top corners */}
                      <Bar dataKey="runCount" name="Runs" fill={CHART_COLORS.pipeline} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
              )}

              {/* Only show this table if there is at least one recent run */}
              {pipeline?.recentRuns?.length > 0 && (
                <Panel title="Recent pipeline runs">
                  {/* Let the table scroll sideways on narrow screens */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {/* Make one column heading for each name */}
                          {['Repository', 'Processed at', 'Tokens'].map(h => (
                            <th key={h} style={{
                              // Right-align the Tokens column, left-align the rest
                              textAlign: h === 'Tokens' ? 'right' : 'left',
                              // Space inside the heading
                              padding: '8px 0',
                              // Extra space on the right, except for the last column
                              paddingRight: h !== 'Tokens' ? '24px' : 0,
                              // The code-style font
                              fontFamily: 'JetBrains Mono, monospace',
                              // A tiny text size
                              fontSize: '9px',
                              // Wide space between letters
                              letterSpacing: '0.12em',
                              // The faintest text color
                              color: 'var(--text-3)',
                              // A line under the heading row
                              borderBottom: '1px solid var(--border)',
                              // Normal weight
                              fontWeight: 400,
                            }}>
                              {h.toUpperCase()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Make one row for each recent run */}
                        {pipeline.recentRuns.map((run, i) => (
                          <tr key={i}>
                            {/* The repository name */}
                            <td style={{ padding: '10px 24px 10px 0', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
                              {run.repoName}
                            </td>
                            {/* The time it was processed */}
                            <td style={{ padding: '10px 24px 10px 0', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
                              {new Date(run.processedAt).toLocaleString()}
                            </td>
                            {/* How many tokens it used */}
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

              {/* Only admins see the team table, and only once it has loaded */}
              {isAdmin && teams && (
                <Panel title="Team analytics">
                  {/* Show a message if there are no teams, otherwise show the table */}
                  {teams.length === 0 ? <Empty /> : (
                    // Let the table scroll sideways on narrow screens
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {/* Make one column heading for each name */}
                            {['Team', 'Users', 'Requests', 'Tokens'].map(h => (
                              <th key={h} style={{
                                // Left-align the Team column, right-align the rest
                                textAlign: h === 'Team' ? 'left' : 'right',
                                // Space inside the heading
                                padding: '8px 0',
                                // Extra space on the right, except for the last column
                                paddingRight: h !== 'Tokens' ? '24px' : 0,
                                // The code-style font
                                fontFamily: 'JetBrains Mono, monospace',
                                // A tiny text size
                                fontSize: '9px',
                                // Wide space between letters
                                letterSpacing: '0.12em',
                                // The faintest text color
                                color: 'var(--text-3)',
                                // A line under the heading row
                                borderBottom: '1px solid var(--border)',
                                // Normal weight
                                fontWeight: 400,
                              }}>
                                {h.toUpperCase()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Make one row for each team */}
                          {teams.map((t, i) => (
                            <tr key={i}>
                              {/* The team name */}
                              <td style={{ padding: '10px 24px 10px 0', fontSize: '13px', color: 'var(--text-1)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{t.teamId}</td>
                              {/* How many users the team has */}
                              <td style={{ padding: '10px 24px 10px 0', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{t.totalUsers?.toLocaleString()}</td>
                              {/* How many requests the team made */}
                              <td style={{ padding: '10px 24px 10px 0', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{t.totalRequests?.toLocaleString()}</td>
                              {/* How many tokens the team used */}
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

// A card wrapper used around every chart, with a shared title style
function Panel({ title, children }) {
  return (
    <div style={{
      // The card color
      background: 'var(--card)',
      // A thin border
      border: '1px solid var(--border)',
      // Rounded corners
      borderRadius: '14px',
      // Space inside the panel
      padding: '22px 24px',
    }}>
      {/* The panel's title */}
      <h2 style={{
        // The heading font
        fontFamily: 'Syne, sans-serif',
        // The text size
        fontSize: '14px',
        // Medium-bold text
        fontWeight: 600,
        // The main text color
        color: 'var(--text-1)',
        // Space below the title
        marginBottom: '20px',
        // A little space between letters
        letterSpacing: '0.01em',
      }}>
        {title}
      </h2>
      {/* Whatever chart or table was passed in */}
      {children}
    </div>
  );
}

// A small centered message shown when a panel has no data yet
function Empty() {
  return (
    <p style={{
      // Center it
      textAlign: 'center',
      // A small text size
      fontSize: '11px',
      // The faintest text color
      color: 'var(--text-3)',
      // Space above and below
      padding: '32px 0',
      // The code-style font
      fontFamily: 'JetBrains Mono, monospace',
      // Space between letters
      letterSpacing: '0.08em',
    }}>
      NO DATA YET
    </p>
  );
}
