import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { api.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false)); }, []);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
  const statusLabel = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
  const priorityClass = { low: 'priority-low', medium: 'priority-med', high: 'priority-high', urgent: 'priority-urgent' };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!data) return <div className="error-msg">Failed to load dashboard</div>;

  const s = data.stats;
  const pct = s.totalTasks ? Math.round((s.doneTasks / s.totalTasks) * 100) : 0;

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1><p>Welcome back, {user?.name}</p></div>
      <div className="stats-grid">
        <div className="stat-card stat-purple"><div className="stat-icon">📁</div><div className="stat-info"><span className="stat-value">{s.projects}</span><span className="stat-label">Projects</span></div></div>
        <div className="stat-card stat-blue"><div className="stat-icon">📋</div><div className="stat-info"><span className="stat-value">{s.totalTasks}</span><span className="stat-label">Total Tasks</span></div></div>
        <div className="stat-card stat-green"><div className="stat-icon">✅</div><div className="stat-info"><span className="stat-value">{pct}%</span><span className="stat-label">Completed</span></div></div>
        <div className="stat-card stat-orange"><div className="stat-icon">👥</div><div className="stat-info"><span className="stat-value">{s.teamMembers}</span><span className="stat-label">Team</span></div></div>
      </div>
      <div className="dash-row">
        <div className="card">
          <div className="card-header"><h3>Task Breakdown</h3></div>
          <div className="card-body">
            {[['To Do', s.todoTasks, 'bar-todo'], ['In Progress', s.inProgressTasks, 'bar-progress'], ['Review', s.reviewTasks, 'bar-review'], ['Done', s.doneTasks, 'bar-done']].map(([label, count, cls]) => (
              <div className="task-bar-item" key={label}>
                <span className="bar-label">{label}</span>
                <div className="bar-track"><div className={`bar-fill ${cls}`} style={{ width: `${s.totalTasks ? (count / s.totalTasks) * 100 : 0}%` }} /></div>
                <span className="bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-danger">
          <div className="card-header"><h3>⚠️ Overdue Tasks</h3></div>
          <div className="card-body">
            {data.overdueTasks.length === 0 ? <p className="empty-text">No overdue tasks 🎉</p> :
              data.overdueTasks.map(t => (
                <div className="mini-task overdue-task" key={t.id} onClick={() => navigate(`/projects/${t.project_id}`)}>
                  <div className="mini-task-info"><strong>{t.title}</strong><span className="mini-meta">{t.project_name} · Due {fmt(t.due_date)}</span></div>
                  <span className={`badge ${priorityClass[t.priority]}`}>{t.priority}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3>Recent Activity</h3></div>
        <div className="card-body">
          {data.recentTasks.length === 0 ? <p className="empty-text">No tasks yet. Create a project to get started!</p> :
            <div className="task-list">
              {data.recentTasks.map(t => (
                <div className="task-row" key={t.id} onClick={() => navigate(`/projects/${t.project_id}`)}>
                  <div className={`task-status-icon status-${t.status}`}>{{ todo: '○', 'in-progress': '◐', review: '◑', done: '●' }[t.status]}</div>
                  <div className="task-info"><span className="task-title">{t.title}</span><span className="task-meta">{t.project_name}{t.assignee_name ? ` · ${t.assignee_name}` : ''}</span></div>
                  <span className={`badge ${priorityClass[t.priority]}`}>{t.priority}</span>
                  <span className={`badge badge-status status-${t.status}`}>{statusLabel[t.status]}</span>
                </div>
              ))}
            </div>}
        </div>
      </div>
    </div>
  );
}
