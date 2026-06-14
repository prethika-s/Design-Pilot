import { OpenAI } from 'openai';
import logger from '../config/logger.js';
import {
  discoveryPrompt,
  requirementsPrompt,
  architecturePrompt,
  tradeoffPrompt,
} from '../prompts/templates.js';

let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const callOpenAI = async (prompt) => {
  if (!openaiClient) {
    throw new Error('OpenAI client not configured');
  }
  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });
  return JSON.parse(response.choices[0].message.content);
};

const callClaudeFallback = async (prompt) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Claude fallback client not configured');
  }

  // Simple native fetch to Claude's API to avoid extra dependency issues
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const textContent = data.content[0].text;
  return JSON.parse(textContent);
};

// --- Context-Aware Mock Generator ---
const generateMockDiscovery = (idea) => {
  const isJobPortal = idea.toLowerCase().includes('job') || idea.toLowerCase().includes('career');
  const isEcommerce = idea.toLowerCase().includes('shop') || idea.toLowerCase().includes('store') || idea.toLowerCase().includes('commerce');

  if (isJobPortal) {
    return {
      questions: [
        'Should the portal support direct resume parsing and profile importing?',
        'Do we need real-time chat notifications between employers and job seekers?',
        'Are there payment and subscription packages for posting premium jobs?',
        'Should we integrate third-party job boards (e.g., LinkedIn, Indeed)?',
        'How critical is advanced semantic search/filtering (e.g., search by skills, location)?'
      ]
    };
  }

  if (isEcommerce) {
    return {
      questions: [
        'Will the site support multi-vendor listings or a single warehouse inventory?',
        'Is real-time inventory tracking and synchronization required?',
        'Which payment gateways (e.g., Stripe, PayPal) need to be supported?',
        'Do we need custom recommendation algorithms based on user behavior?',
        'Should we support a loyalty points or discount coupon system?'
      ]
    };
  }

  return {
    questions: [
      `What are the primary target user personas for "${idea}"?`,
      'Do we require third-party identity providers for authentication (OAuth)?',
      'What are the key compliance or data privacy requirements (e.g., GDPR)?',
      'Should there be real-time data sync, dashboarding, or notification utilities?',
      'Are there specific mobile app plans, or is a responsive web app sufficient?'
    ]
  };
};

const generateMockRequirements = (idea, qas) => {
  const reqs = [];
  qas.forEach((qa, idx) => {
    const isYes = qa.answer.toLowerCase().includes('yes') || qa.answer.toLowerCase().includes('should');
    reqs.push({
      title: `Feature based on Q${idx + 1}`,
      description: `Implementation details for question: "${qa.question}" with answer: "${qa.answer}"`,
      priority: isYes ? 'Must Have' : 'Should Have',
    });
  });

  // Base general requirements
  reqs.push({
    title: 'User Management & Security',
    description: 'Secure registration, login, and token-based API authentication.',
    priority: 'Must Have',
  });
  reqs.push({
    title: 'Responsive Dashboard UI',
    description: 'An interactive user dashboard displaying project metadata and items.',
    priority: 'Must Have',
  });
  reqs.push({
    title: 'Data Archival & Retention',
    description: 'Automated periodic DB snapshots and user records cleanup tools.',
    priority: 'Nice To Have',
  });

  return { requirements: reqs };
};

const generateMockArchitecture = (idea) => {
  return {
    options: [
      {
        type: 'MERN Monolith',
        rationale: 'Perfect for small-to-medium teams starting with a single codebase. A single Node.js app serves APIs and coordinates MongoDB connections directly.',
        pros: ['Very fast initial development', 'Single source of truth', 'Simple hosting configurations'],
        cons: ['Tight coupling makes scaling individual modules difficult', 'Build times grow over time'],
        teamFit: 'Excellent fit for small teams with React/Node.js experience who need to deploy fast.',
        scalability: 'Moderate. Scalable vertically or by running multiple node processes behind a load balancer.',
        recommended: true,
      },
      {
        type: 'Microservices',
        rationale: 'Decoupled services using an API Gateway, with separate services for Auth, Projects, and AI processing.',
        pros: ['High modularity', 'Independent scaling and deployment', 'Fault isolation'],
        cons: ['High operational overhead', 'Complex transaction boundaries', 'Complicated local setup'],
        teamFit: 'Suited for larger engineering organizations with dedicated DevOps capabilities.',
        scalability: 'Excellent. Scale bottle-necked services (e.g., AI integration) independently.',
        recommended: false,
      },
      {
        type: 'Serverless',
        rationale: 'Fully serverless deployment on AWS Lambda or Vercel, querying a hosted MongoDB database.',
        pros: ['Scale to zero cost structure', 'No infrastructure management', 'Automatic provisioning'],
        cons: ['Cold starts', 'Vendor lock-in', 'Difficult local testing'],
        teamFit: 'Suited for teams that want low maintenance and have experience with serverless frameworks.',
        scalability: 'Very high. Scales automatically with traffic bursts.',
        recommended: false,
      },
    ],
  };
};

const generateMockTradeoffs = (idea) => {
  return {
    comparison: [
      {
        technology: 'MongoDB vs PostgreSQL',
        costScore: 4,
        scalabilityScore: 5,
        complexityScore: 3,
        performanceScore: 4,
        recommendation: 'MongoDB',
        reasoning: 'MongoDB supports flexible schemas, perfect for storing varied architectural recommendations, decisions, and requirement shapes without rigid migrations.',
      },
      {
        technology: 'REST vs GraphQL',
        costScore: 5,
        scalabilityScore: 4,
        complexityScore: 2,
        performanceScore: 4,
        recommendation: 'REST',
        reasoning: 'REST is simpler and faster to build for standard CRUD operations on projects and decisions. We do not have deep nested relationships that warrant GraphQL overhead.',
      },
      {
        technology: 'AWS vs Vercel',
        costScore: 3,
        scalabilityScore: 5,
        complexityScore: 4,
        performanceScore: 5,
        recommendation: 'Vercel',
        reasoning: 'Vercel offers an unparalleled developer experience and seamless React integration for the frontend app, and can run our serverless functions easily.',
      },
    ],
  };
};

// --- Primary Service Wrapper ---
export const runAIService = async (promptType, idea, additionalData = null) => {
  let prompt = '';
  if (promptType === 'discovery') {
    prompt = discoveryPrompt(idea);
  } else if (promptType === 'requirements') {
    prompt = requirementsPrompt(idea, additionalData);
  } else if (promptType === 'architecture') {
    prompt = architecturePrompt(idea, additionalData);
  } else if (promptType === 'tradeoff') {
    prompt = tradeoffPrompt(idea, additionalData);
  }

  try {
    if (process.env.OPENAI_API_KEY) {
      logger.info(`Sending prompt to OpenAI for type: ${promptType}`);
      return await callOpenAI(prompt);
    }
  } catch (error) {
    logger.warn(`OpenAI call failed for ${promptType}: ${error.message}. Trying Claude fallback...`);
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        return await callClaudeFallback(prompt);
      }
    } catch (fallbackError) {
      logger.error(`Claude fallback failed: ${fallbackError.message}`);
    }
  }

  logger.info(`Using mock fallback generator for type: ${promptType}`);
  if (promptType === 'discovery') {
    return generateMockDiscovery(idea);
  } else if (promptType === 'requirements') {
    return generateMockRequirements(idea, additionalData);
  } else if (promptType === 'architecture') {
    return generateMockArchitecture(idea);
  } else if (promptType === 'tradeoff') {
    return generateMockTradeoffs(idea);
  }

  throw new Error(`Unknown prompt type: ${promptType}`);
};
