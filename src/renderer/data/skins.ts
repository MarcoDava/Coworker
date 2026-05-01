export type AvatarAppearance = {
  id: string;
  name: string;
  bodyColor: string;
  skinTone: string;
  hairColor: string;
  eyeColor: string;
  chairColor: string;
  locked?: boolean;
};

export const SKINS: AvatarAppearance[] = [
  { id: 'breeze',   name: 'Breeze',   bodyColor: '#5aa8ff', skinTone: '#f8d2aa', hairColor: '#3a2010', eyeColor: '#3a88cc', chairColor: '#22aacc' },
  { id: 'coral',    name: 'Coral',    bodyColor: '#ff8e5a', skinTone: '#fcd0b0', hairColor: '#1a1010', eyeColor: '#cc6644', chairColor: '#e0603a' },
  { id: 'sage',     name: 'Sage',     bodyColor: '#7acc66', skinTone: '#e8c090', hairColor: '#2a1a08', eyeColor: '#449933', chairColor: '#55aa44' },
  { id: 'violet',   name: 'Violet',   bodyColor: '#9966ff', skinTone: '#e8d0c0', hairColor: '#150810', eyeColor: '#7744cc', chairColor: '#7744cc' },
  { id: 'rose',     name: 'Rose',     bodyColor: '#ff66aa', skinTone: '#f8c8b0', hairColor: '#200818', eyeColor: '#cc4488', chairColor: '#cc4488' },
  { id: 'slate',    name: 'Slate',    bodyColor: '#5588aa', skinTone: '#c8a880', hairColor: '#1a1a1a', eyeColor: '#336688', chairColor: '#446688' },
  { id: 'neon',     name: 'Neon',     bodyColor: '#00ff88', skinTone: '#d0f0d8', hairColor: '#002a18', eyeColor: '#00cc66', chairColor: '#00cc66', locked: true },
  { id: 'gold',     name: 'Gold',     bodyColor: '#ffcc00', skinTone: '#f0d090', hairColor: '#3a2800', eyeColor: '#cc8800', chairColor: '#cc9900', locked: true },
  { id: 'midnight', name: 'Midnight', bodyColor: '#2244aa', skinTone: '#d4c8e0', hairColor: '#08081a', eyeColor: '#4466ff', chairColor: '#2233aa', locked: true },
  { id: 'flame',    name: 'Flame',    bodyColor: '#ff4400', skinTone: '#f0c090', hairColor: '#2a0800', eyeColor: '#ff6600', chairColor: '#cc3300', locked: true },
  { id: 'ice',      name: 'Ice',      bodyColor: '#b8e8ff', skinTone: '#e8f4ff', hairColor: '#1a2a3a', eyeColor: '#88ccee', chairColor: '#88ccee', locked: true },
  { id: 'shadow',   name: 'Shadow',   bodyColor: '#2a2a3a', skinTone: '#a8a0b0', hairColor: '#0a0a14', eyeColor: '#6644aa', chairColor: '#2a1a4a', locked: true },
];

export const DEFAULT_APPEARANCE = SKINS[0];

const STORAGE_KEY = 'coworker.appearance';

export function loadAppearance(): AvatarAppearance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as { id?: string };
    return SKINS.find((s) => s.id === parsed.id) ?? DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(skin: AvatarAppearance): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: skin.id }));
}

const ENV_KEY = 'coworker.sceneEnv';
export type SceneEnv = 'library' | 'space' | 'train' | 'skyscraper';

export function loadSceneEnv(): SceneEnv {
  const saved = localStorage.getItem(ENV_KEY) as SceneEnv | null;
  return saved ?? 'library';
}

export function saveSceneEnv(env: SceneEnv): void {
  localStorage.setItem(ENV_KEY, env);
}
