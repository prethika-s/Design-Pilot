import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Project from '../src/models/Project.js';
import Requirement from '../src/models/Requirement.js';
import ArchitectureOption from '../src/models/ArchitectureOption.js';
import Tradeoff from '../src/models/Tradeoff.js';
import DecisionLog from '../src/models/DecisionLog.js';
import Report from '../src/models/Report.js';

let authToken = '';
let projectId = '';
let decisionId = '';

beforeAll(async () => {
  // Database should already be connected via app import and server setup, 
  // but if not, wait for connection.
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/architectai_test');
  }
  // Clear the database
  await User.deleteMany({});
  await Project.deleteMany({});
  await Requirement.deleteMany({});
  await ArchitectureOption.deleteMany({});
  await Tradeoff.deleteMany({});
  await DecisionLog.deleteMany({});
  await Report.deleteMany({});
});

afterAll(async () => {
  // Cleanup
  await User.deleteMany({});
  await Project.deleteMany({});
  await Requirement.deleteMany({});
  await ArchitectureOption.deleteMany({});
  await Tradeoff.deleteMany({});
  await DecisionLog.deleteMany({});
  await Report.deleteMany({});
  await mongoose.connection.close();
});

describe('ArchitectAI API Integration Tests', () => {
  
  describe('Authentication Phase', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Staff Architect',
          email: 'architect@test.com',
          password: 'securePassword123',
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('architect@test.com');
      authToken = res.body.token;
    });

    it('should login the user and return a JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'architect@test.com',
          password: 'securePassword123',
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fetch user profile details via /me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Staff Architect');
    });
  });

  describe('Project CRUD Phase', () => {
    it('should create a project draft', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Cloud Job Portal',
          ideaText: 'I want to build a highly scalable job portal in the cloud',
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Cloud Job Portal');
      expect(res.body.status).toBe('draft');
      projectId = res.body._id;
    });

    it('should list user projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should fetch a single project by ID', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(projectId);
    });
  });

  describe('AI Interactive Pipeline', () => {
    it('should run discovery questions agent', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/discovery`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          idea: 'I want to build a career portal with real-time chats',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('questions');
      expect(res.body.questions.length).toBeGreaterThan(0);
    });

    it('should process answers into structured requirements', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/requirements`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [
            { question: 'Do we need real-time chat?', answer: 'Yes, between employers and candidates' },
            { question: 'Should we parsing resumes?', answer: 'Should support PDF imports' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('requirements');
      expect(res.body.requirements.length).toBeGreaterThan(0);
      expect(res.body.requirements[0]).toHaveProperty('priority');
    });

    it('should generate architecture options', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/architecture`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3); // Monolith, Microservices, Serverless
      expect(res.body[0]).toHaveProperty('rationale');
    });

    it('should analyze database and system tradeoffs', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/tradeoff`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('comparisons');
      expect(res.body.comparisons.length).toBe(3); // Postgres vs Mongo, REST vs GraphQL, AWS vs Vercel
    });
  });

  describe('Decision Memory Phase', () => {
    it('should log a new architectural decision (with tradeoff auto-populated rationale)', async () => {
      const res = await request(app)
        .post('/api/decisions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          decision: 'We will use MongoDB database for scalability',
          alternatives: ['PostgreSQL'],
          decidedBy: 'Staff Architect',
        });

      expect(res.status).toBe(201);
      expect(res.body.decision).toContain('MongoDB');
      expect(res.body.rationale).toContain('Auto-populated from Tradeoff Analysis');
      decisionId = res.body._id;
    });

    it('should get decisions for a project', async () => {
      const res = await request(app)
        .get(`/api/decisions/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should edit/update an architectural decision', async () => {
      const res = await request(app)
        .put(`/api/decisions/${decisionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          decision: 'We will use MongoDB database with secondary index configurations',
        });

      expect(res.status).toBe(200);
      expect(res.body.decision).toContain('secondary index');
      expect(res.body).toHaveProperty('editedAt');
    });
  });

  describe('Reports PDF Generator', () => {
    it('should generate and save PDF report', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/report`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('pdfUrl');
      expect(res.body.pdfUrl).toContain('/reports/report_');
    });
  });
});
