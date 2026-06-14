import mongoose from 'mongoose';

const decisionLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    decision: {
      type: String,
      required: true,
    },
    rationale: {
      type: String,
      required: true,
    },
    alternatives: [
      {
        type: String,
      },
    ],
    decidedBy: {
      type: String,
      required: true,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const DecisionLog = mongoose.model('DecisionLog', decisionLogSchema);
export default DecisionLog;
