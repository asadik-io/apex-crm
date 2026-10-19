# Apex Finance

A CRM front end for wealth advisors: dashboard, clients, pipeline, tasks, reports and settings. Built with Next.js 16, React 19, TypeScript and Tailwind CSS v4; charts by Recharts, drag-and-drop by dnd-kit, state by Zustand.

Everything runs in the browser against a deterministic demo dataset (48 clients, 30 deals, 36 tasks). Changes persist in `localStorage` and can be reset from Settings → Data. Dates are anchored to 19 October 2026 so the demo reads the same for everyone.

## Features

- **Dashboard**: AUM, open pipeline, new clients and tasks due; AUM trend and pipeline-by-stage charts; upcoming tasks, recent activity, top clients.
- **Clients**: search, filter by status, segment and advisor; sortable columns; pagination; CSV export; add and edit clients with inline validation.
- **Client profile**: allocation by account type, accounts, deals, activity timeline, notes, documents.
- **Pipeline**: drag-and-drop board across six stages, deal sheet with stage, notes and won/lost actions, new-deal dialog.
- **Tasks**: grouped by due date, filters by assignee and type, completion tracking.
- **Reports**: revenue, AUM by segment, new clients, pipeline by product, advisor leaderboard with export.
- **Shell**: ⌘K command palette, notifications, light and dark themes with no flash, responsive down to phones.

## Quality

- `npm run build` and `npm run lint` clean.
- axe-core (WCAG 2.1 A/AA) reports no violations on all seven pages in both themes.
- Thirteen Playwright interaction checks cover adding a client, search and sort, persistence across reload, moving deals by sheet and by drag, completing tasks, the palette, the theme toggle and the data reset.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Structure

```
src/app/(app)/*        pages (dashboard, clients, clients/[id], pipeline, tasks, reports, settings)
src/components/shell   sidebar, top bar, command palette, app shell
src/components/ui      primitives: dialog, tabs, popover, switch, progress, toast
src/components/charts  Recharts wrappers using the theme's CSS variables
src/lib/data/mock.ts   seeded demo dataset
src/lib/store.ts       Zustand store with local persistence
src/lib/theme.ts       theme preference without hydration flicker
```
