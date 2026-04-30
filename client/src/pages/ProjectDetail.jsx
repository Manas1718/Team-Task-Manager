import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Modal from '../components/Modal';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'newTask', 'editTask', 'team'
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', assigned_to: '', due_date: '' });

  const load = () => api.getProject(id).then(d => { setProject(d.project); setMembers(d.members); setTasks(d.tasks); }).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const isAdmin = user?.role === 'admin' || members.find(m => m.id === user?.id && m.role === 'admin');
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const isOverdue = (d, s) => d && s !== 'done' && new Date(d) < new Date();
  const pClass = { low: 'priority-low', medium: 'priority-med', high: 'priority-high', urgent: 'priority-urgent' };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await api.createTask(id, { ...taskForm, assigned_to: taskForm.assigned_to || null, due_date: taskForm.due_date || null });
    setModal(null); setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', assigned_to: '', due_date: '' }); load();
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    await api.updateTask(editTask.id, { ...taskForm, assigned_to: taskForm.assigned_to || null, due_date: taskForm.due_date || null });
    setModal(null); load();
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Delete this task?')) { await api.deleteTask(editTask.id); setModal(null); load(); }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Delete this project and all tasks?')) { await api.deleteProject(id); navigate('/projects'); }
  };

  const openEdit = (t) => {
    setEditTask(t);
    setTaskForm({ title: t.title, description: t.description || '', priority: t.priority, status: t.status, assigned_to: t.assigned_to || '', due_date: t.due_date || '' });
    setModal('editTask');
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!project) return <div className="error-msg">Project not found</div>;

  return (
    <div>
      <div className="page-header">
        <div><Link to="/projects" className="back-link">← Projects</Link><h1>{project.name}</h1><p>{project.description}</p></div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', assigned_to: '', due_date: '' }); setModal('newTask'); }}>+ Add Task</button>
          {isAdmin && <><button className="btn btn-secondary" onClick={() => setModal('team')}>👥 Team</button><button className="btn btn-ghost btn-danger-text" onClick={handleDeleteProject}>🗑️</button></>}
        </div>
      </div>
      <div className="board">
        {STATUSES.map(s => (
          <div className="board-column" key={s}>
            <div className="column-header"><span className={`column-dot status-${s}`} /><h3>{STATUS_LABELS[s]}</h3><span className="column-count">{tasks.filter(t => t.status === s).length}</span></div>
            <div className="column-body">
              {tasks.filter(t => t.status === s).map(t => (
                <div className="task-card" key={t.id} onClick={() => openEdit(t)}>
                  <div className="task-card-top"><span className={`badge ${pClass[t.priority]}`}>{t.priority}</span>{t.due_date && <span className={`task-due-sm ${isOverdue(t.due_date, t.status) ? 'overdue' : ''}`}>{fmt(t.due_date)}</span>}</div>
                  <h4>{t.title}</h4>
                  {t.description && <p className="task-card-desc">{t.description.substring(0, 80)}</p>}
                  <div className="task-card-footer">{t.assignee_name ? <><div className="avatar" style={{ width: 24, height: 24, background: t.assignee_color || '#8b5cf6', fontSize: 10 }}>{t.assignee_name.charAt(0)}</div><span className="assignee-name">{t.assignee_name}</span></> : <span className="unassigned">Unassigned</span>}</div>
                </div>
              ))}
              {tasks.filter(t => t.status === s).length === 0 && <p className="empty-col">No tasks</p>}
            </div>
          </div>
        ))}
      </div>

      {(modal === 'newTask' || modal === 'editTask') && (
        <Modal title={modal === 'newTask' ? 'New Task' : 'Edit Task'} onClose={() => setModal(null)}>
          <form onSubmit={modal === 'newTask' ? handleCreateTask : handleEditTask} className="modal-form">
            <div className="form-group"><label>Title</label><input required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
            <div className="form-group"><label>Description</label><textarea rows="2" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label>Priority</label><select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              <div className="form-group"><label>Status</label><select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Assign To</label><select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}><option value="">Unassigned</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div className="form-group"><label>Due Date</label><input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} /></div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{modal === 'newTask' ? 'Create Task' : 'Save Changes'}</button>
              {modal === 'editTask' && <button type="button" className="btn btn-danger" onClick={handleDeleteTask}>Delete</button>}
            </div>
          </form>
        </Modal>
      )}

      {modal === 'team' && <TeamModal projectId={id} members={members} onClose={() => { setModal(null); load(); }} isAdmin={isAdmin} />}
    </div>
  );
}

function TeamModal({ projectId, members, onClose, isAdmin }) {
  const [allUsers, setAllUsers] = useState([]);
  useEffect(() => { api.getUsers().then(d => setAllUsers(d.users)).catch(console.error); }, []);
  const nonMembers = allUsers.filter(u => !members.find(m => m.id === u.id));

  const addMember = async (uid) => { await api.addMember(projectId, uid, 'member'); onClose(); };
  const removeMember = async (uid) => { await api.removeMember(projectId, uid); onClose(); };

  return (
    <Modal title="Manage Team" onClose={onClose}>
      <div className="team-list">
        {members.map(m => (
          <div className="team-member" key={m.id}>
            <div className="member-info">
              <div className="avatar" style={{ width: 32, height: 32, background: m.avatar_color || '#8b5cf6', fontSize: 13 }}>{m.name.charAt(0)}</div>
              <div><strong>{m.name}</strong><span className="member-role">{m.role}</span></div>
            </div>
            {isAdmin && <button className="btn btn-ghost btn-sm btn-danger-text" onClick={() => removeMember(m.id)}>✕</button>}
          </div>
        ))}
      </div>
      {isAdmin && nonMembers.length > 0 && (
        <div className="add-member-section">
          <h4>Add Member</h4>
          <div className="form-row">
            <select id="add-member-sel" className="form-group">{nonMembers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</select>
            <button className="btn btn-primary btn-sm" onClick={() => addMember(document.getElementById('add-member-sel').value)}>Add</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
