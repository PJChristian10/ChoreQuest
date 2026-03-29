# ChoreQuest — AI Session Context

## Project Identity
Gamified chore-tracking PWA for families. Children (ages 5–14) complete quests to earn XP and coins; parents approve completions and manage the system. Kiosk-style tablet app locked to landscape orientation.

**Stack:** React 19 · TypeScript 5 · Vite 8 · Vitest 2 · CSS Modules · bcryptjs · lucide-react
**No backend.** All state persists to `localStorage`. No router (manual screen switching via `useState`).

---

## File Structure

```
src/
├── App.tsx                    # Root: screen routing via useState<AppScreen>
├── main.tsx                   # Entry point
├── models/                    # TypeScript interfaces only — no executable code
│   ├── player.ts
│   ├── quest.ts
│   ├── reward.ts
│   └── auth.ts
├── state/
│   ├── types.ts               # GameState + GameAction discriminated union
│   ├── reducer.ts             # Pure gameReducer + INITIAL_STATE
│   ├── GameContext.tsx        # GameProvider, useGameState, useGameDispatch
│   ├── localStorage.ts        # saveState / loadState with Date revival
│   └── seed.ts                # Static default data
├── services/                  # Pure business logic functions
│   ├── authService.ts
│   ├── questService.ts
│   ├── rewardService.ts
│   ├── streakService.ts
│   └── leaderboardService.ts
├── components/
│   └── ComponentName/
│       ├── ComponentName.tsx
│       ├── ComponentName.module.css
│       ├── index.ts           # barrel re-export (optional)
│       └── __tests__/
│           └── ComponentName.test.tsx
├── hooks/
│   └── useInactivityTimer.ts  # 60s idle → return to kiosk
├── utils/
│   ├── avatarUtils.ts         # AVATAR_OPTIONS, AvatarKey, getAvatarEmoji
│   ├── playerUtils.ts
│   └── questFilters.ts        # filterQuests, sortQuests, applyFiltersAndSort
├── styles/
│   ├── global.css             # :root tokens + reset + landscape lock
│   └── tokens.module.css      # Same tokens for typed CSS Module imports
└── test/
    ├── setup.ts               # @testing-library/jest-dom/vitest import
    └── fixtures.ts            # make*() factory functions for all models
```

---

## State Architecture

### GameState (single source of truth)
```ts
interface GameState {
  readonly players: readonly Player[];
  readonly quests: readonly Quest[];
  readonly claims: readonly QuestClaim[];
  readonly rewards: readonly Reward[];
  readonly redemptions: readonly RewardRedemption[];
  readonly parentConfig: ParentConfig | null;
  readonly parentSession: ParentSession | null;
}
```

### State flow
1. `GameProvider` wraps the entire app with `useReducer(gameReducer, startingState)`
2. `useGameState()` / `useGameDispatch()` — the only hooks components use to read/write state
3. Every `dispatch()` call hits `gameReducer` → returns a new `GameState` → auto-saved to `localStorage`
4. `localStorage.ts` handles serialization including Date revival (ISO strings → `Date` objects)

### Screens (AppContent local state)
```
"loading" | "setup" | "reauth-setup" | "kiosk" | "quest-board" | "parent-dashboard"
```
Initial screen determined by: no players + no parentConfig → `"setup"`, no players + parentConfig → `"reauth-setup"`, otherwise → `"kiosk"`.

---

## Key Domain Models

### Player
- `xp` / `lifetimeXP` — `xp` can decrease via future mechanics; `lifetimeXP` never decreases; drives `level`
- `coins` / `lifetimeCoins` / `weeklyCoins` — weekly resets to 0 every Sunday via `RESET_WEEKLY`
- `streak` / `longestStreak` — daily consecutive quest completions; "On a Roll" at streak ≥ 3
- `lastActivityDate` — `"YYYY-MM-DD"` string (UTC), used for streak arithmetic
- `playerPin` — bcrypt hash (optional); absent = no PIN required for that player
- `avatar` — key from `AVATAR_OPTIONS` (e.g. `"cat"`, `"dragon"`)
- `level` — 1–10, calculated from `lifetimeXP` via `calculateLevel()` in `questService.ts`

### Level thresholds (lifetimeXP)
| Level | XP | Title |
|---|---|---|
| 1 | 0 | Apprentice |
| 2 | 100 | Squire |
| 3 | 250 | Scout |
| 4 | 500 | Ranger |
| 5 | 900 | Knight |
| 6 | 1400 | Champion |
| 7 | 2000 | Guardian |
| 8 | 2800 | Warlord |
| 9 | 3800 | Legend |
| 10 | 5000 | Grand Master |

### Quest lifecycle
```
available → awaiting_approval → approved (daily/weekly → back to available)
                              → denied   (→ available)
```
- `isActive: false` hides quest from children; one-time quests become inactive after approval
- `difficulty`: `1 | 2 | 3`
- `recurrence`: `"daily" | "weekly" | "one-time" | "bonus"`

### Auth
- Parent PIN: 4 digits, bcrypt-hashed (saltRounds=10 prod, 1 in tests)
- `ParentSession` timeout: **10 minutes** (`SESSION_TIMEOUT_MS`)
- Privileged actions (`APPROVE_QUEST`, `DENY_QUEST`, `DELETE_PLAYER`, etc.) check `isSessionActive(session, new Date())` inside the reducer
- Inactivity timer in UI: **60 seconds** → force return to kiosk screen

### Reward
- `stock: -1` = unlimited
- `isActive: false` hides from shop
- Redemption status: `"pending" | "fulfilled" | "cancelled"`

---

## Services (Pure Functions)

All service functions are pure — they receive immutable inputs and return new objects. They never mutate arguments and never access global state.

| Service | Key exports |
|---|---|
| `authService` | `hashPin`, `verifyPin`, `verifyPlayerPin`, `createSession`, `isSessionActive`, `verifyAndRecord`, `changePin` |
| `questService` | `claimQuest`, `approveQuest`, `denyQuest`, `calculateLevel` |
| `rewardService` | `redeemReward`, `fulfillRedemption` |
| `streakService` | `updateStreak`, `daysBetween`, `isOnARoll` |
| `leaderboardService` | `resetWeekly` |

Services throw descriptive `Error` objects on invalid input. The reducer catches all service throws silently and returns `state` unchanged.

---

## Design Tokens

Reference via CSS custom properties (available globally from `:root`):

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#1B2A4A` | Navy — page background |
| `--color-surface` | `#243558` | Card/panel surface |
| `--color-gold` | `#F0C040` | Accent, titles, badges |
| `--color-amber` | `#E8734A` | Primary action buttons |
| `--color-green` | `#7EC84A` | Success / complete |
| `--color-text` | `#F5F0E8` | Body text |
| `--color-muted` | `#8A9BB5` | Metadata, labels |
| `--font-display` | Cinzel Decorative, serif | Titles, ranks, quest names |
| `--font-body` | Nunito, sans-serif | Body, labels, buttons |
| `--touch-min` | `60px` | Min button size (WCAG + children) |
| `--radius-sm/md/lg` | 6/10/16px | Border radius |
| `--shadow-card` | 0 4px 16px rgba(0,0,0,.35) | Card elevation |
| `--shadow-raised` | 0 8px 24px rgba(0,0,0,.5) | Elevated surfaces |
| `--space-1..10` | 0.25–2.5rem | 4px increments |
| `--text-xs..3xl` | 0.75–1.875rem | Type scale |

**Do not** use raw hex values or pixel numbers in component CSS — always reference tokens.

---

## Component Conventions

- Each component lives in its own folder: `ComponentName/ComponentName.tsx` + `ComponentName.module.css`
- Sub-components co-located in the same folder (e.g. `QuestCard/QuestCardHeader.tsx`)
- Barrel `index.ts` files are pure re-exports — no logic
- Props interfaces are local to the file, named `ComponentNameProps`, use `readonly` fields
- Components consume state via `useGameState()` and dispatch via `useGameDispatch()`
- No component manages global state with local `useState` — route through dispatch
- All buttons/interactive elements must meet `min-height: var(--touch-min)` (60px)
- App is landscape-only — no portrait layout support needed

---

## Testing

### Environments
- **Service / util / reducer tests** → `node` environment (default)
- **Component tests** (`src/components/**/*.test.tsx`) → `jsdom` (auto via `vitest.config.ts` `environmentMatchGlobs`)

### Imports
```ts
import { describe, it, expect, vi, afterEach } from "vitest"; // globals: false
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest"; // loaded in setup.ts
```

### Test fixtures
Use factory functions from `src/test/fixtures.ts` for shared tests, or define local `make*()` functions inline for component-scoped tests:
```ts
makePlayer(overrides?)      makeQuest(overrides?)
makeReward(overrides?)      makeClaim(overrides?)
makeRedemption(overrides?)  makeGameState(overrides?)
makeParentSession(overrides?)  makeParentConfig(overrides?)
makeActiveSession()         makeExpiredSession()
makePlayerWithPin(pin?, overrides?)
makePlayerWithAvatar(key?, overrides?)
```

### Component test pattern
```tsx
function renderComponent(state: GameState) {
  return render(
    <GameProvider initialState={state}>
      <MyComponent {...props} />
    </GameProvider>
  );
}
```
Pass `initialState` to `GameProvider` — this bypasses localStorage entirely.

### Coverage thresholds (enforced)
80% branches / functions / lines / statements. Models, types, seed, test files, barrel index files, `App.tsx`, `main.tsx`, and `GameContext.tsx` are excluded from coverage measurement.

### Commands
```bash
npm test              # vitest run (CI)
npm run test:watch    # vitest (watch)
npm run test:coverage # with coverage report → coverage/
npm run dev           # Vite dev server
npm run build         # Production build
```

---

## Import Conventions

Use `.js` extensions on all relative imports (ESM):
```ts
import { gameReducer } from "../state/reducer.js";  // ✓
import { gameReducer } from "../state/reducer";      // ✗ — will fail at runtime
```
This applies even when the actual file is `.ts` or `.tsx`.

---

## Immutability Rules

All models use `readonly` — never mutate in place:
```ts
// CORRECT
const updated = { ...player, coins: player.coins + reward };
// WRONG
player.coins += reward;  // TypeScript will reject this too
```
Reducer `switch` cases always return `{ ...state, field: newValue }`.

---

## Avatar System

12 fixed avatar options (`src/utils/avatarUtils.ts`):
```
cat · dog · lion · frog · panda · fox · bear · tiger · butterfly · unicorn · dragon · eagle
```
Use `getAvatarEmoji(key)` to render; falls back to `"👤"` for unknown keys. `AvatarKey` is a string union derived from `AVATAR_OPTIONS`.

---

## Security Invariants

- **Never store plaintext PINs** — always `hashPin()` before persisting
- Parent PIN: bcrypt saltRounds=10 in production, saltRounds=1 in tests
- `ParentConfig.hashedPin` is the only PIN field in `GameState`
- `Player.playerPin` is a bcrypt hash or `undefined`
- Privileged reducer cases guard with `isSessionActive()` — don't remove these guards
- `failedAttempts` increments on each wrong PIN via `verifyAndRecord()`

---

## What to Avoid

- **No external state libraries** (Redux, Zustand, etc.) — the Context + useReducer pattern is intentional
- **No React Router** — screen routing is a local `useState<AppScreen>` in `AppContent`
- **No portrait layouts** — app is landscape-locked via CSS `@media (orientation: portrait)`
- **No hardcoded colors/sizes** in CSS — always use `var(--token-name)`
- **No `localStorage` access outside `state/localStorage.ts`**
- **No `new Date()` in reducers** — actions carry `now: Date` to keep reducers pure and testable
- **No mutation of GameState arrays** — always spread and replace
- **No skipping the `isSessionActive` guard** on parent-privileged actions
- **No `vitest` globals** — import `describe`, `it`, `expect`, `vi` explicitly
- **No `cleanup()` omission** in component tests — call `afterEach(() => cleanup())`
- **No raw pixel values** for touch targets — use `var(--touch-min)`

---

## Parent Dashboard Tabs

`src/components/ParentDashboard/tabs/`

| Tab | Purpose |
|---|---|
| `ActivityLogTab` | History of all quest claims and reward redemptions |
| `PendingApprovalsTab` | Claims awaiting parent approval/denial |
| `PlayerManagementTab` | Add/edit/delete players, set PINs and avatars |
| `QuestManagementTab` | Create/edit/delete quests, toggle active |
| `RewardManagementTab` | Create/delete rewards, fulfill redemptions |
| `SystemTab` | Change parent PIN, reset weekly, seed data |

Each tab folder follows the same structure: `TabName.tsx` + `TabName.module.css` + `__tests__/TabName.test.tsx`.
