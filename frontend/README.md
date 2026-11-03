# Slotwise frontend

The Slotwise app. There is no backend yet, so everything runs in the browser. See the [main README](../README.md) for what the project is and how to try it.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Runs the app locally |
| `npm test` | Runs the unit tests |
| `npm run lint` | Checks the code with ESLint |
| `npm run build` | Type-checks and builds for production |

## Where things live

| Path | Contents |
|------|----------|
| `src/lib/clash.ts` | Clash, capacity, teaching-hours, and travel rules, plus the room finder |
| `src/lib/series.ts` | Weekly repeats |
| `src/lib/notifications.ts` | Notification text, and who each one is shown to |
| `src/lib/venues.ts` | Rules for adding, editing, and deleting rooms |
| `src/lib/mockData.ts` | Placeholder campus data, demo sessions, and the demo buttons |
| `src/store/SlotwiseContext.tsx` | Shared app state, saved to `localStorage` |
| `src/pages/` | One file per screen |
| `src/components/ui/` | shadcn components, generated rather than hand-written |

## Good to know

- **The rules have no React in them.** Everything in `src/lib` is plain functions, so it can be tested directly and moved to a backend later.
- **A weekly repeat is stored as one session per week**, linked by a shared `seriesId`. The clash rules, grid, and room finder only ever deal with single dated sessions.
- **Demo data stays current.** When the app loads in a later week, saved sessions move forward by the same number of weeks. This is for demos and should go when real data arrives (`rollSessions` in `src/lib/mockData.ts`).
- **TypeScript is pinned to 6.0.** `typescript-eslint` doesn't support TypeScript 7 yet, and `npm run lint` crashes with it.
