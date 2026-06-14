import Project from '../models/Project.js';
import Requirement from '../models/Requirement.js';
import ArchitectureOption from '../models/ArchitectureOption.js';
import Tradeoff from '../models/Tradeoff.js';
import DecisionLog from '../models/DecisionLog.js';
import Report from '../models/Report.js';
import { runAIService } from '../services/ai.service.js';
import logger from '../config/logger.js';

// --- Dashboard Stats ---
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Total Projects owned by user
    const totalProjects = await Project.countDocuments({ userId });

    // Total Decisions stored across all projects owned by user
    const userProjects = await Project.find({ userId }).select('_id');
    const projectIds = userProjects.map((p) => p._id);

    const savedDecisions = await DecisionLog.countDocuments({ projectId: { $in: projectIds } });
    const generatedReports = await Report.countDocuments({ projectId: { $in: projectIds } });

    res.json({
      totalProjects,
      savedDecisions,
      generatedReports,
    });
  } catch (error) {
    next(error);
  }
};

// --- CRUD ---
export const createProject = async (req, res, next) => {
  const { title, ideaText } = req.body;
  try {
    const project = await Project.create({
      userId: req.user._id,
      title,
      ideaText,
      status: 'draft',
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  const { title, ideaText, status } = req.body;
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (title) project.title = title;
    if (ideaText) project.ideaText = ideaText;
    if (status) project.status = status;

    await project.save();
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Cascading delete related records
    await Requirement.deleteMany({ projectId: project._id });
    await ArchitectureOption.deleteMany({ projectId: project._id });
    await Tradeoff.deleteMany({ projectId: project._id });
    await DecisionLog.deleteMany({ projectId: project._id });
    await Report.deleteMany({ projectId: project._id });

    res.json({ message: 'Project and all associated data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- PHASE 4: REQUIREMENT DISCOVERY AGENT ---
export const runDiscovery = async (req, res, next) => {
  try {
    const { idea } = req.body;
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Call AI to generate 5-10 clarification questions
    const aiResult = await runAIService('discovery', idea);
    const questions = aiResult.questions || [];

    // Save idea and questions back to the project
    project.ideaText = idea;
    project.discoveryQuestions = questions;
    project.status = 'active';
    await project.save();

    res.json({ questions });
  } catch (error) {
    next(error);
  }
};

// --- PHASE 5: REQUIREMENT PROCESSOR ---
export const processRequirements = async (req, res, next) => {
  try {
    const { answers } = req.body; // Array of { question, answer }
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Call AI to generate structured requirements
    const aiResult = await runAIService('requirements', project.ideaText, answers);
    const structuredReqs = aiResult.requirements || [];

    // Clear existing requirements for this project
    await Requirement.deleteMany({ projectId: project._id });

    // Persist requirements: Create a Requirement document for each QA pair
    // and store the structured requirements list inside it.
    const createdRequirements = [];
    for (let i = 0; i < answers.length; i++) {
      const qa = answers[i];
      // Filter structured requirements to distribute them or just store the full set on the first one, or store on all.
      // Let's store the full structured requirements set on all or partition them.
      // To ensure easy lookup, we save a document for each answer, with its corresponding QA,
      // and associate the complete structured requirements list.
      const reqDoc = await Requirement.create({
        projectId: project._id,
        question: qa.question,
        answer: qa.answer,
        structuredReq: structuredReqs,
      });
      createdRequirements.push(reqDoc);
    }

    res.json({ requirements: structuredReqs });
  } catch (error) {
    next(error);
  }
};

// --- PHASE 6: ARCHITECTURE RECOMMENDATION ENGINE ---
export const generateArchitecture = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch requirements to feed into AI
    const requirementsList = await Requirement.find({ projectId: project._id });
    // Flatten structured requirements
    const allReqs = [];
    requirementsList.forEach((r) => {
      r.structuredReq.forEach((sr) => {
        if (!allReqs.some((existing) => existing.title === sr.title)) {
          allReqs.push(sr);
        }
      });
    });

    const aiResult = await runAIService('architecture', project.ideaText, allReqs);
    const options = aiResult.options || [];

    // Clear existing options
    await ArchitectureOption.deleteMany({ projectId: project._id });

    // Persist architectural options
    const createdOptions = [];
    for (const opt of options) {
      const optDoc = await ArchitectureOption.create({
        projectId: project._id,
        type: opt.type,
        rationale: opt.rationale,
        pros: opt.pros,
        cons: opt.cons,
        teamFit: opt.teamFit,
        scalability: opt.scalability,
        recommended: opt.recommended,
      });
      createdOptions.push(optDoc);
    }

    res.json(createdOptions);
  } catch (error) {
    next(error);
  }
};

// --- PHASE 7: TRADEOFF ANALYZER ---
export const analyzeTradeoffs = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch requirements
    const requirementsList = await Requirement.find({ projectId: project._id });
    const allReqs = [];
    requirementsList.forEach((r) => {
      r.structuredReq.forEach((sr) => {
        if (!allReqs.some((existing) => existing.title === sr.title)) {
          allReqs.push(sr);
        }
      });
    });

    const aiResult = await runAIService('tradeoff', project.ideaText, allReqs);
    const comparisons = aiResult.comparison || [];

    // Clear existing tradeoffs
    await Tradeoff.deleteMany({ projectId: project._id });

    // Persist tradeoff comparison
    const tradeoffDoc = await Tradeoff.create({
      projectId: project._id,
      comparisons,
    });

    res.json(tradeoffDoc);
  } catch (error) {
    next(error);
  }
};
