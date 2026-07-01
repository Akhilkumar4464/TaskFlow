const activeUsers = {}; // Maps socket.id -> { userId, name, email, boardId }

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins a board
    socket.on('board:join', ({ boardId, user }) => {
      if (!boardId || !user) return;

      // Join the socket room specific to the board
      socket.join(boardId);

      // Track presence
      activeUsers[socket.id] = {
        socketId: socket.id,
        userId: user._id,
        name: user.name,
        email: user.email,
        boardId,
      };

      console.log(`User ${user.name} joined board room: ${boardId}`);

      // Broadcast updated presence list
      sendPresenceUpdate(io, boardId);
    });

    // User updates something on the board (reordering, cards, CRUD)
    // Send action + data to all other clients in the room
    socket.on('board:update', ({ boardId, action, data }) => {
      if (!boardId) return;
      socket.to(boardId).emit('board:updated', { action, data });
    });

    // User leaves a board (e.g. changing view, clicking away)
    socket.on('board:leave', ({ boardId }) => {
      if (!boardId) return;
      socket.leave(boardId);
      if (activeUsers[socket.id]) {
        delete activeUsers[socket.id];
      }
      sendPresenceUpdate(io, boardId);
    });

    // Handle socket disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const userData = activeUsers[socket.id];
      if (userData) {
        const { boardId } = userData;
        delete activeUsers[socket.id];
        sendPresenceUpdate(io, boardId);
      }
    });
  });
};

// Helper to compile active users on a board, deduplicating multiple tabs by user ID
const sendPresenceUpdate = (io, boardId) => {
  const usersOnBoard = Object.values(activeUsers).filter(
    (u) => u.boardId === boardId
  );

  const uniqueUsers = [];
  const seenUserIds = new Set();

  for (const user of usersOnBoard) {
    if (!seenUserIds.has(user.userId)) {
      seenUserIds.add(user.userId);
      uniqueUsers.push({
        userId: user.userId,
        name: user.name,
        email: user.email,
      });
    }
  }

  io.to(boardId).emit('user:presence', uniqueUsers);
};
export default socketHandler;
