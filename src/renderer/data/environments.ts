import type { SceneEnv } from './skins';

export type EnvDef = {
  id: SceneEnv;
  label: string;
  desc: string;
};

export const ENVIRONMENTS: EnvDef[] = [
  { id: 'library',    label: 'Library',       desc: 'oak shelves, warm piano' },
  { id: 'space',      label: 'Space Station',  desc: 'cosmos, total silence' },
  { id: 'train',      label: 'Night Train',    desc: 'city lights, rolling track' },
  { id: 'skyscraper', label: 'Skyscraper',     desc: 'glass tower, city panorama' },
];
