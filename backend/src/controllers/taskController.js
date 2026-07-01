import Task from '../models/Task.js';
import Column from '../models/Column.js';
import Board from '../models/Board.js';

// @desc    Create a new task in a column
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  const { title, description, labels, boardId, columnId } = req.body;

  try {
    if (!title || !boardId || !columnId) {
      return res.status(400).json({ message: 'Title, boardId, and columnId are required' });
    }

    const column = await Column.findById(columnId);
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    const task = new Task({
      title,
      description: description || '',
      labels: labels || [],
      boardId,
      columnId,
      assignees: [],
    });

    await task.save();

    // Link task back to column
    column.tasks.push(task._id);
    await column.save();

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task (title, description, labels, assignees)
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  const { title, description, labels, assignees } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.labels = labels !== undefined ? labels : task.labels;
    task.assignees = assignees !== undefined ? assignees : task.assignees;

    await task.save();

    // Populate assignees for the frontend UI to display user names/emails
    const populatedTask = await Task.findById(task._id).populate('assignees', 'name email');

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task and remove it from its Column
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const column = await Column.findById(task.columnId);
    if (column) {
      column.tasks = column.tasks.filter((tId) => tId.toString() !== task._id.toString());
      await column.save();
    }

    await Task.findByIdAndDelete(task._id);

    res.json({ message: 'Task deleted successfully', taskId: task._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Move a task within the same column or to another column
// @route   PUT /api/tasks/move
// @access  Private
export const moveTask = async (req, res) => {
  const { taskId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex } = req.body;

  try {
    if (!taskId || !sourceColumnId || !destinationColumnId) {
      return res.status(400).json({ message: 'taskId, sourceColumnId, and destinationColumnId are required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Scenario A: Move within same column
    if (sourceColumnId === destinationColumnId) {
      const column = await Column.findById(sourceColumnId);
      if (!column) {
        return res.status(404).json({ message: 'Column not found' });
      }

      // Filter out the taskId and insert it at the new destinationIndex
      column.tasks = column.tasks.filter((id) => id.toString() !== taskId);
      column.tasks.splice(destinationIndex, 0, taskId);
      await column.save();

      return res.json({ message: 'Task moved within column successfully' });
    }

    // Scenario B: Move between columns
    const sourceCol = await Column.findById(sourceColumnId);
    const destCol = await Column.findById(destinationColumnId);

    if (!sourceCol || !destCol) {
      return res.status(404).json({ message: 'Source or destination column not found' });
    }

    // Update Task's column pointer
    task.columnId = destinationColumnId;
    await task.save();

    // Pull from source
    sourceCol.tasks = sourceCol.tasks.filter((id) => id.toString() !== taskId);
    await sourceCol.save();

    // Splice into destination
    destCol.tasks.splice(destinationIndex, 0, taskId);
    await destCol.save();

    res.json({ message: 'Task moved across columns successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
