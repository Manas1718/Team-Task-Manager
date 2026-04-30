const express = require('express');
const { getDB } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Total projects
    const projectCount = isAdmin
      ? db.prepare('SELECT COUNT(*) as count FROM projects').get().count
      : db.prepare(`SELECT COUNT(DISTINCT p.id) as count FROM projects p
          INNER JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = ?`).get(userId).count;

    // Task stats
    const taskBase = isAdmin ? '' : 'AND (t.assigned_to = ? OR t.created_by = ?)';
    const taskParams = isAdmin ? [] : [userId, userId];

    const totalTasks = db.prepare(
      `SELECT COUNT(*) as count FROM tasks t WHERE 1=1 ${taskBase}`
    ).get(...taskParams).count;

    const todoTasks = db.prepare(
      `SELECT COUNT(*) as count FROM tasks t WHERE t.status = 'todo' ${taskBase}`
    ).get(...taskParams).count;

    const inProgressTasks = db.prepare(
      `SELECT COUNT(*) as count FROM tasks t WHERE t.status = 'in-progress' ${taskBase}`
    ).get(...taskParams).count;

    const reviewTasks = db.prepare(
      `SELECT COUNT(*) as count FROM tasks t WHERE t.status = 'review' ${taskBase}`
    ).get(...taskParams).count;

    const doneTasks = db.prepare(
      `SELECT COUNT(*) as count FROM tasks t WHERE t.status = 'done' ${taskBase}`
    ).get(...taskParams).count;

    // Overdue tasks
    const overdueTasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name, u.avatar_color as assignee_color
      FROM tasks t LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.due_date < date('now') AND t.status != 'done' ${taskBase}
      ORDER BY t.due_date ASC LIMIT 10
    `).all(...taskParams);

    // Recent tasks
    const recentTasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name, u.avatar_color as assignee_color
      FROM tasks t LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1 ${taskBase}
      ORDER BY t.updated_at DESC LIMIT 8
    `).all(...taskParams);

    // Team members count
    const teamCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    res.json({
      stats: {
        projects: projectCount,
        totalTasks,
        todoTasks,
        inProgressTasks,
        reviewTasks,
        doneTasks,
        teamMembers: teamCount
      },
      overdueTasks,
      recentTasks
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
