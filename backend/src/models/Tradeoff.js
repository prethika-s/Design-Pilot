import mongoose from 'mongoose';

const tradeoffSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    comparisons: [
      {
        technology: {
          type: String,
          required: true, // e.g. "MongoDB vs PostgreSQL", "REST vs GraphQL", "AWS vs Vercel"
        },
        costScore: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        scalabilityScore: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        complexityScore: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        performanceScore: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        recommendation: {
          type: String,
          required: true,
        },
        reasoning: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Tradeoff = mongoose.model('Tradeoff', tradeoffSchema);
export default Tradeoff;
