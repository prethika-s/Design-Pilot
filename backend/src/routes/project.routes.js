import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  runDiscovery,
  processRequirements,
  generateArchitecture,
  analyzeTradeoffs,
  getDashboardStats,
} from '../controllers/project.controller.js';
import { generateReport, getReportsByProject } from '../controllers/report.controller.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  discoverySchema,
  requirementsSchema,
} from '../validators/project.validator.js';

const router = express.Router();

// Dashboard Stats (needs to be placed before /:id)
router.get('/stats', protect, getDashboardStats);

// Project CRUD
router.post('/', protect, validate(createProjectSchema), createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.put('/:id', protect, validate(updateProjectSchema), updateProject);
router.delete('/:id', protect, deleteProject);

// AI Agents
router.post('/:id/discovery', protect, validate(discoverySchema), runDiscovery);
router.post('/:id/requirements', protect, validate(requirementsSchema), processRequirements);
router.post('/:id/architecture', protect, generateArchitecture);
router.post('/:id/tradeoff', protect, analyzeTradeoffs);

// Reports
router.post('/:id/report', protect, generateReport);
router.get('/:id/reports', protect, getReportsByProject);

export default router;
