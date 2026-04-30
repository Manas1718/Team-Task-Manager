const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Use /tmp on Vercel (serverless), local data/ folder otherwise
const isVercel = process.env.VERCEL === '1';
const DB_PATH = isVercel
  ? '/tmp/ethara.db'
  : path.join(__dirname, 'data', 'ethara.db');

let dbWrapper = null;

// Wrapper to provide better-sqlite3 compatible API over sql.js
class DBWrapper {
  constructor(sqlDb) {
    this.db = sqlDb;
  }

  prepare(sql) {
    const self = this;
    return {
      get(...params) {
        let stmt;
        try {
          stmt = self.db.prepare(sql);
          if (params.length) stmt.bind(params);
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          if (stmt) stmt.free();
        }
      },
      all(...params) {
        const results = [];
        let stmt;
        try {
          stmt = self.db.prepare(sql);
          if (params.length) stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          return results;
        } finally {
          if (stmt) stmt.free();
        }
      },
      run(...params) {
        self.db.run(sql, params);
        const lastId = self.db.exec("SELECT last_insert_rowid()");
        return {
          lastInsertRowid: lastId.length ? lastId[0].values[0][0] : 0,
          changes: self.db.getRowsModified()
        };
      }
    };
  }

  exec(sql) {
    this.db.exec(sql);
  }

  pragma(str) {
    try { this.db.exec(`PRAGMA ${str}`); } catch (e) { /* ignore */ }
  }

  save() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (e) {
      console.error('DB save error:', e.message);
    }
  }
}

async function getDB() {
  if (dbWrapper) return dbWrapper;

  const SQL = await initSqlJs();

  let db;
  try {
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
  } catch (e) {
    db = new SQL.Database();
  }

  dbWrapper = new DBWrapper(db);
  dbWrapper.pragma('foreign_keys = ON');
  return dbWrapper;
}

async function initDB() {
  const db = await getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      avatar_color TEXT DEFAULT '#8b5cf6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'archived')),
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      project_id INTEGER NOT NULL,
      assigned_to INTEGER,
      created_by INTEGER NOT NULL,
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'review', 'done')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  db.save();
  console.log('✅ Database initialized');
}

module.exports = { getDB, initDB };
