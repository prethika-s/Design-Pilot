import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    ideaText: {
      type: String,
      required: [true, 'Idea text is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'complete'],
      default: 'draft',
    },
    discoveryQuestions: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
