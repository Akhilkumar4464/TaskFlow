import mongoose from 'mongoose';

const ColumnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a column title'],
      trim: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Column', ColumnSchema);
