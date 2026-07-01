import Column from '../models/Column.js';
import Board from '../models/Board.js';
import Task from '../models/Task.js';

// @desc    Create a new column in a board
// @route   POST /api/columns
// @access  Private
export const createColumn = async (req, res) => {
  const { title, boardId } = req.body;

  try {
    if (!title || !boardId) {
      return res.status(400).json({ message: 'Title and boardId are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Access check
    const isOwner = board.owner.toString() === req.user._id.toString();
    const isMember = board.members.some((mId) => mId.toString() === req.user._id.toString());
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const column = new Column({
      title,
      boardId,
      tasks: [],
    });

    await column.save();

    // Link column back to board
    board.columns.push(column._id);
    await board.save();

    res.status(201).json(column);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update column title
// @route   PUT /api/columns/:id
// @access  Private
export const updateColumn = async (req, res) => {
  const { title } = req.body;

  try {
    const column = await Column.findById(req.params.id);
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const board = await Board.findById(column.boardId);
    // Access check
    const isOwner = board.owner.toString() === req.user._id.toString();
    const isMember = board.members.some((mId) => mId.toString() === req.user._id.toString());
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    column.title = title || column.title;
    await column.save();

    res.json(column);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a column, all its tasks, and pull its ID from the parent Board
// @route   DELETE /api/columns/:id
// @access  Private
export const deleteColumn = async (req, res) => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const board = await Board.findById(column.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Associated board not found' });
    }

    // Access check
    const isOwner = board.owner.toString() === req.user._id.toString();
    const isMember = board.members.some((mId) => mId.toString() === req.user._id.toString());
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete tasks inside column
    await Task.deleteMany({ columnId: column._id });

    // Pull column ref from Board
    board.columns = board.columns.filter((cId) => cId.toString() !== column._id.toString());
    await board.save();

    // Delete the column itself
    await Column.findByIdAndDelete(column._id);

    res.json({ message: 'Column deleted successfully', columnId: column._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reorder columns in a board
// @route   PUT /api/columns/reorder
// @access  Private
export const reorderColumns = async (req, res) => {
  const { boardId, columnIds } = req.body;

  try {
    if (!boardId || !columnIds) {
      return res.status(400).json({ message: 'boardId and columnIds array are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Access check
    const isOwner = board.owner.toString() === req.user._id.toString();
    const isMember = board.members.some((mId) => mId.toString() === req.user._id.toString());
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update board columns array
    board.columns = columnIds;
    await board.save();

    res.json({ message: 'Columns reordered successfully', columns: board.columns });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
