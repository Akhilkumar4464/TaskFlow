# TaskFlow - Real-time Collaborative Kanban Board

TaskFlow is a modern, premium full-stack (MERN) Kanban board application built using React 18, Express, MongoDB (with Mongoose), and Socket.io. It features smooth drag-and-drop mechanics using `dnd-kit`, instant multi-user synchronization, user presence indicators, and dual local/JWT authentication strategies with secure HttpOnly cookies.

---

## 🚀 Key Features

*   **Real-time Collaboration**: Instant synchronization of board states, columns, and tasks across active clients via Socket.io rooms.
*   **User Presence Tracking**: Displays live avatars of all users viewing the current board.
*   **Fluid Drag and Drop**: Rearrange columns and drag cards across columns with smooth optimistic UI transitions using `@dnd-kit`.
*   **Secure Authentication**: Passwords hashed with `bcryptjs`, and sessions protected using Passport.js Local and JWT strategies via signed `HttpOnly` cookies.
*   **Zero-Config Development Database**: Automatically falls back to an in-memory MongoDB server using `mongodb-memory-server` if no local database connection URI is specified.
*   **Elegant Styling**: Clean glassmorphism styling, responsive layouts, and class-based dark mode toggle.

---

## 🛠️ Tech Stack

*   **Frontend**: React 18 (Vite), Tailwind CSS v3, Zustand, Lucide React, Socket.io-client.
*   **Backend**: Node.js, Express.js, MongoDB (Mongoose ODM), Socket.io, Passport.js.
*   **Testing**: Jest, Supertest, MongoDB Memory Server.

---

## 📂 Project Structure

```text
TaskFlow/
├── backend/                  # Node/Express API & Sockets
│   ├── src/
│   │   ├── config/           # Database (db.js) & Passport strategies (passport.js)
│   │   ├── controllers/      # Route controller handlers
│   │   ├── middleware/       # Route protection middleware
│   │   ├── models/           # Mongoose Schemas (User, Board, Column, Task)
│   │   ├── routes/           # Express Routers
│   │   ├── socket/           # Socket.io connection & presence handlers
│   │   └── server.js         # Entry point
│   ├── tests/                # Integration tests (auth, boards, columns, tasks)
│   └── package.json
├── frontend/                 # Vite/React Client
│   ├── src/
│   │   ├── components/       # UI (Auth, Board, Layout, Common)
│   │   ├── context/          # Sockets context and hooks
│   │   ├── store/            # Zustand state stores (Auth, Boards)
│   │   ├── App.jsx           # Routing & layout setup
│   │   ├── index.css         # Tailwind & custom styles
│   │   └── main.jsx          # Mount point
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
├── package.json              # Monorepo workspaces configuration
└── README.md
```

---

## ⚙️ Setup and Installation

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed.

### 2. Install Dependencies
Run the following command at the root directory of the project to install both backend and frontend dependencies:
```bash
npm install
```

---

## 💻 Running the Application

### Option A: Development Mode (Recommended)
You do not need a running MongoDB service. The backend will automatically initialize an in-memory MongoDB instance.

1.  **Start Backend API & Socket Server**:
    ```bash
    npm run dev:backend
    ```
    The server will start listening on port `5000` (and print the address of the in-memory database).

2.  **Start Frontend Dev Server**:
    ```bash
    npm run dev:frontend
    ```
    The Vite client will launch on `http://localhost:5173`.

### Option B: Production Environment
Configure a local or cloud MongoDB database:

1.  Create a `.env` file inside the `backend/` directory:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/taskflow
    JWT_SECRET=your_production_secret_key_here
    CLIENT_URL=http://localhost:5173
    ```

2.  Run the application workspaces:
    - Backend: `npm start --workspace=backend`
    - Frontend build: `npm run build --workspace=frontend`

---

## 🧪 Running Automated Tests

TaskFlow includes integration tests using **Jest** and **Supertest** for testing authentication and database CRUD endpoints.

To run the backend tests:
```bash
npm run test:backend
```
*Note: The tests automatically spin up an isolated, temporary database in-memory, ensuring no side effects on any local database.*
