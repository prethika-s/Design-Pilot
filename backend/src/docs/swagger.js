const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'ArchitectAI API',
    version: '1.0.0',
    description: 'API Documentation for ArchitectAI - AI-powered Product & Architecture Copilot',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['name', 'email', 'password'],
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Validation or database error' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current user profile',
        tags: ['Authentication'],
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Not authorized' },
        },
      },
    },
    '/api/projects': {
      post: {
        summary: 'Create a new project',
        tags: ['Projects'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  ideaText: { type: 'string' },
                },
                required: ['title', 'ideaText'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Project created successfully' },
        },
      },
      get: {
        summary: 'Get all user projects',
        tags: ['Projects'],
        responses: {
          200: { description: 'List of projects' },
        },
      },
    },
    '/api/projects/stats': {
      get: {
        summary: 'Get user dashboard statistics',
        tags: ['Projects'],
        responses: {
          200: { description: 'Dashboard stats' },
        },
      },
    },
    '/api/projects/{id}': {
      get: {
        summary: 'Get project by ID',
        tags: ['Projects'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Project details' },
        },
      },
      put: {
        summary: 'Update project details',
        tags: ['Projects'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  ideaText: { type: 'string' },
                  status: { type: 'string', enum: ['draft', 'active', 'complete'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Project updated' },
        },
      },
      delete: {
        summary: 'Delete project and related records',
        tags: ['Projects'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Project deleted' },
        },
      },
    },
    '/api/projects/{id}/discovery': {
      post: {
        summary: 'Generate clarification questions from idea',
        tags: ['AI Agents'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  idea: { type: 'string' },
                },
                required: ['idea'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Clarification questions list' },
        },
      },
    },
    '/api/projects/{id}/requirements': {
      post: {
        summary: 'Process answers to generate structured requirements',
        tags: ['AI Agents'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  answers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        answer: { type: 'string' },
                      },
                      required: ['question', 'answer'],
                    },
                  },
                },
                required: ['answers'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Requirements created' },
        },
      },
    },
    '/api/projects/{id}/architecture': {
      post: {
        summary: 'Generate MERN, Microservices, and Serverless options',
        tags: ['AI Agents'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Architecture recommendations' },
        },
      },
    },
    '/api/projects/{id}/tradeoff': {
      post: {
        summary: 'Analyze technology tradeoffs',
        tags: ['AI Agents'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Tradeoff comparisons' },
        },
      },
    },
    '/api/decisions': {
      post: {
        summary: 'Log a new architectural decision',
        tags: ['Decision Memory'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  projectId: { type: 'string' },
                  decision: { type: 'string' },
                  rationale: { type: 'string' },
                  alternatives: { type: 'array', items: { type: 'string' } },
                  decidedBy: { type: 'string' },
                },
                required: ['projectId', 'decision', 'decidedBy'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Decision logged' },
        },
      },
    },
    '/api/decisions/{projectId}': {
      get: {
        summary: 'Get decisions for a specific project',
        tags: ['Decision Memory'],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of decisions' },
        },
      },
    },
    '/api/decisions/{id}': {
      put: {
        summary: 'Update decision log',
        tags: ['Decision Memory'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  decision: { type: 'string' },
                  rationale: { type: 'string' },
                  alternatives: { type: 'array', items: { type: 'string' } },
                  decidedBy: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Decision updated' },
        },
      },
      delete: {
        summary: 'Delete decision log',
        tags: ['Decision Memory'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Decision deleted' },
        },
      },
    },
    '/api/projects/{id}/report': {
      post: {
        summary: 'Generate and save a PDF architectural report',
        tags: ['Reports'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          201: { description: 'Report created successfully' },
        },
      },
    },
    '/api/projects/{id}/reports': {
      get: {
        summary: 'Get generated reports metadata for a project',
        tags: ['Reports'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of reports metadata' },
        },
      },
    },
  },
};

export default swaggerDocument;
