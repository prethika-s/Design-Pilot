import DecisionLog from '../models/DecisionLog.js';
import Tradeoff from '../models/Tradeoff.js';
import Project from '../models/Project.js';

// Helper to auto-resolve rationale from tradeoffs if missing or generic
const autoPopulateRationale = async (projectId, decisionText, userRationale) => {
  if (userRationale && userRationale.trim().length > 10) {
    return userRationale; // already has a valid rationale
  }

  try {
    const tradeoff = await Tradeoff.findOne({ projectId });
    if (!tradeoff || !tradeoff.comparisons) {
      return userRationale || 'Decision logged based on architecture reviews.';
    }

    const decisionLower = decisionText.toLowerCase();

    // Look for keywords in the decision to match comparisons
    let matchedReasoning = '';
    for (const comp of tradeoff.comparisons) {
      const techLower = comp.technology.toLowerCase();
      // check if any of the compared techs or the title matches the decision text
      const techParts = techLower.split(' vs ');
      const matchesTech = techParts.some(part => decisionLower.includes(part.trim()));
      
      if (matchesTech || decisionLower.includes(techLower)) {
        matchedReasoning += `[Tradeoff: ${comp.technology}] Recommendation: ${comp.recommendation}. Reasoning: ${comp.reasoning}\n`;
      }
    }

    if (matchedReasoning) {
      return `${userRationale ? userRationale + '\n\n' : ''}Auto-populated from Tradeoff Analysis:\n${matchedReasoning.trim()}`;
    }
  } catch (error) {
    // fallback to user rationale
  }

  return userRationale || 'Decision logged based on architecture reviews.';
};

export const createDecision = async (req, res, next) => {
  const { projectId, decision, rationale, alternatives, decidedBy } = req.body;

  try {
    // Verify project ownership
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(403).json({ error: 'Access denied: Project not found or not owned by user' });
    }

    // Auto-populate rationale if missing or short
    const finalRationale = await autoPopulateRationale(projectId, decision, rationale);

    const decisionLog = await DecisionLog.create({
      projectId,
      decision,
      rationale: finalRationale,
      alternatives: alternatives || [],
      decidedBy,
    });

    res.status(201).json(decisionLog);
  } catch (error) {
    next(error);
  }
};

export const getDecisionsByProject = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    // Verify project ownership
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(403).json({ error: 'Access denied: Project not found or not owned by user' });
    }

    const decisions = await DecisionLog.find({ projectId }).sort({ createdAt: -1 });
    res.json(decisions);
  } catch (error) {
    next(error);
  }
};

export const updateDecision = async (req, res, next) => {
  const { id } = req.params;
  const { decision, rationale, alternatives, decidedBy } = req.body;

  try {
    const decisionLog = await DecisionLog.findById(id);
    if (!decisionLog) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    // Verify ownership via project
    const project = await Project.findOne({ _id: decisionLog.projectId, userId: req.user._id });
    if (!project) {
      return res.status(403).json({ error: 'Access denied: You do not own the project for this decision' });
    }

    if (decision !== undefined) decisionLog.decision = decision;
    if (rationale !== undefined) decisionLog.rationale = rationale;
    if (alternatives !== undefined) decisionLog.alternatives = alternatives;
    if (decidedBy !== undefined) decisionLog.decidedBy = decidedBy;
    
    decisionLog.editedAt = new Date();

    await decisionLog.save();
    res.json(decisionLog);
  } catch (error) {
    next(error);
  }
};

export const deleteDecision = async (req, res, next) => {
  const { id } = req.params;

  try {
    const decisionLog = await DecisionLog.findById(id);
    if (!decisionLog) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    // Verify ownership via project
    const project = await Project.findOne({ _id: decisionLog.projectId, userId: req.user._id });
    if (!project) {
      return res.status(403).json({ error: 'Access denied: You do not own the project for this decision' });
    }

    await DecisionLog.findByIdAndDelete(id);
    res.json({ message: 'Decision log deleted successfully' });
  } catch (error) {
    next(error);
  }
};
