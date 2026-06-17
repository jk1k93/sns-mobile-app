# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (opens Expo Go QR code)
npm start

# Platform-specific starts
npm run ios
npm run android
npm run web

# Lint
npm run lint
```

There is no test suite. TypeScript is checked via `expo lint` (which runs `tsc --noEmit` alongside ESLint).

## Environment Variables

Copy `.env` and set:
- `EXPO_PUBLIC_API_URL` — backend base URL (defaults to `http://localhost:8080`)
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` — Google Places API key for city autocomplete (native only; web falls back to manual entry)

## Architecture Overview

**Framework**: Expo SDK 55 (canary) with Expo Router v3 (file-based routing), React 19, TypeScript strict mode.

**Path alias**: `@/*` maps to `src/*`. All imports use this alias.

### App Boot Sequence

`src/app/_layout.tsx` is the root. The render tree is:

```
QueryProvider → AuthProvider → SelectedSportProvider → ThemeProvider
  └─ AuthBootstrapGate (blocks on auth ready)
       └─ AuthenticatedRoot
            ├─ (no user)        → LoginScreen
            ├─ needsProfileCompletion → CreateProfileScreen
            ├─ no selectedSportId    → SelectSportsScreen
            └─ (fully ready)    → LocationProvider → <Slot /> (tabs router)
```

Auth token is persisted in `expo-secure-store` via `src/lib/auth-token.ts`. Selected sport ID is also persisted in SecureStore via `src/lib/selected-sport-id.ts`.

### Auth Flow

OTP-based phone auth: `POST /login` (request OTP) → `POST /verify-otp` (get JWT). The JWT is stored and sent as `Authorization: Bearer <token>` on all authenticated requests via `apiFetchAuth` in `src/lib/api.ts`.

On bootstrap, `GET /profile` is called with the stored token to rehydrate the user. A 401/error clears the token and falls back to login.

`needsProfileCompletion` is true for new users who must `PATCH /profile` before accessing the main app.

### Routing

All main screens live under `src/app/(tabs)/`. The tab bar uses a custom renderer (`src/components/custom-tab-bar.tsx`).

The tournaments sub-navigator (`src/app/(tabs)/tournaments/`) has its own `_layout.tsx` and uses `TournamentDraftProvider` to hold in-progress form state across the create flow:
- `index.tsx` — tournament list
- `create.tsx` — create form (submits directly; `TournamentDraftContext` holds working state)
- `add-venue.tsx` — venue creation sub-screen pushed from the create form
- `[id].tsx` — tournament detail

### API Layer (`src/api/`)

Each file corresponds to a resource. All functions call either `apiFetch` (unauthenticated) or `apiFetchAuth` (adds Bearer token). API responses follow `{ message: string; data: T }` envelope pattern — the `data` field is extracted before returning.

- `auth.ts` — OTP login, profile fetch/patch
- `venues.ts` — venue search and creation; maps internal `VenueWithCity` to the simpler `Venue` type used by the UI
- `tournaments.ts` — CRUD for tournaments
- `users.ts` — `searchUserByPhone` for adding tournament contacts
- `sports.ts` — sports list

### State Management

- **Server state**: TanStack Query (`src/lib/query-client.ts`, wrapped by `src/providers/query-provider.tsx`)
- **Auth state**: `AuthContext` (`src/contexts/auth-context.tsx`)
- **Selected sport**: `SelectedSportContext` — persisted to SecureStore, re-loaded on user change
- **Tournament form**: `TournamentDraftContext` — in-memory draft for the create flow; `reset()` after successful submission
- **Location**: `LocationContext` — provides device location to screens that need it

### Styling

All colors come from `src/constants/app-colors.ts` (`AppColors`). Use `AppColors.*` — no inline hex values. Theme tokens are in `src/constants/theme.ts`. Styles use React Native `StyleSheet.create`.

### Platform Differences

- `.web.ts` / `.web.tsx` suffixes override the base file on web (e.g., `use-color-scheme.web.ts`, `animated-icon.web.tsx`)
- Google Places city autocomplete is disabled on web (CORS); the UI falls back to manual text entry
- `KeyboardAvoidingView` uses `behavior="padding"` on iOS only
