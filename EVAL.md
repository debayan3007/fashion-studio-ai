## Evaluation Guide

| Requirement | Where Implemented | How to Verify |
|-------------|-------------------|---------------|
| Frontend installs & hooks for generations/auth | `frontend/src/lib/hooks.ts`, `frontend/src/context/AuthContext.tsx` | From project root: `cd frontend && yarn install`. Inspect hooks file for `useGenerations`, `useGenerate`, `useLogin`, `useSignup`. Optional: `yarn test` to ensure hooks/tests pass. |
| Auth pages & routing (login/signup/studio with protected route) | `frontend/src/App.tsx`, `frontend/src/pages/Login.tsx`, `frontend/src/pages/Signup.tsx`, `frontend/src/pages/Studio.tsx`, `frontend/src/main.tsx` | Run frontend: `cd frontend && yarn dev --host 127.0.0.1`. Navigate to `/login`, `/signup`, `/studio`. Verify unauthenticated redirect to `/login`. |
| Studio page UX (file upload preview, prompt/style state, retry messaging, stop control) | `frontend/src/pages/Studio.tsx` | Launch frontend, authenticate, open `/studio`. Upload image and verify preview, click Generate to observe spinner, stop control, retry message, restored prompts/styles. |
| Backend API with auth, generation routes, 429 retry simulation | `backend/src/routes/auth.ts`, `backend/src/routes/generations.ts`, `backend/src/schemas/generations.ts` | Run backend: `cd backend && yarn dev`. Use HTTP client or `curl` to hit `/healthz`, `/auth/signup`, `/auth/login`, `/generations`. Observe 429 response about 20% of the time. |
| Tests (backend Vitest + Supertest, frontend Vitest + RTL) | Backend: `backend/src/test/**/*.ts`. Frontend: `frontend/src/**/*.test.tsx` | Execute: `cd backend && yarn test`. `cd frontend && yarn test`. Coverage with `yarn test:coverage` in both packages. |
| ESLint + Prettier configuration (backend & frontend) | Backend: `backend/eslint.config.js`, `backend/package.json` scripts. Frontend uses existing ESLint config. | Run `cd backend && yarn lint` and `yarn format:check`. Frontend already supports lint/format: `cd frontend && yarn lint`. |
| Playwright E2E setup (not running due to WSL deps) | `playwright.config.ts`, `e2e/user-flow.spec.ts` | Install deps if needed, then run `yarn test:e2e`. Requires backend/frontend servers and Playwright browsers. |
| GitHub Actions CI (install, backend/frontend tests, coverage upload) | `.github/workflows/ci.yml` | Push to branch or run `act push` (if using `act`). Check Actions tab for workflow `CI`. |
| OpenAPI description | `OPENAPI.yaml` | Open the file; confirm endpoints `/healthz`, `/auth/signup`, `/auth/login`, `/generations` defined. |
| README with setup instructions | `README.md` | Review instructions for environment vars, run commands, tests. |


