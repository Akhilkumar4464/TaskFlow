import mongoose from 'mongoose';

const BoardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a board title'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    columns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Column',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Board', BoardSchema);
