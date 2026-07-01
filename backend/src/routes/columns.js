import express from 'express';
import {
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from '../controllers/columnController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/reorder', protect, reorderColumns);

router.route('/')
  .post(protect, createColumn);

router.route('/:id')
  .put(protect, updateColumn)
  .delete(protect, deleteColumn);

export default router;
