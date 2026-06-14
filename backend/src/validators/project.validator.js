import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Project title is required'),
    ideaText: z.string().min(1, 'Project idea is required'),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    ideaText: z.string().optional(),
    status: z.enum(['draft', 'active', 'complete']).optional(),
  }),
});

export const discoverySchema = z.object({
  body: z.object({
    idea: z.string().min(1, 'Idea text is required'),
  }),
});

export const requirementsSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ).min(1, 'At least one answer is required'),
  }),
});

export const decisionSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    decision: z.string().min(1, 'Decision is required'),
    rationale: z.string().optional(),
    alternatives: z.array(z.string()).optional(),
    decidedBy: z.string().min(1, 'Decided by name is required'),
  }),
});

export const updateDecisionSchema = z.object({
  body: z.object({
    decision: z.string().optional(),
    rationale: z.string().optional(),
    alternatives: z.array(z.string()).optional(),
    decidedBy: z.string().optional(),
  }),
});
