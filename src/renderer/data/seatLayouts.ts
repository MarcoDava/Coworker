import type { SceneEnv } from './skins';

export type SeatSlot = {
  laptop: [number, number, number];
  avatarZOffset: number;
};

const AVATAR_Z_OFFSET = 0.8;

// 4 seats per environment: [P1, P2, P3, P4]
// P1 & P2 = first two connected players (self + peer 1)
// P3 & P4 = future expansion slots (tables exist, seats empty until wired)
export const SEAT_LAYOUTS: Record<SceneEnv, [SeatSlot, SeatSlot, SeatSlot, SeatSlot]> = {
  library: [
    { laptop: [-1.8, 0, -3.5], avatarZOffset: AVATAR_Z_OFFSET }, // P1 — new rear table
    { laptop: [0.9,  0, -3.5], avatarZOffset: AVATAR_Z_OFFSET }, // P2 — new rear table
    { laptop: [-1.8, 0, -2.1], avatarZOffset: AVATAR_Z_OFFSET }, // P3 — original table
    { laptop: [0.9,  0, -2.1], avatarZOffset: AVATAR_Z_OFFSET }, // P4 — original table
  ],
  space: [
    { laptop: [-1.8, 0, -2.1], avatarZOffset: AVATAR_Z_OFFSET }, // P1 — forward console (CONN)
    { laptop: [0.9,  0, -2.1], avatarZOffset: AVATAR_Z_OFFSET }, // P2 — forward console (OPS)
    { laptop: [-1.2, 0,  1.3], avatarZOffset: AVATAR_Z_OFFSET }, // P3 — aft work surface
    { laptop: [1.2,  0,  1.3], avatarZOffset: AVATAR_Z_OFFSET }, // P4 — aft work surface
  ],
  train: [
    { laptop: [-1.8, 0, -2.85], avatarZOffset: AVATAR_Z_OFFSET }, // P1 — rear table
    { laptop: [0.9,  0, -2.85], avatarZOffset: AVATAR_Z_OFFSET }, // P2 — rear table
    { laptop: [-1.8, 0, -0.5],  avatarZOffset: AVATAR_Z_OFFSET }, // P3 — front table
    { laptop: [0.9,  0, -0.5],  avatarZOffset: AVATAR_Z_OFFSET }, // P4 — front table
  ],
  skyscraper: [
    { laptop: [-1.8, 0, -3.3], avatarZOffset: AVATAR_Z_OFFSET }, // P1 — rear desk
    { laptop: [0.9,  0, -3.3], avatarZOffset: AVATAR_Z_OFFSET }, // P2 — rear desk
    { laptop: [-1.8, 0,  0.1], avatarZOffset: AVATAR_Z_OFFSET }, // P3 — front desk
    { laptop: [0.9,  0,  0.1], avatarZOffset: AVATAR_Z_OFFSET }, // P4 — front desk
  ],
};
