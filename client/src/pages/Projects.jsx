import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  const load = () => api.getProjects().then(d => setProjects(d.projects)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createProject(form);
    setShowModal(false); setForm({ name: '', description: '' }); load();
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> New Project
        </button>
      </div>
      {projects.length === 0 ? (
        <div className="empty-state"><h3>No projects yet</h3><p>Create your first project to get started</p></div>
      ) : (
        <div className="project-grid">
          {projects.map(p => {
            const pct = p.task_count ? Math.round(p.completed_tasks / p.task_count * 100) : 0;
            return (
              <div className="project-card" key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="project-card-header"><h3>{p.name}</h3><span className={`badge badge-status status-${p.status}`}>{p.status}</span></div>
                <p className="project-desc">{p.description || 'No description'}</p>
                <div className="project-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div><span className="progress-text">{pct}%</span></div>
                <div className="project-meta"><span>👤 {p.member_count} members</span><span>📋 {p.task_count} tasks</span></div>
              </div>
            );
          })}
        </div>
      )}
      {showModal && (
        <Modal title="New Project" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="modal-form">
            <div className="form-group"><label>Project Name</label><input type="text" required placeholder="My Project" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label>Description</label><textarea rows="3" placeholder="Project description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <button type="submit" className="btn btn-primary btn-full">Create Project</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
