import mongoose from 'mongoose';

const architectureOptionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['MERN Monolith', 'Microservices', 'Serverless'],
    },
    rationale: {
      type: String,
      required: true,
    },
    pros: [
      {
        type: String,
      },
    ],
    cons: [
      {
        type: String,
      },
    ],
    teamFit: {
      type: String,
      required: true,
    },
    scalability: {
      type: String,
      required: true,
    },
    recommended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ArchitectureOption = mongoose.model('ArchitectureOption', architectureOptionSchema);
export default ArchitectureOption;
