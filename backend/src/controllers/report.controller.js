import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Project from '../models/Project.js';
import Requirement from '../models/Requirement.js';
import ArchitectureOption from '../models/ArchitectureOption.js';
import Tradeoff from '../models/Tradeoff.js';
import DecisionLog from '../models/DecisionLog.js';
import Report from '../models/Report.js';
import { generatePDFReport } from '../services/pdf.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateReport = async (req, res, next) => {
  const projectId = req.params.id;

  try {
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch all information related to project
    const requirements = await Requirement.find({ projectId });
    const architectures = await ArchitectureOption.find({ projectId });
    const tradeoffs = await Tradeoff.find({ projectId });
    const decisions = await DecisionLog.find({ projectId });

    // Generate executive summary text or default summary
    const summary = `Architecture report for the project "${project.title}". Contains ${requirements.length} requirements, ${architectures.length} architecture options, ${tradeoffs.length ? tradeoffs[0].comparisons.length : 0} technology tradeoffs, and ${decisions.length} decision records.`;

    // Generate PDF bytes using service
    const pdfBytes = await generatePDFReport({
      project,
      requirements,
      architectures,
      tradeoffs,
      decisions,
    });

    // Ensure directory exists
    const reportsDir = path.join(__dirname, '..', '..', 'public', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `report_${project._id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // Save PDF file to disk
    fs.writeFileSync(filePath, pdfBytes);

    const pdfUrl = `/reports/${fileName}`;

    // Store report metadata
    const report = await Report.create({
      projectId: project._id,
      summary,
      pdfUrl,
    });

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

export const getReportsByProject = async (req, res, next) => {
  const projectId = req.params.projectId;

  try {
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(403).json({ error: 'Access denied: Project not found or not owned by user' });
    }

    const reports = await Report.find({ projectId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};
