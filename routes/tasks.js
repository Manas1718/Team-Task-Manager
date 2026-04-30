const express = require('express');
const { getDB } = require('../database');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const router = express.Router();

// Get all tasks for current user (dashboard view)
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDB();
    const { status, priority, project_id } = req.query;
    let conditions = [];
    let params = [];

    if (req.user.role !== 'admin') {
      conditions.push('(t.assigned_to = ? OR t.created_by = ?)');
      params.push(req.user.id, req.user.id);
    }
    if (status) { conditions.push('t.status = ?'); params.push(status); }
    if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
    if (project_id) { conditions.push('t.project_id = ?'); params.push(project_id); }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const tasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name,
      u.avatar_color as assignee_color, c.name as creator_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      ${where}
      ORDER BY t.created_at DESC
    `).all(...params);

    res.json({ tasks });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task in a project
router.post('/project/:projectId', authenticate, requireProjectAccess, (req, res) => {
  try {
    const { title, description, assigned_to, priority, due_date, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });

    const db = getDB();

    if (assigned_to) {
      const member = db.prepare(
        'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?'
      ).get(req.params.projectId, assigned_to);
      if (!member && req.user.role !== 'admin') {
        return res.status(400).json({ error: 'Assigned user is not a project member' });
      }
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title.trim(), description || '', req.params.projectId, assigned_to || null,
      req.user.id, priority || 'medium', due_date || null, status || 'todo');

    db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(req.params.projectId);

    const task = db.prepare(`
      SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, p.name as project_name
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDB();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title, description, assigned_to, status, priority, due_date } = req.body;

    db.prepare(`
      UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        assigned_to = ?,
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        due_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, description,
      assigned_to !== undefined ? assigned_to : task.assigned_to,
      status, priority,
      due_date !== undefined ? due_date : task.due_date,
      req.params.id
    );

    db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(task.project_id);

    const updated = db.prepare(`
      SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, p.name as project_name
      FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = ?
    `).get(req.params.id);

    res.json({ task: updated });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDB();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
