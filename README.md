# Ethara AI — Team Task Manager

A full-stack web application for team project management, task assignment, and progress tracking with role-based access control (Admin/Member).

**Built by Ethara AI**

---

## 🚀 Features

- **Authentication** — Signup & Login with JWT tokens (first user auto-promoted to Admin)
- **Project Management** — Create, edit, delete projects with descriptions and status tracking
- **Task Management** — Kanban-style board with drag-free status columns (To Do / In Progress / Review / Done)
- **Team Management** — Add/remove project members with role-based permissions
- **Dashboard** — Real-time stats: task breakdown, overdue tasks, recent activity, completion percentage
- **Role-Based Access Control** — Admin & Member roles at both global and project levels
- **Responsive Design** — Works on desktop, tablet, and mobile

## ⚙️ Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| Frontend   | Vanilla HTML/CSS/JS |
| Backend    | Node.js + Express   |
| Database   | SQLite (better-sqlite3) |
| Auth       | JWT + bcryptjs      |
| Styling    | Custom CSS (dark glassmorphism theme) |

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ethara-task-manager.git
cd ethara-task-manager

# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

The app will be available at `http://localhost:3000`

## 🔑 Environment Variables (Optional)

Create a `.env` file:

```
PORT=3000
JWT_SECRET=your-secret-key-here
```

## 📁 Project Structure

```
ethara-task-manager/
├── server.js              # Express server entry point
├── database.js            # SQLite database setup & schema
├── middleware/
│   └── auth.js            # JWT authentication & RBAC middleware
├── routes/
│   ├── auth.js            # Signup, Login, User listing
│   ├── projects.js        # Project CRUD + Member management
│   ├── tasks.js           # Task CRUD + Filtering
│   └── dashboard.js       # Dashboard aggregation stats
├── public/
│   ├── index.html         # SPA shell
│   ├── css/style.css      # Complete styling
│   └── js/
│       ├── api.js          # REST API wrapper
│       └── app.js          # Frontend routing & rendering
├── package.json
├── Procfile               # Railway deployment
└── README.md
```

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | List all users |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project detail |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List user's tasks |
| POST | `/api/tasks/project/:projectId` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard stats |

## 🌐 Deployment on Railway

1. Push code to GitHub
2. Go to [Railway](https://railway.app) and create a new project
3. Connect your GitHub repository
4. Railway will auto-detect the `Procfile` and deploy
5. Set environment variable `JWT_SECRET` in Railway dashboard
6. Your app will be live!

## 📝 License

MIT
