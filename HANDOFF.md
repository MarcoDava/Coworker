# Coworker — Codex Handoff Document

Generated: 2026-04-30. Pick up from here if context ran out or the session ended.

---

## What this project is

**Coworker** is an Electron + React + React Three Fiber (R3F) desktop app for two-person virtual co-working sessions. Two users sit at in-world laptops in a 3D environment, share their real screens via WebRTC, and can peek at each other, call out slacking, and earn points.

Repo root: `C:\Users\marco\Desktop\coworker`

---

## Current state (as of this handoff)

### App flow

```
Onboarding → Hero → Lobby → Session → Scoreboard
```

- **Onboarding** (`src/renderer/screens/Onboarding.tsx`): shown once on first run.
- **Hero** (`src/renderer/screens/Hero.tsx`): landing page with 3D animated desks. "How it works" section was removed. Only one CTA button: "Get started".
- **Lobby** (`src/renderer/screens/Lobby.tsx`): queue system. Two players join the same room code. Host launches the session. Contains:
  - Party queue panel with 3D character portrait cards (`AvatarPortrait`)
  - Room settings (username, bio, duration, room code)
  - Environment picker button → full-screen `EnvironmentPicker` overlay
  - Character customize button → full-screen `CharacterScreen` (early-return, not overlay)
  - Focus rules editor
- **Session** (`src/renderer/screens/Session.tsx`): the actual co-working session. Overhead and first-person camera modes. Esc menu with options.
- **Scoreboard** (`src/renderer/screens/Scoreboard.tsx`): end-of-session results.

### Character system

- **`src/renderer/data/skins.ts`**: `AvatarAppearance` type, `SKINS[]` array (6 free + 6 locked), `loadAppearance/saveAppearance`, `loadSceneEnv/saveSceneEnv` (localStorage).
- **`src/renderer/scene/Avatar.tsx`**: Rec Room-style cel-shaded avatar. Props: `position`, `color`, `rotationY`, `skinColor`, `hairColor`, `eyeColor`, `chairColor`, `isTyping`, `isIdle`, `transparent`.
  - Chair back is at local `z = -0.42` (world `+Z` behind character) — do NOT flip positive.
  - With `rotationY={Math.PI}`, local `+Z` → world `−Z`.
- **`src/renderer/screens/CharacterScreen.tsx`**: full-screen character customizer. Tabs: Colors, Face, Body, Accessories (last three are "coming soon / paid plan"). Saves to localStorage on every change.
- **`src/renderer/ui/AvatarPortrait.tsx`**: mini R3F Canvas for lobby queue cards (head + upper body portrait).

### Environment system

- **`src/renderer/data/environments.ts`**: `ENVIRONMENTS[]` — library, space, train, skyscraper.
- **`src/renderer/ui/EnvironmentPicker.tsx`**: full overlay picker with live 3D preview canvas. Left: scrollable list. Right: live preview. Scales to any number of environments.
- Active environments: Library, Space Station, Night Train, Skyscraper.

### Signaling / networking

- **`server/signaling/index.ts`**: WebSocket signaling server (run separately with `npm run signaling`).
- **`src/renderer/net/signaling.ts`**: `SignalingClient` class. `LobbyProfile` includes `appearance?: AvatarAppearance`.
- Session start reads peer appearance from `membersRef` (stale-closure-safe ref pattern).

### Camera

- **`src/renderer/scene/Camera.tsx`**: `CameraRig` component. Two modes: `overhead` and `firstPerson`.
- Free-look (Alt + drag) works in **both** modes — `freeLookRef` is applied regardless of `cameraMode`.
- Self avatar is **completely hidden** in first-person (`{cameraMode !== 'firstPerson' && <Avatar .../>}`).

---

## Recently completed work (this session)

1. **Lobby QueueCard** — replaced gradient initials box with `AvatarPortrait` (3D portrait, 140px).
2. **CharacterScreen as separate page** — clicking "Customize" in the lobby now early-returns `<CharacterScreen>` from the `Lobby` component (no overlay, no background bleed). Lobby state is preserved in memory.
3. **EnvironmentPicker** — replaced inline 2×2 grid with "Change" button → `EnvironmentPicker` overlay.
4. **First-person avatar** — self avatar not rendered at all in first-person mode.
5. **Hero "How it works"** — removed the section and `Feature` component.
6. **Chair orientation** — chair back at local `z = -0.42` (world `+Z`, correctly behind character).
7. **CLAUDE.md** — condensed to 63 lines, added Codex review note and handoff protocol.

---

## Known issues / watch-outs

- **`CharacterCustomizer.tsx`** (`src/renderer/ui/CharacterCustomizer.tsx`) still exists but is no longer imported anywhere. It can be deleted.
- **`transparent` prop** on `Avatar` still exists but is only used in the peer avatar path — the self avatar is just not rendered in first-person, not made transparent.
- **`CharacterScreen` "Back" button** currently does NOT explicitly save — it re-reads `loadAppearance()` in the Lobby's `onBack` callback, which works because `CharacterScreen` calls `saveAppearance` on every color change. But if the user hits Back without making any change, the re-read is a no-op. This is fine. **However**, the user has now asked for an explicit Save button in the bottom corner — this is pending.

---

## Pending / next tasks

### High priority (user-requested, not yet done)

1. **Save button in CharacterScreen** — user said "pressing back does not save changes, add a save button in the bottom right or left." Currently every color change auto-saves, but the user wants an explicit save button. Options:
   - Add a "Save" button to the bottom-right of `CharacterScreen`.
   - Change the save model to only persist on explicit Save (vs. every keystroke).
   - Simplest: add a Save button that calls `saveAppearance(appearance)` and then `onBack()`.

### Medium priority

2. **Delete `CharacterCustomizer.tsx`** — dead file, no longer imported.
3. **Session Environments button** — user mentioned wanting to access the EnvironmentPicker from inside the session (Esc menu). Not yet implemented.
4. **Face / Body / Accessories tabs** in CharacterScreen — currently "coming soon / paid plan" placeholders.

---

## How to run

```bash
# Install
npm install

# Dev (renderer + Electron)
npm run dev

# Signaling server (required for multiplayer)
npm run signaling

# Type check
npx tsc --noEmit

# Build
npm run build
```

---

## File map (key files only)

```
src/
  main/index.ts                    — Electron main process
  preload/index.ts                 — preload bridge
  renderer/
    App.tsx                        — phase router (onboarding/hero/lobby/session/scoreboard)
    screens/
      Hero.tsx                     — landing page
      Lobby.tsx                    — queue lobby + character/env navigation
      CharacterScreen.tsx          — full-screen character customizer
      Session.tsx                  — active co-working session
      Scoreboard.tsx               — end screen
    scene/
      Avatar.tsx                   — Rec Room-style cel-shaded avatar
      Library.tsx                  — primary 3D environment
      SpaceStation.tsx             — space environment
      Train.tsx                    — night train environment
      Skyscraper.tsx               — skyscraper environment
      Camera.tsx                   — CameraRig (overhead + first-person + free-look)
      Laptop.tsx                   — in-world laptop with WebRTC video texture
    ui/
      AvatarPortrait.tsx           — mini canvas for lobby queue cards
      EnvironmentPicker.tsx        — full-screen env picker with live preview
      AppListEditor.tsx            — focus rules editor
    data/
      skins.ts                     — AvatarAppearance type, SKINS[], localStorage helpers
      environments.ts              — ENVIRONMENTS[] list
    net/
      signaling.ts                 — SignalingClient, LobbyProfile, WebRTC coordination
server/
  signaling/index.ts               — WebSocket signaling server
```
