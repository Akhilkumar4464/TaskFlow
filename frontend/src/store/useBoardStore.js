import { create } from 'zustand';
import axios from 'axios';

export const useBoardStore = create((set, get) => ({
  boards: [],
  activeBoard: null,
  loading: false,
  error: null,

  // Fetch list of boards
  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get('/api/boards');
      set({ boards: res.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch boards', loading: false });
    }
  },

  // Fetch detailed single board
  fetchBoardById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get(`/api/boards/${id}`);
      set({ activeBoard: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch board details', loading: false });
      return null;
    }
  },

  // Create a board
  createBoard: async (title) => {
    try {
      const res = await axios.post('/api/boards', { title });
      set((state) => ({ boards: [...state.boards, res.data] }));
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to create board' });
      return null;
    }
  },

  // Update board title
  updateBoardTitle: async (id, title) => {
    try {
      const res = await axios.put(`/api/boards/${id}`, { title });
      set((state) => ({
        boards: state.boards.map((b) => (b._id === id ? res.data : b)),
        activeBoard: state.activeBoard?._id === id ? res.data : state.activeBoard,
      }));
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update board title' });
    }
  },

  // Delete a board
  deleteBoard: async (id) => {
    try {
      await axios.delete(`/api/boards/${id}`);
      set((state) => ({
        boards: state.boards.filter((b) => b._id !== id),
        activeBoard: state.activeBoard?._id === id ? null : state.activeBoard,
      }));
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete board' });
    }
  },

  // Join board via link
  joinBoard: async (id) => {
    try {
      const res = await axios.post(`/api/boards/${id}/join`);
      set((state) => {
        const exists = state.boards.some((b) => b._id === id);
        return {
          boards: exists ? state.boards : [...state.boards, res.data],
          activeBoard: res.data,
        };
      });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to join board' });
      return null;
    }
  },

  // Invite member by email
  inviteMember: async (boardId, email) => {
    try {
      const res = await axios.post(`/api/boards/${boardId}/members`, { email });
      set({ activeBoard: res.data });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to invite member' };
    }
  },

  // Create a column
  createColumn: async (title, boardId) => {
    try {
      const res = await axios.post('/api/columns', { title, boardId });
      const activeBoard = get().activeBoard;
      if (activeBoard) {
        set({
          activeBoard: {
            ...activeBoard,
            columns: [...activeBoard.columns, { ...res.data, tasks: [] }],
          },
        });
      }
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to create column' });
      return null;
    }
  },

  // Update a column title
  updateColumnTitle: async (columnId, title) => {
    try {
      const res = await axios.put(`/api/columns/${columnId}`, { title });
      const activeBoard = get().activeBoard;
      if (activeBoard) {
        set({
          activeBoard: {
            ...activeBoard,
            columns: activeBoard.columns.map((c) =>
              c._id === columnId ? { ...c, title: res.data.title } : c
            ),
          },
        });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update column title' });
    }
  },

  // Delete a column
  deleteColumn: async (columnId) => {
    try {
      await axios.delete(`/api/columns/${columnId}`);
      const activeBoard = get().activeBoard;
      if (activeBoard) {
        set({
          activeBoard: {
            ...activeBoard,
            columns: activeBoard.columns.filter((c) => c._id !== columnId),
          },
        });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete column' });
    }
  },

  // Create a task
  createTask: async (title, description, labels, boardId, columnId) => {
    try {
      const res = await axios.post('/api/tasks', { title, description, labels, boardId, columnId });
      const activeBoard = get().activeBoard;
      if (activeBoard) {
        set({
          activeBoard: {
            ...activeBoard,
            columns: activeBoard.columns.map((col) =>
              col._id === columnId ? { ...col, tasks: [...col.tasks, res.data] } : col
            ),
          },
        });
      }
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to create task' });
      return null;
    }
  },

  // Update a task details
  updateTaskDetails: async (taskId, title, description, labels, assignees) => {
    try {
      const res = await axios.put(`/api/tasks/${taskId}`, { title, description, labels, assignees });
      const activeBoard = get().activeBoard;
      if (activeBoard) {
        set({
          activeBoard: {
            ...activeBoard,
            columns: activeBoard.columns.map((col) => ({
              ...col,
              tasks: col.tasks.map((task) => (task._id === taskId ? res.data : task)),
            })),
          },
        });
      }
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update task' });
      return null;
    }
  },

  // Delete a task
  deleteTask: async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      const activeBoard = get().activeBoard;
      if (activeBoard) {
        set({
          activeBoard: {
            ...activeBoard,
            columns: activeBoard.columns.map((col) => ({
              ...col,
              tasks: col.tasks.filter((t) => t._id !== taskId),
            })),
          },
        });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete task' });
    }
  },

  // Optimistic move local task for smooth drag and drop
  moveTaskLocal: async (taskId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex) => {
    const activeBoard = get().activeBoard;
    if (!activeBoard) return;

    // Clone structures
    const updatedColumns = activeBoard.columns.map((c) => ({
      ...c,
      tasks: [...c.tasks],
    }));

    const sourceCol = updatedColumns.find((c) => c._id === sourceColumnId);
    const destCol = updatedColumns.find((c) => c._id === destinationColumnId);

    if (!sourceCol || !destCol) return;

    const [movedTask] = sourceCol.tasks.splice(sourceIndex, 1);
    if (!movedTask) return;

    movedTask.columnId = destinationColumnId;
    destCol.tasks.splice(destinationIndex, 0, movedTask);

    // Apply optimistically
    set({
      activeBoard: {
        ...activeBoard,
        columns: updatedColumns,
      },
    });

    try {
      await axios.put('/api/tasks/move', {
        taskId,
        sourceColumnId,
        destinationColumnId,
        sourceIndex,
        destinationIndex,
      });
    } catch (err) {
      console.error('Database move update failed, reverting state...', err);
      // Revert from server source of truth
      get().fetchBoardById(activeBoard._id);
    }
  },

  // Optimistic reorder local columns
  reorderColumnsLocal: async (boardId, columnIds, sourceIndex, destinationIndex) => {
    const activeBoard = get().activeBoard;
    if (!activeBoard) return;

    const updatedColumns = [...activeBoard.columns];
    const [movedCol] = updatedColumns.splice(sourceIndex, 1);
    updatedColumns.splice(destinationIndex, 0, movedCol);

    set({
      activeBoard: {
        ...activeBoard,
        columns: updatedColumns,
      },
    });

    try {
      await axios.put('/api/columns/reorder', {
        boardId,
        columnIds,
      });
    } catch (err) {
      console.error('Column reordering failed, reverting state...', err);
      get().fetchBoardById(activeBoard._id);
    }
  },

  // Setter helper for socket.io live updates
  setActiveBoard: (board) => set({ activeBoard: board }),
}));

export default useBoardStore;
