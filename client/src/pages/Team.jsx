import { useState, useEffect } from 'react';
import api from '../api';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getUsers().then(d => setUsers(d.users)).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Team</h1><p>{users.length} members</p></div>
      <div className="team-grid">
        {users.map(u => (
          <div className="team-card" key={u.id}>
            <div className="avatar" style={{ width: 48, height: 48, background: u.avatar_color || '#8b5cf6', fontSize: 19 }}>{u.name.charAt(0).toUpperCase()}</div>
            <h3>{u.name}</h3>
            <p>{u.email}</p>
            <span className={`badge badge-role-${u.role}`}>{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
