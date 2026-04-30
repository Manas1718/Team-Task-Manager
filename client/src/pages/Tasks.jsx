import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { api.getTasks().then(d => setTasks(d.tasks)).catch(console.error).finally(() => setLoading(false)); }, []);

  const statusLabel = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
  const statusIcon = { todo: '○', 'in-progress': '◐', review: '◑', done: '●' };
  const pClass = { low: 'priority-low', medium: 'priority-med', high: 'priority-high', urgent: 'priority-urgent' };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>My Tasks</h1></div>
      {tasks.length === 0 ? <div className="empty-state"><h3>No tasks assigned</h3><p>Tasks assigned to you will appear here</p></div> : (
        <div className="card"><div className="card-body"><div className="task-list">
          {tasks.map(t => (
            <div className="task-row" key={t.id} onClick={() => navigate(`/projects/${t.project_id}`)}>
              <div className={`task-status-icon status-${t.status}`}>{statusIcon[t.status]}</div>
              <div className="task-info"><span className="task-title">{t.title}</span><span className="task-meta">{t.project_name}{t.assignee_name ? ` · ${t.assignee_name}` : ''}</span></div>
              <span className={`badge ${pClass[t.priority]}`}>{t.priority}</span>
              <span className={`badge badge-status status-${t.status}`}>{statusLabel[t.status]}</span>
            </div>
          ))}
        </div></div></div>
      )}
    </div>
  );
}
