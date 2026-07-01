# System Design Copilot 📐

System Design Copilot is an AI-powered Product & Architecture Copilot designed to transform rough product descriptions into structured engineering specifications. By analyzing the initial idea through a discovery agent, processing requirement priority backlogs, recommending architectural patterns, comparing technology tradeoffs, logging architecture decisions, and generating downloadable PDF reports, ArchitectAI acts as a Staff Engineer copilot.

---

## Technical Stack

- **Frontend**: React (Vite, TailwindCSS, React Router)
- **Backend**: Node.js (Express, Winston, Morgan, Swagger UI)
- **Database**: MongoDB (Mongoose, Mongoose Schemas)
- **AI Engine**: OpenAI API (with fallback configuration to Anthropic Claude & context-aware offline mock engine)
- **Document builder**: `pdf-lib` for dynamic multi-page PDF generation
- **Testing**: Jest & Supertest (covering Auth, Projects CRUD, Decisions, and Reports)

---

## Directory Structure

```
/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, Winston logger settings
│   │   ├── controllers/     # Route handlers (Auth, Projects, Decisions, Reports)
│   │   ├── services/        # AI Prompts execution & pdf-lib report generation
│   │   ├── routes/          # Express route bindings
│   │   ├── middlewares/     # Auth checks, project ownership, error catchers
│   │   ├── validators/      # Zod validation schemas
│   │   ├── models/          # Mongoose collections mapping
│   │   ├── prompts/         # AI prompts templates
│   │   ├── docs/            # Swagger OpenAPI config
│   │   ├── app.js           # Server application pipeline
│   │   └── server.js        # Server listener entry
│   ├── tests/               # API integration test specs
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # Pages (Login, Dashboard, Detail Wizard)
│   │   ├── layouts/         # Frame layouts
│   │   ├── components/      # Sidebar and Toast alerts
│   │   ├── services/        # API Axios client
│   │   ├── contexts/        # Auth & Toast global states
│   │   └── index.css        # Tailwind classes and overlays
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or hosted on Atlas)
- Optional: OpenAI or Anthropic API Keys (if empty, a smart local mock is used)

### Local Configuration

1. Copy `.env.example` in the root (or in `backend/`) to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure settings:
   - `PORT`: Server port (defaults to `5000`)
   - `MONGODB_URI`: MongoDB connection connection string (defaults to `mongodb://localhost:27017/architectai`)
   - `JWT_SECRET`: Safe encryption key for JWT tokens
   - `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`: API keys for actual AI queries

---

## Local Development Execution

To start the application locally:

### 1. Launch the Backend API
Navigate to the `backend/` directory, install packages, and boot the server in development mode:
```bash
cd backend
npm install
npm run dev
```

### 2. Launch the Frontend Dev Console
Navigate to the `frontend/` directory, install packages, and boot the Vite server:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. All API calls are automatically proxied to port 5000.

---

## API Documentation

ArchitectAI features interactive Swagger documentation detailing all endpoints and model payloads. 


---

## Verification & Testing

The backend contains integration tests testing route auth, project states, and PDF builds.

To run tests:
```bash
cd backend
npm test
```

---

## Containerized Deployment (Docker)

To spin up the database, Express API server, and React client Nginx server automatically:

```bash
docker-compose up --build
```
