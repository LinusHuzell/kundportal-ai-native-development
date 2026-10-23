# Frontend

React + TypeScript + Vite + Tailwind CSS (v4), with React Router, Vitest (unit tests) and Playwright (e2e).

## Run locally

```bash
cd frontend
cp .env.example .env   # optional
npm install
npm run dev            # http://localhost:5173
```

Requires Node 22+.

## Scripts

| Script               | What it does                   |
| -------------------- | ------------------------------ |
| `npm run dev`        | Start the dev server           |
| `npm run build`      | Typecheck and build to `dist/` |
| `npm run typecheck`  | TypeScript only                |
| `npm run lint`       | oxlint                         |
| `npm run format`     | Prettier                       |
| `npm test`           | Unit tests (Vitest) in `src/`  |
| `npm run test:watch` | Vitest in watch mode           |
| `npm run test:e2e`   | Playwright tests in `e2e/`     |

First time running e2e tests: `npx playwright install chromium`.

## Structure

```
src/
  api/         API client (stub until the backend contract is agreed)
  components/  Shared components (Layout)
  pages/       One page per route: list, detail, create/edit
  types/       Domain types (Ticket, status, priority, category)
               Unit tests live next to the code as *.test.ts
e2e/           Playwright tests (full flows in a browser)
```

Routes: `/tickets` (list), `/tickets/new` (create), `/tickets/:id` (detail).

## Open items

- API contract: `src/api/client.ts` throws "not implemented" until the backend contract exists.
- Design: Figma link TBD (draft). Design tokens go in `src/index.css` under `@theme` once final.
- Enum values in `src/types/ticket.ts` are provisional and must match the backend.

## Testing approach

- **Unit tests (Vitest):** fast checks of pure logic such as form validation and label mapping. Named `*.test.ts(x)` next to the code.
- **E2E tests (Playwright):** the main user flows and a few error paths in a real browser.
