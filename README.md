# 📋 Trello Clone — Full-Stack Kanban Board

A full-stack Kanban board application inspired by Trello, built with **React** and **Node.js/Express**. Features drag-and-drop task management, rich card details, real-time collaboration tools, and a polished dark-themed UI with glassmorphic design elements.

![Board View](https://img.shields.io/badge/status-active-brightgreen) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![Express](https://img.shields.io/badge/Express-5-000000?logo=express) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql) ![Netlify](https://img.shields.io/badge/Netlify-deployed-00C7B7?logo=netlify) ![AWS](https://img.shields.io/badge/AWS_EC2-deployed-FF9900?logo=amazonaws)

> 🌐 **Live Demo**: [https://trello-clone-aman.netlify.app](https://trello-clone-aman.netlify.app)

---

## ✨ Features

### Board Management
- 🗂️ Create, rename, and delete boards
- 🎨 Customizable board backgrounds (solid colors, gradients, and photos)
- ⭐ Star/unstar boards for quick access
- 📋 Archived items management (cards & lists)

### Lists
- ➕ Create, rename, and reorder lists via drag & drop
- 🎨 Custom list colors (solids & gradients)
- 🗜️ Collapsible lists with card count badge
- 🗄️ Archive and restore lists

### Cards
- ✏️ Create cards with inline title editing
- 🖱️ Drag & drop cards within and across lists
- ✅ Mark cards as complete (auto-moves to "Done" list)
- 🗄️ Archive/restore cards with Ctrl+Z undo support
- 🔍 Global card search across all boards

### Card Details (Modal)
- 📝 Rich markdown description with live preview
- 🏷️ Color-coded labels
- 👥 Assign/remove team members
- ☑️ Checklists with progress tracking
- 📅 Due dates with overdue/today indicators
- 🖼️ Card covers (colors, gradients, images, custom URLs)
- 🔗 URL attachments
- 💬 Comments with author attribution
- 📊 Full activity log

### UI/UX
- 🌙 Premium dark theme with glassmorphic panels
- 🎯 Fully responsive (mobile, tablet, desktop)
- 📱 Mobile sidebar with hamburger toggle
- 📆 Calendar/Planner panel
- 🔄 Board switcher
- 👤 Member activity dropdown
- ✨ Smooth micro-animations and transitions

---

## 🏗️ Tech Stack

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| **Frontend** | React 19, React Router 7, @dnd-kit (drag & drop), React Markdown, Vite |
| **Backend**  | Node.js, Express 5, pg (node-postgres)                                  |
| **Database** | PostgreSQL (NeonDB-hosted)                                              |
| **Styling**  | Vanilla CSS with CSS custom properties                                  |
| **Hosting**  | Netlify (frontend) · AWS EC2 (backend, Nginx + PM2 + HTTPS)             |

---

## 📁 Project Structure

```
trello-clone/
├── .gitignore
├── render.yaml                   # Render Blueprint (one-click deploy)
├── package.json                  # Root scripts (dev:all, install:all)
│
├── backend/
│   ├── index.js                  # Express server entry point
│   ├── .env                      # Environment variables (git-ignored)
│   ├── .env.example              # Template for env variables
│   └── src/
│       ├── controllers/
│       │   ├── boardController.js
│       │   ├── listController.js
│       │   ├── cardController.js
│       │   └── metaController.js
│       ├── db/
│       │   ├── index.js              # PostgreSQL connection pool (SSL-ready)
│       │   ├── schema.sql            # Full schema + seed data
│       │   └── migrations/
│       ├── middleware/
│       └── routes/
│           └── index.js
│
├── frontend/
│   ├── netlify.toml              # Netlify build & redirect config
│   ├── public/
│   │   └── _redirects            # SPA fallback for React Router
│   └── src/
│       ├── App.jsx               # Router setup
│       ├── api.js                # API client (env-aware base URL)
│       ├── constants.js
│       ├── context/
│       │   └── MemberContext.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   └── Board.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── CardModal.jsx
│       │   ├── BoardCard.jsx
│       │   ├── CalendarPanel.jsx
│       │   ├── BoardSwitcherPanel.jsx
│       │   ├── BottomNav.jsx
│       │   ├── CreateBoardModal.jsx
│       │   └── ...
│       └── styles/
│           ├── base.css
│           ├── board.css
│           ├── cardmodal.css
│           └── home.css
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** database (or a [NeonDB](https://neon.tech) / [Supabase](https://supabase.com) project)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/trello-clone.git
cd trello-clone
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your database URL:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=5001
FRONTEND_URL=http://localhost:5173
```

### 4. Initialize the database

```bash
psql $DATABASE_URL -f backend/src/db/schema.sql
```

> ⚠️ **Warning**: The schema file drops existing tables before recreating them. Only run on a fresh database or one you're okay resetting.

### 5. Start the application

```bash
# Start both backend and frontend concurrently
npm run dev:all
```

Or start them individually:

```bash
# Terminal 1 — Backend (port 5001)
cd backend && npm start

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

### 6. Open in browser

Navigate to **http://localhost:5173**

---

## 🌐 Deployment

### Backend → AWS EC2

The backend runs on an **AWS EC2 t3.micro** instance with Nginx as a reverse proxy, PM2 for process management, and Let's Encrypt SSL via a DuckDNS subdomain.

1. **Provision** a `t3.micro` Ubuntu EC2 instance
2. **Install** Node.js 20.x, Nginx, PM2
3. **Clone** the repo and set up `backend/.env`:

   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   PORT=5001
   FRONTEND_URL=https://your-app.netlify.app
   NODE_ENV=production
   ```

4. **Start** the backend:

   ```bash
   cd backend && npm install && pm2 start index.js --name trello-api
   pm2 save && pm2 startup
   ```

5. **Configure Nginx** as a reverse proxy (port 80/443 → localhost:5001)
6. **Set up SSL** with Certbot + DuckDNS for free HTTPS

---

### Frontend → Netlify

1. Go to [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Connect your GitHub repo
3. Configure build settings:

   | Setting              | Value            |
   | -------------------- | ---------------- |
   | **Base directory**   | `frontend`       |
   | **Build command**    | `npm run build`  |
   | **Publish directory**| `frontend/dist`  |

4. Add the environment variable:

   | Variable        | Value                                              |
   | --------------- | -------------------------------------------------- |
   | `VITE_API_URL`  | Your EC2 backend URL (e.g. `https://your-domain.duckdns.org`) |

   > ⚠️ **Important**: Do NOT include a trailing slash or `/api` — the app appends `/api` automatically.

5. Click **Deploy site**

---

### Post-Deployment Checklist

- [ ] Backend health check: visit `https://your-backend-domain/health` — should return `{"status":"ok"}`
- [ ] Update `FRONTEND_URL` on EC2 `.env` with your actual Netlify URL
- [ ] Update `VITE_API_URL` on Netlify with your actual EC2/domain URL
- [ ] Test the live app: create a board, add cards, drag & drop

---

## 🔌 API Reference

All endpoints are prefixed with `/api`. Base URL in production: `https://your-backend-domain/api`

### Boards

| Method   | Endpoint                    | Description               |
| -------- | --------------------------- | ------------------------- |
| `GET`    | `/boards`                   | List all boards           |
| `POST`   | `/boards`                   | Create a board            |
| `GET`    | `/boards/:id`               | Get board with lists/cards|
| `PATCH`  | `/boards/:id`               | Update board              |
| `DELETE` | `/boards/:id`               | Delete board              |
| `POST`   | `/boards/:id/toggle-star`   | Toggle star on board      |
| `GET`    | `/boards/:id/activity`      | Get board activity log    |

### Lists

| Method   | Endpoint                    | Description               |
| -------- | --------------------------- | ------------------------- |
| `POST`   | `/boards/:id/lists`         | Create a list             |
| `PATCH`  | `/lists/:id`                | Update list               |
| `PATCH`  | `/lists/:id/reorder`        | Reorder list position     |
| `DELETE` | `/lists/:id`                | Delete list               |

### Cards

| Method   | Endpoint                            | Description                    |
| -------- | ----------------------------------- | ------------------------------ |
| `POST`   | `/lists/:id/cards`                  | Create a card                  |
| `GET`    | `/cards/search?q=`                  | Search cards globally          |
| `GET`    | `/cards/:id`                        | Get card with full details     |
| `PATCH`  | `/cards/:id`                        | Update card                    |
| `PATCH`  | `/cards/:id/move`                   | Move card to new list/position |
| `DELETE` | `/cards/:id`                        | Delete card                    |
| `POST`   | `/cards/:id/labels`                 | Add label to card              |
| `DELETE` | `/cards/:id/labels/:labelId`        | Remove label from card         |
| `POST`   | `/cards/:id/members`                | Add member to card             |
| `DELETE` | `/cards/:id/members/:memberId`      | Remove member from card        |
| `POST`   | `/cards/:id/checklist-items`        | Add checklist item             |
| `PATCH`  | `/checklist-items/:id`              | Toggle/update checklist item   |
| `DELETE` | `/checklist-items/:id`              | Delete checklist item          |
| `POST`   | `/cards/:id/attachments`            | Add attachment                 |
| `DELETE` | `/cards/:id/attachments/:attachId`  | Delete attachment              |
| `POST`   | `/cards/:id/comments`               | Add comment                    |
| `DELETE` | `/cards/:id/comments/:commentId`    | Delete comment                 |

### Labels & Members

| Method   | Endpoint       | Description          |
| -------- | -------------- | -------------------- |
| `GET`    | `/labels`      | List all labels      |
| `POST`   | `/labels`      | Create a label       |
| `GET`    | `/members`     | List all members     |
| `POST`   | `/members`     | Create a member      |

### Health Check

| Method | Endpoint   | Description          |
| ------ | ---------- | -------------------- |
| `GET`  | `/health`  | Returns `{"status":"ok"}` |

---

## 🗄️ Database Schema

```
boards ──┬── lists ──── cards ──┬── card_labels ──── labels
         │                     ├── card_members ─── members
         │                     ├── checklist_items
         │                     ├── attachments
         │                     ├── comments ──────── members
         │                     └── activity_logs ─── members
         └── members (board owner)
```

---

## 🛠️ Available Scripts

### Root

| Script          | Command                | Description                         |
| --------------- | ---------------------- | ----------------------------------- |
| `dev:all`       | `npm run dev:all`      | Start backend + frontend together   |
| `install:all`   | `npm run install:all`  | Install deps for both packages      |

### Backend (`/backend`)

| Script   | Command          | Description                     |
| -------- | ---------------- | ------------------------------- |
| `start`  | `npm start`      | Start server with Node          |
| `dev`    | `npm run dev`    | Start server with Nodemon (HMR) |

### Frontend (`/frontend`)

| Script    | Command            | Description               |
| --------- | ------------------ | ------------------------- |
| `dev`     | `npm run dev`      | Start Vite dev server     |
| `build`   | `npm run build`    | Production build          |
| `preview` | `npm run preview`  | Preview production build  |
| `lint`    | `npm run lint`     | Run ESLint                |

---

## 🔧 Environment Variables

### Backend (AWS EC2)

| Variable       | Required | Description                                        |
| -------------- | -------- | -------------------------------------------------- |
| `DATABASE_URL` | ✅       | PostgreSQL connection string (with `?sslmode=require`) |
| `PORT`         | ❌       | Server port (default: `5001`)                       |
| `NODE_ENV`     | ❌       | Set to `production` (enables SSL for DB)            |
| `FRONTEND_URL` | ✅       | Netlify URL for CORS (comma-separated for multiple) |

### Frontend (Netlify)

| Variable       | Required | Description                                        |
| -------------- | -------- | -------------------------------------------------- |
| `VITE_API_URL` | ✅       | EC2 backend URL (e.g. `https://your-domain.duckdns.org`) |

---

## 📄 License

This project is licensed under the ISC License.
