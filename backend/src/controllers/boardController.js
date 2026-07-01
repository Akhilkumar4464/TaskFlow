import Board from '../models/Board.js';
import Column from '../models/Column.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

// @desc    Get all boards for current user (owned or member of)
// @route   GET /api/boards
// @access  Private
export const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name email')
      .populate('members', 'name email');
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single board by ID (deeply populated with columns and tasks)
// @route   GET /api/boards/:id
// @access  Private
export const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate({
        path: 'columns',
        populate: {
          path: 'tasks',
          model: 'Task',
        },
      });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Access check: User must be owner or member
    const isOwner = board.owner._id.toString() === req.user._id.toString();
    const isMember = board.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new board (with default columns: To Do, In Progress, Done)
// @route   POST /api/boards
// @access  Private
export const createBoard = async (req, res) => {
  const { title } = req.body;

  try {
    if (!title) {
      return res.status(400).json({ message: 'Board title is required' });
    }

    // Create the board
    const board = new Board({
      title,
      owner: req.user._id,
      members: [],
    });

    await board.save();

    // Create default columns: To Do, In Progress, Done
    const defaultColumnTitles = ['To Do', 'In Progress', 'Done'];
    const columnIds = [];

    for (const colTitle of defaultColumnTitles) {
      const column = new Column({
        title: colTitle,
        boardId: board._id,
        tasks: [],
      });
      await column.save();
      columnIds.push(column._id);
    }

    // Link default columns back to board
    board.columns = columnIds;
    await board.save();

    // Fetch and send the fully populated board
    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate({
        path: 'columns',
        populate: {
          path: 'tasks',
        },
      });

    res.status(201).json(populatedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update board details (e.g. title)
// @route   PUT /api/boards/:id
// @access  Private
export const updateBoard = async (req, res) => {
  const { title } = req.body;

  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only owner can update the board info
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the board owner can update it' });
    }

    board.title = title || board.title;
    await board.save();

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate({
        path: 'columns',
        populate: {
          path: 'tasks',
        },
      });

    res.json(populatedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a board (and its associated columns and tasks)
// @route   DELETE /api/boards/:id
// @access  Private
export const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Only owner can delete the board
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the board owner can delete it' });
    }

    // Delete all associated tasks
    await Task.deleteMany({ boardId: board._id });

    // Delete all associated columns
    await Column.deleteMany({ boardId: board._id });

    // Delete board itself
    await Board.findByIdAndDelete(board._id);

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a board via shareable link ID
// @route   POST /api/boards/:id/join
// @access  Private
export const joinBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Owner is already inside the board
    if (board.owner.toString() === req.user._id.toString()) {
      return res.json({ message: 'You are the owner of this board', board });
    }

    // Check if user is already a member
    const isMember = board.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      board.members.push(req.user._id);
      await board.save();
    }

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate({
        path: 'columns',
        populate: {
          path: 'tasks',
        },
      });

    res.json(populatedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a user directly to board by email
// @route   POST /api/boards/:id/members
// @access  Private
export const addMember = async (req, res) => {
  const { email } = req.body;
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can invite members' });
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    if (userToInvite._id.toString() === board.owner.toString()) {
      return res.status(400).json({ message: 'User is the owner of this board' });
    }

    const isAlreadyMember = board.members.some(
      (mId) => mId.toString() === userToInvite._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    board.members.push(userToInvite._id);
    await board.save();

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate({
        path: 'columns',
        populate: {
          path: 'tasks',
        },
      });

    res.json(populatedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
