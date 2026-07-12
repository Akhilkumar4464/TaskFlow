import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import useBoardStore from './store/useBoardStore';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import KanbanBoard from './components/Board/KanbanBoard';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Wraps board views, triggering data fetching whenever route params update
const BoardLoader = () => {
  const { boardId } = useParams();
  const { fetchBoardById } = useBoardStore();

  useEffect(() => {
    if (boardId) {
      fetchBoardById(boardId);
    }
  }, [boardId, fetchBoardById]);

  return <KanbanBoard />;
};

// Protects internal workspace routes from unauthorized visitors
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Handles joining boards when clicking shared link URLs
const BoardJoinHandler = () => {
  const { boardId } = useParams();
  const { joinBoard } = useBoardStore();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    const triggerJoin = async () => {
      if (isAuthenticated && boardId) {
        const board = await joinBoard(boardId);
        if (board) {
          navigate(`/boards/${boardId}`);
        } else {
          navigate('/');
        }
      }
    };
    if (!loading) {
      triggerJoin();
    }
  }, [isAuthenticated, loading, boardId, joinBoard, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-955 text-slate-500 gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650" />
      <span className="text-xs font-semibold tracking-wide">Syncing board workspace...</span>
    </div>
  );
};

export const App = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Share/Invite auto-join redirect handler */}
        <Route
          path="/boards/:boardId/join"
          element={
            <PrivateRoute>
              <BoardJoinHandler />
            </PrivateRoute>
          }
        />

        {/* Core application routes */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <SocketProvider>
                <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
                  <Sidebar />
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Header />
                    <Routes>
                      <Route path="/" element={<KanbanBoard />} />
                      <Route path="/boards/:boardId" element={<BoardLoader />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </div>
                </div>
              </SocketProvider>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
