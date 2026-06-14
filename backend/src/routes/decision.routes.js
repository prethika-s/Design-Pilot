import express from 'express';
import {
  createDecision,
  getDecisionsByProject,
  updateDecision,
  deleteDecision,
} from '../controllers/decision.controller.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { decisionSchema, updateDecisionSchema } from '../validators/project.validator.js';

const router = express.Router();

router.post('/', protect, validate(decisionSchema), createDecision);
router.get('/:projectId', protect, getDecisionsByProject);
router.put('/:id', protect, validate(updateDecisionSchema), updateDecision);
router.delete('/:id', protect, deleteDecision);

export default router;
