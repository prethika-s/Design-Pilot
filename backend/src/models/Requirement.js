import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    structuredReq: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        priority: {
          type: String,
          enum: ['Must Have', 'Should Have', 'Nice To Have', 'Out Of Scope'],
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Requirement = mongoose.model('Requirement', requirementSchema);
export default Requirement;
