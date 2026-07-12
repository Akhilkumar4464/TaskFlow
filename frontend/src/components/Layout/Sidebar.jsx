import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useBoardStore from '../../store/useBoardStore';
import useAuthStore from '../../store/useAuthStore';
import { Plus, LogOut, FolderKanban, X, Check } from 'lucide-react';

export const Sidebar = () => {
  const { boards, fetchBoards, createBoard } = useBoardStore();
  const { user, logoutUser } = useAuthStore();
  const { boardId } = useParams();
  const navigate = useNavigate();
  
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    
    const board = await createBoard(newBoardTitle.trim());
    if (board) {
      setNewBoardTitle('');
      setIsCreating(false);
      navigate(`/boards/${board._id}`);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col h-full">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800/80">
        <FolderKanban className="text-indigo-600 dark:text-indigo-400 mr-2.5 h-6 w-6" />
        <span className="font-extrabold text-xl text-slate-850 dark:text-slate-100 tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
          TaskFlow
        </span>
      </div>

      {/* Board Listing Section */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex items-center justify-between mb-4 px-2">
          <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            My Boards
          </h4>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-650 transition-all duration-150"
            title="Create Board"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Board Creation Inline Form */}
        {isCreating && (
          <form onSubmit={handleCreateBoard} className="mb-4 p-2 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <input
              type="text"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Board Title..."
              autoFocus
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewBoardTitle('');
                }}
                className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="submit"
                className="p-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1">
          {boards.map((board) => {
            const isActive = board._id === boardId;
            return (
              <button
                key={board._id}
                onClick={() => navigate(`/boards/${board._id}`)}
                className={`w-full flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-650 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-850/80 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <FolderKanban className={`h-4.5 w-4.5 mr-2.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{board.title}</span>
              </button>
            );
          })}

          {boards.length === 0 && !isCreating && (
            <p className="text-xxs text-slate-450 dark:text-slate-500 text-center py-4">
              No boards yet. Click '+' to start.
            </p>
          )}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center min-w-0 mr-2">
          <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-tr from-indigo-650 to-indigo-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-2.5 min-w-0">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logoutUser}
          className="p-1.5 text-slate-450 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
