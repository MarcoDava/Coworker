# Coworker

A virtual co-working app where you and a friend lock in to a shared 3D workspace — each seated at a desk, each with a live view of the other's real desktop streamed onto an in-world laptop.

## How it works

- **Room**: one person hosts (gets a 6-digit code), the other joins with it
- **Screen share**: each client captures its own desktop via Electron's `desktopCapturer` and streams it peer-to-peer over WebRTC — your friend's real desktop appears on their in-world laptop
- **Peek**: hold `Alt` to swing the camera to your friend's screen; press `Space` to call them out if they're slacking
- **Scoring**: the app checks focused-window titles against a shared blacklist/whitelist agreed in the lobby — automatic point deduction when you're off-task, bonus points for catching your friend
- **Idle penalty**: if no keyboard/mouse input for 2+ minutes, you silently lose points
- **Discord Rich Presence**: shows session status in your Discord profile

## Environments

Switch in the Options panel during a session:

| Environment | Description |
|-------------|-------------|
| Library | Warm daytime room with bookshelves and a reading rug |
| Space Station | Sci-fi interior with porthole windows and a maintenance bot |
| Train | Scenic ride with passing buildings outside the windows |
| Skyscraper | Night cityscape with a panoramic window and animated city below the moon |

## Stack

- **Electron** — desktop shell, `desktopCapturer`, `globalShortcut`, `powerMonitor`
- **React + Vite (electron-vite)** — renderer UI
- **React Three Fiber + Drei + Three.js** — 3D scenes and avatars
- **simple-peer** — WebRTC wrapper for screen streaming and data channel
- **Zustand** — score / game state store
- **active-win** — reads focused window title for automated scoring
- **discord-rpc** — Discord Rich Presence integration

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Development

Start the signaling server in one terminal:

```bash
npm run signaling
```

Start the Electron app in another:

```bash
npm run dev
```

HMR works for renderer code. Main/preload changes require a full Electron restart.

### Build

```bash
npm run build
```

### Type check

```bash
npm run typecheck
```

## Project structure

```
src/
  main/           Electron main process (window, IPC, shortcuts)
  preload/        contextBridge API surface
  renderer/
    screens/      Lobby, Session, Scoreboard
    scene/        3D environments + Avatar, Laptop, Camera
    net/          WebRTC peer connection, signaling client, protocol types
    game/         Scoring rules, hotkeys, pause tracking, app classifier
    ui/           HUD components (Timer, ScoreHUD, ReasonPrompt, etc.)
server/
  signaling/      WebSocket relay — matches peers by room code
```

## Default hotkeys

| Action | Key |
|--------|-----|
| Peek at friend's screen | `Alt` (hold) |
| Call out | `Space` (while peeking) |
| Toggle screen mode | Double-tap `Escape` |
| Toggle HUD (screen mode) | `Ctrl+Shift+H` |

All hotkeys are rebindable in the Options panel.
