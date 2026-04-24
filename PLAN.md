# Coworker — Virtual Co-Working Environment (MVP Plan)

## Context

An app where you and a friend "lock in" to a shared virtual workspace (library, plane, train, etc.) — each represented by a Wii-style avatar, each sitting at an in-world laptop that mirrors their real desktop via live screen share. A hotkey lets you peek at your friend's screen. Enforcement is **social + gamified**: your friend can peek at your screen at any moment, and if you're slacking they score points on you.

Confirmed answers:
- **Platform:** Standalone Electron app (Discord Activity ruled out — see research below)
- **Desktop view:** Live WebRTC screen share
- **"Lock-in" mechanic:** No OS enforcement — gamified social accountability (scorekeeper)
- **Scope:** 2 users, 1 environment (library), screen share, peek hotkey, scoring

---

## Discord Activity Feasibility Research (2026-04-23)

### Hard blockers

1. **WebRTC is NOT supported in Discord Activities.** Official Discord networking docs state: *"Currently only WebSockets are supported, and WebRTC is not supported."* This rules out peer-to-peer screen streaming via `RTCPeerConnection` between Activity clients.
2. **All network traffic is proxied** through `https://<app_id>.discordsays.com`. You cannot hit arbitrary external APIs — CSP blocks them. Mitigated via `patchUrlMappings` in the SDK, but adds config overhead.
3. **Screen capture (`getDisplayMedia`) is not a documented/supported capability** of the sandboxed iframe. Even if it worked, you couldn't deliver the captured stream to the other user without WebRTC.

### What *is* supported

- WebSockets (Colyseus for game state, avatar positions, score, timer)
- Authenticated lobbies tied to a voice channel (free auth + presence)
- Rendering anything Three.js/React can render inside the iframe
- Discord's **native** Go Live screen share — but this is a Discord client feature that runs *outside* the Activity; the Activity iframe cannot see or composite that video

### Conclusion

A Discord-Activity-only version cannot put your friend's real desktop onto the in-world laptop. Going with **standalone Electron app** for full fidelity.

---

## Stack

- **Electron + Vite + React + TypeScript** — desktop shell with real-OS capabilities
- **Three.js + React Three Fiber + Drei** — 3D library scene, avatars, in-world laptop mesh with live video texture
- **Electron `desktopCapturer` → MediaStream → HTMLVideoElement → Three.js `VideoTexture`** — paints your real desktop onto the in-world laptop
- **Simple-peer (WebRTC wrapper)** + tiny Node signaling server (or PeerJS for zero-infra) — P2P screen stream between the two clients
- **Colyseus** *(or reuse the same WebRTC data channel)* — authoritative state: avatar positions, timer, score, "who is peeking at whom"
- **Ready Player Me** avatars for MVP (Wii-Mii style is trademarked; RPM gives a close cartoon look quickly)
- **Discord Rich Presence** (`discord-rpc` npm) — "In a library with @friend — 23:14 left"
- **`active-win`** npm — reads focused-window title + process name on macOS/Windows/Linux

---

## MVP Feature List

### Core loop
1. Launch app → sign in (just a display name for MVP; no accounts)
2. Host creates a room (6-digit code), friend joins with code
3. Both pick session duration (25/50/90 min)
4. Both click "Ready" — session starts, 3D library loads, avatars seated at desks
5. Each client captures its own desktop and streams to the other via WebRTC
6. Countdown timer visible in HUD and on in-world wall clock
7. Peek hotkey (default: hold `Alt`) → camera smoothly cuts to friend's laptop screen; release → back to own

### Scorekeeper / gamification

Automated window-title-based scoring with a user-configured app list.

**Session setup:** in the lobby, both players agree on a **blacklist or whitelist** of apps/sites:
- *Blacklist mode:* anything on this list (e.g. YouTube, Twitter, Reddit, games) counts as slacking. Everything else is fine.
- *Whitelist mode:* only these apps (e.g. VS Code, Figma, Notion, Chrome - Google Docs) count as working. Everything else is slacking.
- The list is shared between both players (one agrees, other confirms).

**Runtime:** each client continuously reads its own focused-window title + process name (`active-win`) and broadcasts it to the peer over the WebRTC data channel. So the "is friend slacking?" status is always known to both.

**Call-out mechanic:**
- Press peek hotkey (default `Alt`) → camera swings to friend's laptop.
- Press call-out key (default `Spacebar`) while peeking.
- App checks the target's current window against the agreed list:
  - **Target IS on a slacking app** → caller gains points, target loses points. Toast on target: "you got called out for [app name]".
  - **Target IS on a valid app** → caller is prompted with a text box: *"you called out your friend even though they're on [app]. Give a reason."* Reason is sent to target, who can accept (caller gets partial points) or reject (caller loses points). If caller submits no reason within 15s, caller loses points automatically.
- Net effect: you can always press call-out, but you'll be punished if you do it unjustly without a good reason.

**Idle penalty:** if no keyboard/mouse input for >2 min (configurable, uses Electron `powerMonitor.getSystemIdleTime()`), target silently accrues idle-penalty points. Shown to peer as a subtle "💤" over their avatar.

**End of session:** scoreboard screen with running score + itemized log. Winner's avatar does a victory pose; loser's avatar slumps.

### Pauses

Session setup includes a **pause cap** both players agree on (default: 2 pauses × 3 min each). Hitting pause:
- Stops timer
- Hides your screen share (shows a "🚪 AFK" placard on your in-world laptop)
- Suspends idle penalty
- Shows peer a toast + countdown
- When pause cap is exceeded, further pauses simply resume idle-penalty scoring (no hard block, just no protection)

### Explicit non-goals for MVP
- OCR / deep content analysis
- More than 2 players
- Custom avatars, custom environments
- Mobile / voice chat (users use Discord separately)
- Persistent stats across sessions (score resets each session)

---

## File structure

```
coworker/
  package.json                  # electron-vite workspace
  electron.vite.config.ts
  src/
    main/                       # Electron main process
      index.ts                  # window, desktopCapturer, idle detection
      rpc.ts                    # Discord Rich Presence
      capture.ts                # wraps desktopCapturer → MediaStream
      activeWindow.ts           # active-win polling → IPC to renderer
    preload/
      index.ts                  # contextBridge: expose capture + idle APIs
    renderer/                   # React UI + 3D scene
      App.tsx
      screens/
        Lobby.tsx               # create/join room, pick duration
        Session.tsx             # the 3D scene + HUD
        Scoreboard.tsx          # end-of-session results
      scene/
        Library.tsx             # environment mesh + ambient audio
        Avatar.tsx              # RPM rig + seated idle anim
        Laptop.tsx              # mesh w/ VideoTexture from peer stream
        Camera.tsx              # own-laptop vs peek-friend transitions
      net/
        peer.ts                 # simple-peer WebRTC: screen stream + data
        signaling.ts            # connects to signaling server
        protocol.ts             # message types: position, timer, score
      game/
        scoreStore.ts           # zustand store for score, callouts, pauses
        scoring.ts              # pure scoring rules (call-out valid/invalid, idle, reason-accept/reject)
        appClassifier.ts        # blacklist/whitelist check against active-win output
        hotkeys.ts              # peek + callout + pause keybind capture
        pause.ts                # pause cap tracking
      ui/
        AppListEditor.tsx       # lobby: edit blacklist/whitelist
        ReasonPrompt.tsx        # "give a reason" modal when call-out is unjust
        Timer.tsx
        ScoreHUD.tsx
        CallOutRadial.tsx
        DisputeToast.tsx
  server/
    signaling/                  # ~100 LOC Node WS signaling server
      index.ts                  # relays SDP offers/answers by room code
```

---

## Critical integration points to verify early

1. **Electron `desktopCapturer` → `MediaStream` → Three.js `VideoTexture`** — spike this first. Verify frame rate before committing.
2. **WebRTC through home NATs** — `simple-peer` with public STUN usually enough; symmetric NAT needs TURN (Twilio/metered.ca later).
3. **Hotkey capture while game window is focused** — straightforward. For global hotkeys (peek while friend's laptop is focused instead of game), use Electron `globalShortcut`.
4. **`Fn` key:** the OS intercepts `Fn` before it reaches any app. Default to `Alt`; make rebindable. Document in the rebind UI.

---

## Verification plan

- Two machines on different networks launch the app, create/join room
- Session starts within 5s of both clicking Ready
- Each user sees their own desktop textured onto their in-world laptop at ≥15fps
- User A presses `Alt` → camera swings to User B's laptop; User A sees User B's real desktop live
- User A presses call-out while peeking on a whitelisted app → reason prompt fires → target can accept/reject → scores update identically on both clients
- Leave idle >2min → automatic point deduction fires once
- Timer expires → scoreboard shows correct running total

---

## Confirmed decisions

- **Standalone Electron app** (no Discord Activity — WebRTC blocked inside iframe)
- **Scoring:** automatic window-title check via `active-win` against an agreed blacklist/whitelist; call-out while target is on a valid app requires a typed reason
- **Pauses:** user-configurable cap per session; after cap, no hard block but idle penalty resumes
