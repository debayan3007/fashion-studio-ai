## AI Usage Summary

This project was developed with help from AI tools (Cursor/ChatGPT). The sections below highlight the key areas where AI guidance influenced the codebase.

| Area | Description | Files / Notes |
|------|-------------|---------------|
| Frontend state + hooks | Suggested structure for React Query hooks (`useGenerate`, `useGenerations`, `useLogin`, `useSignup`) and AuthContext wiring. | `frontend/src/lib/hooks.ts`, `frontend/src/context/AuthContext.tsx` |
| Studio UX enhancements | Prompted UI improvements: retry messaging, stop control, spinner, image preview, restore logic. | `frontend/src/pages/Studio.tsx` |
| Backend test stabilization | Guidance on Vitest configuration, SQLite retry logic, helper utilities for Supertest. | `backend/vitest.config.ts`, `backend/src/test/helpers.ts`, `backend/src/test/generations.test.ts` |
| Backend routes & validation | Assisted with multipart handling, Zod validation, and user-not-found checks in generation route. | `backend/src/routes/generations.ts`, `backend/src/routes/auth.ts`, `backend/src/schemas/generations.ts` |
| CI & docs | Produced GitHub Actions workflow, README/EVAL documentation structure. | `.github/workflows/ci.yml`, `README.md`, `EVAL.md` |
| Misc tooling | Helped configure ESLint/Prettier in backend, Playwright tweaks, retry logic. | `backend/eslint.config.js`, `playwright.config.ts`, `e2e/user-flow.spec.ts` |

Additional conversational context and rationale are available in the project timeline or commit history if further audit is required.

