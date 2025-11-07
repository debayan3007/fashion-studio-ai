🧑🏽‍💻 Fashion AI Studio

A full-stack AI studio built with Fastify + Prisma on the backend and Vite + React + React Query on the frontend.
Implements the complete Modelia Full-Stack Engineering Assignment (Oct 2025) requirements — user authentication, image upload + prompt input, simulated AI image generation with retry/abort handling, and history persistence.

🚀 Project Overview

Fashion AI Studio simulates a fashion-image generation platform:

Users can sign up / log in securely via JWT.

Upload an image (max 10 MB) and add a text prompt + style.

Backend simulates an AI generation with 1–2 s delay and 20 % “Model Overloaded” errors.

Frontend handles spinner + retry + abort gracefully.

Recent generations (max 5) are persisted and restorable into the workspace.

All code is fully typed (TypeScript strict mode) and follows a clean modular structure for controllers, routes, and hooks.

🧩 Tech Stack
Layer	Technologies
Frontend	React 18 + TypeScript + Vite + Tailwind CSS + React Query
Backend	Fastify + TypeScript + Prisma (SQLite) + Zod validation + JWT Auth + bcrypt
Testing	Vitest + Supertest (backend) · React Testing Library (frontend) · Playwright (E2E)
CI/CD	GitHub Actions – runs tests + coverage on push/PR
Code Quality	ESLint + Prettier + TypeScript strict
Future AI Integration	OpenAI SDK (openai.ts)
⚙️ Prerequisites

Node.js 20 +

Yarn 1.x

SQLite (bundled with Prisma)

💡 On Windows, use WSL or any POSIX-compatible shell.

🔐 Environment Variables

Create backend/.env to override defaults.

Variable	Description	Default
PORT	Fastify server port	4000
JWT_SECRET	JWT signing secret	dev-secret
DATABASE_URL	Prisma connection	file:./prisma/dev.db
OPENAI_API_KEY	(optional) Real OpenAI integration	(unset)

Example:

PORT=4000
JWT_SECRET=super-secret
DATABASE_URL="file:./prisma/dev.db"
# OPENAI_API_KEY=sk-...

🏗️ Structure
fashion-ai/
├── backend/          # Fastify API, Prisma models, Vitest tests
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── prisma.ts
│   │   └── openai.ts
│   └── tests/
├── frontend/         # Vite + React app with React Query hooks & tests
│   ├── src/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── pages/
│   └── tests/
├── OPENAPI.yaml      # Complete API spec
├── EVAL.md
├── AI_USAGE.md
└── README.md

🧰 Installation
# Backend
cd backend
yarn install

# Frontend
cd ../frontend
yarn install

# Return to root
cd ..

🖥️ Run the Backend
cd backend

# Dev server
yarn dev

# Production build
yarn build && yarn start


API available at http://127.0.0.1:4000

Endpoints

GET /healthz

POST /auth/signup

POST /auth/login

GET /generations

POST /generations (multipart)

💅 Run the Frontend
cd frontend
yarn dev --host 127.0.0.1
# or build & preview
yarn build && yarn preview


UI runs at http://127.0.0.1:5173

🧪 Testing & Quality
Backend
cd backend
yarn test           # Unit + integration
yarn test:coverage  # Coverage
yarn lint           # ESLint
yarn format:check   # Prettier

Frontend
cd frontend
yarn test
yarn test:coverage
yarn lint
yarn format:check

E2E
yarn e2e


End-to-end tests simulate: signup → login → upload → generate → view → restore.

🧠 OpenAI Integration (Enhancement Path)

While the assignment specifies simulated image generation,
the backend already includes an openai.ts
 client.

You can easily switch to real OpenAI image generation:

Add your API key in .env

OPENAI_API_KEY=sk-xxxx


Replace the mock delay block in /generations with:

const result = await openai.images.generate({
  model: 'gpt-image-1',
  prompt: `${prompt}, style: ${style}`,
  size: '1024x1024'
});
const imageUrl = result.data[0].url;


Return this imageUrl — the frontend already displays it.

All other components remain unchanged.

📜 OpenAPI Spec

See OPENAPI.yaml
 for endpoint definitions and sample payloads.

⚙️ Continuous Integration

GitHub Actions workflow at .github/workflows/ci.yml runs on every push/PR:

Installs dependencies

Runs backend + frontend tests

Uploads coverage artifacts

🧾 Deliverables

✅ README.md (this file)

✅ OPENAPI.yaml

✅ EVAL.md

✅ AI_USAGE.md

✅ .github/workflows/ci.yml

✅ Two PR links (feature + tests/docs)

🌱 Future Improvements

Real OpenAI integration (via openai.ts)

Image pre-resize before upload

Dark mode toggle

Code splitting + lazy loading

Framer Motion animations

Author: Debayan Singha
Email: debayansingha@gmail.com
LinkedIn: linkedin.com/in/debayan-singha

Expand this guide with deployment or troubleshooting notes as the project evolves.

This version ties every section back to the assignment rubric, clarifies the OpenAI extensibility, and gives a professional, reviewer-ready tone.