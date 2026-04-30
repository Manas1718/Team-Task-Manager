# Ethara AI — Team Task Manager

A full-stack web application for team project management, task assignment, and progress tracking with role-based access control (Admin/Member).

**Built by Ethara AI**

🔗 **Live URL:** [https://web-production-228f7.up.railway.app](https://web-production-228f7.up.railway.app)  
📦 **GitHub Repo:** [https://github.com/Manas1718/Team-Task-Manager](https://github.com/Manas1718/Team-Task-Manager)

---

## 🚀 Features

- **Authentication** — Signup & Login with JWT tokens (first user auto-promoted to Admin)
- **Role-Based Access Control** — Admin & Member roles at both global and project levels
- **Project Management** — Create, edit, delete projects with descriptions and status tracking
- **Task Management** — Kanban-style board with 4 columns (To Do / In Progress / Review / Done)
- **Team Management** — Add/remove project members with role-based permissions
- **Dashboard** — Real-time stats: task breakdown, overdue tasks, recent activity, completion %
- **Responsive Design** — Works on desktop, tablet, and mobile

## ⚙️ Tech Stack

| Layer      | Technology               |
|------------|--------------------------|
| Frontend   | React + Vite             |
| Backend    | Node.js + Express        |
| Database   | SQLite (sql.js - WASM)   |
| Auth       | JWT + bcryptjs           |
| Routing    | React Router DOM         |
| Styling    | Custom CSS (dark theme)  |
| Deployment | Railway                  |

## 📦 Installation

```bash
git clone https://github.com/Manas1718/Team-Task-Manager.git
cd Team-Task-Manager
npm install
npm run build
npm start
```

App available at `http://localhost:3000`

## 🔑 Environment Variables

```
PORT=3000
JWT_SECRET=your-secret-key-here
```

## 📁 Project Structure

```
ethara-task-manager/
├── server.js              # Express server entry point
├── database.js            # SQLite database (sql.js WASM)
├── middleware/auth.js      # JWT auth & RBAC middleware
├── routes/
│   ├── auth.js            # Signup, Login, Users
│   ├── projects.js        # Project CRUD + Members
│   ├── tasks.js           # Task CRUD + Filtering
│   └── dashboard.js       # Dashboard stats
├── client/                # React Frontend (Vite)
│   └── src/
│       ├── App.jsx, api.js, index.css
│       ├── context/AuthContext.jsx
│       ├── components/Layout.jsx, Modal.jsx
│       └── pages/AuthPage, Dashboard, Projects, ProjectDetail, Tasks, Team
├── public/                # Built React output
├── package.json, Procfile, vercel.json
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
| DELETE | `/api/projects/:id/members/:uid` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List user's tasks |
| POST | `/api/tasks/project/:pid` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard stats |

## 🔒 Role-Based Access Control

- **Admin**: View all projects, manage all members and tasks
- **Member**: View assigned projects, create/edit tasks in their projects
- **Project Admin**: Project creator — can manage project members
- **First Signup**: Automatically becomes global Admin

## 🌐 Deployment (Railway)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select `Team-Task-Manager` repo
4. Add env variable: `JWT_SECRET`
5. Generate domain in Settings → Networking
6. App is live!

## ✅ Submission Checklist

- [x] Live URL: https://web-production-228f7.up.railway.app
- [x] GitHub Repo: https://github.com/Manas1718/Team-Task-Manager
- [x] README documentation
- [ ] 2–5 min demo video

## 📝 License

MIT
