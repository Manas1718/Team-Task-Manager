const express = require('express');
const { getDB } = require('../database');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all projects for current user
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDB();
    let projects;

    if (req.user.role === 'admin') {
      projects = db.prepare(`
        SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_tasks
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.updated_at DESC
      `).all();
    } else {
      projects = db.prepare(`
        SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_tasks
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        INNER JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
        ORDER BY p.updated_at DESC
      `).all(req.user.id);
    }

    res.json({ projects });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create project
router.post('/', authenticate, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Project name is required' });

    const db = getDB();
    const result = db.prepare(
      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)'
    ).run(name.trim(), description || '', req.user.id);

    // Add creator as project admin
    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(result.lastInsertRowid, req.user.id, 'admin');

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ project });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project with members and tasks
router.get('/:id', authenticate, requireProjectAccess, (req, res) => {
  try {
    const db = getDB();
    const project = db.prepare(`
      SELECT p.*, u.name as creator_name
      FROM projects p LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.avatar_color, pm.role, pm.joined_at
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(req.params.id);

    const tasks = db.prepare(`
      SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = ?
      ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, t.created_at DESC
    `).all(req.params.id);

    res.json({ project, members, tasks });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
router.put('/:id', authenticate, requireProjectAccess, requireProjectAdmin, (req, res) => {
  try {
    const { name, description, status } = req.body;
    const db = getDB();
    db.prepare(`
      UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description),
      status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, description, status, req.params.id);
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json({ project });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', authenticate, requireProjectAccess, requireProjectAdmin, (req, res) => {
  try {
    const db = getDB();
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add member to project
router.post('/:id/members', authenticate, requireProjectAccess, requireProjectAdmin, (req, res) => {
  try {
    const { user_id, role } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    const db = getDB();
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = db.prepare(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, user_id);
    if (existing) return res.status(409).json({ error: 'User is already a member' });

    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(req.params.id, user_id, role || 'member');

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.avatar_color, pm.role, pm.joined_at
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(req.params.id);

    res.status(201).json({ members });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member from project
router.delete('/:id/members/:userId', authenticate, requireProjectAccess, requireProjectAdmin, (req, res) => {
  try {
    const db = getDB();
    db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
      .run(req.params.id, req.params.userId);
    // Unassign tasks from removed member
    db.prepare('UPDATE tasks SET assigned_to = NULL WHERE project_id = ? AND assigned_to = ?')
      .run(req.params.id, req.params.userId);
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
