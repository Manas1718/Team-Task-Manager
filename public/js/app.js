// Ethara AI Task Manager - Main App
const App = {
  user: null,
  currentPage: 'dashboard',
  projectCache: null,

  init() {
    this.user = API.getUser();
    if (this.user) { this.showApp(); }
    this.bindAuthEvents();
    this.bindModalEvents();
    window.addEventListener('hashchange', () => this.route());
  },

  // ── Toast ──
  toast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  // ── Modal ──
  openModal(title, html) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
  },
  closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); },
  bindModalEvents() {
    document.getElementById('modal-close-btn').onclick = () => this.closeModal();
    document.getElementById('modal-overlay').onclick = (e) => { if (e.target.id === 'modal-overlay') this.closeModal(); };
  },

  // ── Auth ──
  bindAuthEvents() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('login-form').classList.toggle('hidden', tab.dataset.tab !== 'login');
        document.getElementById('signup-form').classList.toggle('hidden', tab.dataset.tab !== 'signup');
        document.getElementById('auth-error').classList.add('hidden');
      };
    });
    document.getElementById('login-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const data = await API.login(
          document.getElementById('login-email').value,
          document.getElementById('login-password').value
        );
        API.setAuth(data.token, data.user);
        this.user = data.user;
        this.showApp();
      } catch (err) { this.showAuthError(err.message); }
    };
    document.getElementById('signup-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const data = await API.signup(
          document.getElementById('signup-name').value,
          document.getElementById('signup-email').value,
          document.getElementById('signup-password').value,
          document.getElementById('signup-role').value
        );
        API.setAuth(data.token, data.user);
        this.user = data.user;
        this.showApp();
      } catch (err) { this.showAuthError(err.message); }
    };
    document.getElementById('logout-btn').onclick = () => {
      API.clearAuth(); this.user = null;
      document.getElementById('auth-screen').classList.add('active');
      document.getElementById('main-app').classList.remove('active');
    };
  },
  showAuthError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg; el.classList.remove('hidden');
  },

  showApp() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
    const av = document.getElementById('sidebar-avatar');
    av.textContent = this.user.name.charAt(0).toUpperCase();
    av.style.background = this.user.avatar_color;
    document.getElementById('sidebar-user-name').textContent = this.user.name;
    document.getElementById('sidebar-user-role').textContent = this.user.role;
    document.querySelectorAll('.nav-item').forEach(n => n.onclick = (e) => {
      e.preventDefault(); window.location.hash = n.dataset.page;
    });
    this.route();
  },

  // ── Router ──
  route() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const [page, id] = hash.split('/');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    this.currentPage = page;
    const pages = { dashboard: () => this.renderDashboard(), projects: () => id ? this.renderProjectDetail(id) : this.renderProjects(), tasks: () => this.renderTasks(), team: () => this.renderTeam() };
    (pages[page] || pages.dashboard)();
  },

  // ── Helpers ──
  priorityClass(p) { return { low:'priority-low', medium:'priority-med', high:'priority-high', urgent:'priority-urgent' }[p] || ''; },
  statusLabel(s) { return { todo:'To Do', 'in-progress':'In Progress', review:'Review', done:'Done' }[s] || s; },
  statusIcon(s) { return { todo:'○', 'in-progress':'◐', review:'◑', done:'●' }[s] || '○'; },
  formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); },
  isOverdue(d, s) { return d && s !== 'done' && new Date(d) < new Date(); },
  avatar(name, color, size = 32) {
    return `<div class="avatar" style="width:${size}px;height:${size}px;background:${color||'#8b5cf6'};font-size:${size*0.4}px">${(name||'?').charAt(0).toUpperCase()}</div>`;
  },

  // ── Dashboard ──
  async renderDashboard() {
    const el = document.getElementById('page-content');
    el.innerHTML = '<div class="page-loader"><div class="spinner"></div></div>';
    try {
      const data = await API.getDashboard();
      const s = data.stats;
      const completion = s.totalTasks ? Math.round((s.doneTasks / s.totalTasks) * 100) : 0;
      el.innerHTML = `
        <div class="page-header"><h1>Dashboard</h1><p>Welcome back, ${this.user.name}</p></div>
        <div class="stats-grid">
          <div class="stat-card stat-purple"><div class="stat-icon">📁</div><div class="stat-info"><span class="stat-value">${s.projects}</span><span class="stat-label">Projects</span></div></div>
          <div class="stat-card stat-blue"><div class="stat-icon">📋</div><div class="stat-info"><span class="stat-value">${s.totalTasks}</span><span class="stat-label">Total Tasks</span></div></div>
          <div class="stat-card stat-green"><div class="stat-icon">✅</div><div class="stat-info"><span class="stat-value">${completion}%</span><span class="stat-label">Completed</span></div></div>
          <div class="stat-card stat-orange"><div class="stat-icon">👥</div><div class="stat-info"><span class="stat-value">${s.teamMembers}</span><span class="stat-label">Team Members</span></div></div>
        </div>
        <div class="dash-row">
          <div class="dash-col">
            <div class="card"><div class="card-header"><h3>Task Breakdown</h3></div><div class="card-body">
              <div class="task-bars">
                <div class="task-bar-item"><span class="bar-label">To Do</span><div class="bar-track"><div class="bar-fill bar-todo" style="width:${s.totalTasks?s.todoTasks/s.totalTasks*100:0}%"></div></div><span class="bar-count">${s.todoTasks}</span></div>
                <div class="task-bar-item"><span class="bar-label">In Progress</span><div class="bar-track"><div class="bar-fill bar-progress" style="width:${s.totalTasks?s.inProgressTasks/s.totalTasks*100:0}%"></div></div><span class="bar-count">${s.inProgressTasks}</span></div>
                <div class="task-bar-item"><span class="bar-label">Review</span><div class="bar-track"><div class="bar-fill bar-review" style="width:${s.totalTasks?s.reviewTasks/s.totalTasks*100:0}%"></div></div><span class="bar-count">${s.reviewTasks}</span></div>
                <div class="task-bar-item"><span class="bar-label">Done</span><div class="bar-track"><div class="bar-fill bar-done" style="width:${s.totalTasks?s.doneTasks/s.totalTasks*100:0}%"></div></div><span class="bar-count">${s.doneTasks}</span></div>
              </div>
            </div></div>
          </div>
          <div class="dash-col">
            <div class="card card-danger"><div class="card-header"><h3>⚠️ Overdue Tasks</h3></div><div class="card-body">
              ${data.overdueTasks.length === 0 ? '<p class="empty-text">No overdue tasks 🎉</p>' :
                data.overdueTasks.map(t => `<div class="mini-task overdue-task" onclick="window.location.hash='projects/${t.project_id}'">
                  <div class="mini-task-info"><strong>${this.esc(t.title)}</strong><span class="mini-meta">${this.esc(t.project_name||'')} · Due ${this.formatDate(t.due_date)}</span></div>
                  <span class="badge ${this.priorityClass(t.priority)}">${t.priority}</span></div>`).join('')}
            </div></div>
          </div>
        </div>
        <div class="card"><div class="card-header"><h3>Recent Activity</h3></div><div class="card-body">
          ${data.recentTasks.length === 0 ? '<p class="empty-text">No tasks yet. Create a project to get started!</p>' :
            `<div class="task-list">${data.recentTasks.map(t => this.taskRow(t)).join('')}</div>`}
        </div></div>`;
    } catch (err) { el.innerHTML = `<div class="error-msg">Failed to load dashboard: ${err.message}</div>`; }
  },

  taskRow(t) {
    return `<div class="task-row" onclick="window.location.hash='projects/${t.project_id}'">
      <div class="task-status-icon status-${t.status}">${this.statusIcon(t.status)}</div>
      <div class="task-info"><span class="task-title">${this.esc(t.title)}</span><span class="task-meta">${this.esc(t.project_name||'')}${t.assignee_name ? ' · '+this.esc(t.assignee_name) : ''}</span></div>
      <span class="badge ${this.priorityClass(t.priority)}">${t.priority}</span>
      <span class="badge badge-status status-${t.status}">${this.statusLabel(t.status)}</span>
      ${t.due_date ? `<span class="task-due ${this.isOverdue(t.due_date,t.status)?'overdue':''}">${this.formatDate(t.due_date)}</span>` : ''}
    </div>`;
  },

  // ── Projects ──
  async renderProjects() {
    const el = document.getElementById('page-content');
    el.innerHTML = '<div class="page-loader"><div class="spinner"></div></div>';
    try {
      const data = await API.getProjects();
      el.innerHTML = `
        <div class="page-header"><h1>Projects</h1>
          <button class="btn btn-primary" id="new-project-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Project</button>
        </div>
        ${data.projects.length === 0 ? '<div class="empty-state"><h3>No projects yet</h3><p>Create your first project to get started</p></div>' :
          `<div class="project-grid">${data.projects.map(p => {
            const pct = p.task_count ? Math.round(p.completed_tasks / p.task_count * 100) : 0;
            return `<div class="project-card" onclick="window.location.hash='projects/${p.id}'">
              <div class="project-card-header"><h3>${this.esc(p.name)}</h3><span class="badge badge-status status-${p.status}">${p.status}</span></div>
              <p class="project-desc">${this.esc(p.description||'No description')}</p>
              <div class="project-progress"><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><span class="progress-text">${pct}%</span></div>
              <div class="project-meta"><span>👤 ${p.member_count} members</span><span>📋 ${p.task_count} tasks</span></div>
            </div>`;
          }).join('')}</div>`}`;
      document.getElementById('new-project-btn')?.addEventListener('click', () => this.showNewProjectModal());
    } catch (err) { el.innerHTML = `<div class="error-msg">${err.message}</div>`; }
  },

  showNewProjectModal() {
    this.openModal('New Project', `
      <form id="new-project-form" class="modal-form">
        <div class="form-group"><label>Project Name</label><input type="text" id="np-name" required placeholder="My Project"></div>
        <div class="form-group"><label>Description</label><textarea id="np-desc" rows="3" placeholder="Project description..."></textarea></div>
        <button type="submit" class="btn btn-primary btn-full">Create Project</button>
      </form>`);
    document.getElementById('new-project-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await API.createProject({ name: document.getElementById('np-name').value, description: document.getElementById('np-desc').value });
        this.closeModal(); this.toast('Project created!'); this.renderProjects();
      } catch (err) { this.toast(err.message, 'error'); }
    };
  },

  // ── Project Detail ──
  async renderProjectDetail(id) {
    const el = document.getElementById('page-content');
    el.innerHTML = '<div class="page-loader"><div class="spinner"></div></div>';
    try {
      const data = await API.getProject(id);
      const p = data.project; const members = data.members; const tasks = data.tasks;
      const isProjectAdmin = this.user.role === 'admin' || members.find(m => m.id === this.user.id && m.role === 'admin');
      const statuses = ['todo','in-progress','review','done'];

      el.innerHTML = `
        <div class="page-header">
          <div><a href="#projects" class="back-link">← Projects</a><h1>${this.esc(p.name)}</h1><p>${this.esc(p.description||'')}</p></div>
          <div class="header-actions">
            <button class="btn btn-primary" id="add-task-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Task</button>
            ${isProjectAdmin ? `<button class="btn btn-secondary" id="manage-team-btn">👥 Team</button>
            <button class="btn btn-ghost btn-danger-text" id="delete-project-btn">🗑️</button>` : ''}
          </div>
        </div>
        <div class="board">${statuses.map(s => `
          <div class="board-column" data-status="${s}">
            <div class="column-header"><span class="column-dot status-${s}"></span><h3>${this.statusLabel(s)}</h3><span class="column-count">${tasks.filter(t=>t.status===s).length}</span></div>
            <div class="column-body">${tasks.filter(t=>t.status===s).map(t => `
              <div class="task-card" data-id="${t.id}">
                <div class="task-card-top"><span class="badge ${this.priorityClass(t.priority)}">${t.priority}</span>
                  ${t.due_date ? `<span class="task-due-sm ${this.isOverdue(t.due_date,t.status)?'overdue':''}">${this.formatDate(t.due_date)}</span>` : ''}</div>
                <h4>${this.esc(t.title)}</h4>
                ${t.description ? `<p class="task-card-desc">${this.esc(t.description).substring(0,80)}</p>` : ''}
                <div class="task-card-footer">${t.assignee_name ? this.avatar(t.assignee_name, t.assignee_color, 24)+`<span class="assignee-name">${this.esc(t.assignee_name)}</span>` : '<span class="unassigned">Unassigned</span>'}</div>
              </div>`).join('') || '<p class="empty-col">No tasks</p>'}
            </div>
          </div>`).join('')}
        </div>`;

      // Bind events
      document.getElementById('add-task-btn').onclick = () => this.showNewTaskModal(id, members);
      el.querySelectorAll('.task-card').forEach(card => {
        card.onclick = () => this.showEditTaskModal(card.dataset.id, id, members);
      });
      if (isProjectAdmin) {
        document.getElementById('manage-team-btn').onclick = () => this.showTeamModal(id, members);
        document.getElementById('delete-project-btn').onclick = async () => {
          if (confirm('Delete this project and all its tasks?')) {
            await API.deleteProject(id); this.toast('Project deleted'); window.location.hash = 'projects';
          }
        };
      }
    } catch (err) { el.innerHTML = `<div class="error-msg">${err.message}</div>`; }
  },

  showNewTaskModal(projectId, members) {
    this.openModal('New Task', `
      <form id="new-task-form" class="modal-form">
        <div class="form-group"><label>Title</label><input type="text" id="nt-title" required placeholder="Task title"></div>
        <div class="form-group"><label>Description</label><textarea id="nt-desc" rows="2" placeholder="Details..."></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Priority</label><select id="nt-priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
          <div class="form-group"><label>Status</label><select id="nt-status"><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="done">Done</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Assign To</label><select id="nt-assign"><option value="">Unassigned</option>${members.map(m=>`<option value="${m.id}">${this.esc(m.name)}</option>`).join('')}</select></div>
          <div class="form-group"><label>Due Date</label><input type="date" id="nt-due"></div>
        </div>
        <button type="submit" class="btn btn-primary btn-full">Create Task</button>
      </form>`);
    document.getElementById('new-task-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await API.createTask(projectId, {
          title: document.getElementById('nt-title').value,
          description: document.getElementById('nt-desc').value,
          priority: document.getElementById('nt-priority').value,
          status: document.getElementById('nt-status').value,
          assigned_to: document.getElementById('nt-assign').value || null,
          due_date: document.getElementById('nt-due').value || null
        });
        this.closeModal(); this.toast('Task created!'); this.renderProjectDetail(projectId);
      } catch (err) { this.toast(err.message, 'error'); }
    };
  },

  async showEditTaskModal(taskId, projectId, members) {
    const data = await API.getTasks(`project_id=${projectId}`);
    const t = data.tasks.find(x => x.id == taskId);
    if (!t) return;
    this.openModal('Edit Task', `
      <form id="edit-task-form" class="modal-form">
        <div class="form-group"><label>Title</label><input type="text" id="et-title" value="${this.esc(t.title)}" required></div>
        <div class="form-group"><label>Description</label><textarea id="et-desc" rows="2">${this.esc(t.description||'')}</textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Priority</label><select id="et-priority">${['low','medium','high','urgent'].map(p=>`<option value="${p}" ${t.priority===p?'selected':''}>${p}</option>`).join('')}</select></div>
          <div class="form-group"><label>Status</label><select id="et-status">${['todo','in-progress','review','done'].map(s=>`<option value="${s}" ${t.status===s?'selected':''}>${this.statusLabel(s)}</option>`).join('')}</select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Assign To</label><select id="et-assign"><option value="">Unassigned</option>${members.map(m=>`<option value="${m.id}" ${t.assigned_to==m.id?'selected':''}>${this.esc(m.name)}</option>`).join('')}</select></div>
          <div class="form-group"><label>Due Date</label><input type="date" id="et-due" value="${t.due_date||''}"></div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save Changes</button>
          <button type="button" class="btn btn-danger" id="delete-task-btn">Delete</button>
        </div>
      </form>`);
    document.getElementById('edit-task-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await API.updateTask(taskId, {
          title: document.getElementById('et-title').value,
          description: document.getElementById('et-desc').value,
          priority: document.getElementById('et-priority').value,
          status: document.getElementById('et-status').value,
          assigned_to: document.getElementById('et-assign').value || null,
          due_date: document.getElementById('et-due').value || null
        });
        this.closeModal(); this.toast('Task updated!'); this.renderProjectDetail(projectId);
      } catch (err) { this.toast(err.message, 'error'); }
    };
    document.getElementById('delete-task-btn').onclick = async () => {
      if (confirm('Delete this task?')) {
        await API.deleteTask(taskId); this.closeModal(); this.toast('Task deleted'); this.renderProjectDetail(projectId);
      }
    };
  },

  async showTeamModal(projectId, currentMembers) {
    let allUsers = [];
    try { const d = await API.getUsers(); allUsers = d.users; } catch(e) {}
    const nonMembers = allUsers.filter(u => !currentMembers.find(m => m.id === u.id));
    this.openModal('Manage Team', `
      <div class="team-list">${currentMembers.map(m => `
        <div class="team-member"><div class="member-info">${this.avatar(m.name, m.avatar_color)}<div><strong>${this.esc(m.name)}</strong><span class="member-role">${m.role}</span></div></div>
        <button class="btn btn-ghost btn-sm btn-danger-text remove-member-btn" data-uid="${m.id}" title="Remove">✕</button></div>`).join('')}
      </div>
      ${nonMembers.length ? `<div class="add-member-section"><h4>Add Member</h4><div class="form-row">
        <select id="add-member-select" class="form-group">${nonMembers.map(u=>`<option value="${u.id}">${this.esc(u.name)} (${u.email})</option>`).join('')}</select>
        <button class="btn btn-primary btn-sm" id="add-member-btn">Add</button></div></div>` : '<p class="empty-text">All users are members</p>'}`);
    document.querySelectorAll('.remove-member-btn').forEach(btn => {
      btn.onclick = async () => {
        await API.removeMember(projectId, btn.dataset.uid);
        this.toast('Member removed'); this.closeModal(); this.renderProjectDetail(projectId);
      };
    });
    document.getElementById('add-member-btn')?.addEventListener('click', async () => {
      const uid = document.getElementById('add-member-select').value;
      await API.addMember(projectId, uid, 'member');
      this.toast('Member added!'); this.closeModal(); this.renderProjectDetail(projectId);
    });
  },

  // ── My Tasks ──
  async renderTasks() {
    const el = document.getElementById('page-content');
    el.innerHTML = '<div class="page-loader"><div class="spinner"></div></div>';
    try {
      const data = await API.getTasks();
      el.innerHTML = `
        <div class="page-header"><h1>My Tasks</h1></div>
        ${data.tasks.length === 0 ? '<div class="empty-state"><h3>No tasks assigned</h3><p>Tasks assigned to you will appear here</p></div>' :
          `<div class="card"><div class="card-body"><div class="task-list">${data.tasks.map(t => this.taskRow(t)).join('')}</div></div></div>`}`;
    } catch (err) { el.innerHTML = `<div class="error-msg">${err.message}</div>`; }
  },

  // ── Team ──
  async renderTeam() {
    const el = document.getElementById('page-content');
    el.innerHTML = '<div class="page-loader"><div class="spinner"></div></div>';
    try {
      const data = await API.getUsers();
      el.innerHTML = `
        <div class="page-header"><h1>Team</h1><p>${data.users.length} members</p></div>
        <div class="team-grid">${data.users.map(u => `
          <div class="team-card">${this.avatar(u.name, u.avatar_color, 48)}
            <h3>${this.esc(u.name)}</h3><p>${this.esc(u.email)}</p>
            <span class="badge badge-role-${u.role}">${u.role}</span>
          </div>`).join('')}</div>`;
    } catch (err) { el.innerHTML = `<div class="error-msg">${err.message}</div>`; }
  },

  esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
};

document.addEventListener('DOMContentLoaded', () => App.init());
