# Coworker Handoff

## What The App Is

Coworker is a desktop-first virtual co-working app for two people.

The core idea is:
- two users join the same room
- both share their screen/work context
- both sit in the same small 3D environment
- they can lightly monitor each other, stay accountable, and lock in together

It is not meant to feel like a normal video call or a utilitarian meeting tool.
The intended vibe is a cozy, interactive diorama: a shared room with two small characters, two desks, two screens, and ambient atmosphere.

## Product Direction

The current visual direction is:
- "Wii Plaza meets Studio Ghibli interior"
- rounded, soft, toy-like forms
- matte materials instead of realistic PBR
- warm, readable lighting
- a living environment with subtle animated details

The main hero environment right now is the library.

## Current State Of Development

Right now, the work is mostly about fixing visuals, layout, and interaction feel.

We are **not** primarily building new product scope at the moment.
We are taking the current experience and making it feel correct, readable, and intentional.

That includes:
- camera feel
- avatar placement and facing
- laptop/screen readability
- room composition
- HUD clarity
- menu behavior
- screen-mode behavior
- lobby presentation

## Important Systems Already In Place

- Shared queue/lobby over the signaling server
- Two-player gate before session start
- Live-updating username / bio / avatar card in lobby
- 3D session scene with two desks and two laptops
- WebRTC signaling / peer connection flow
- Pause / menu / quit-friction flow
- Screen mode prototype for viewing your own shared screen large

## What We Are Fixing Right Now

The current pass is mostly about visual and experiential cleanup:
- making the two seated characters look positioned correctly
- making screens easier to read
- making the camera feel intuitive
- reducing awkward clipping / overlap
- improving lobby presentation
- making the app feel like one coherent world instead of a rough prototype

In short:

**The app concept is already decided.**
**The current task is polishing the presentation and interaction quality.**

## Things To Keep In Mind In A New Chat

- Preserve the cozy diorama direction
- Avoid turning the UI into a generic dark productivity dashboard
- Prefer fixing broken or awkward visual behavior before adding major new systems
- When changing multiplayer/lobby behavior, remember the lobby now syncs through the signaling server
- The live session uses a separate signaling sub-room from the queue lobby

## Good Summary Sentence

Coworker is a two-person virtual lock-in room, and the current focus is not inventing the app from scratch but making the existing visual experience feel polished, readable, and emotionally coherent.
