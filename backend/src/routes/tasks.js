import express from 'express';
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.put('/move', protect, moveTask);

router.route('/')
  .post(protect, createTask);

router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

export default router;
