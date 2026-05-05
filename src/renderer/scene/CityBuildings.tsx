// ─── Palettes & arch types ────────────────────────────────────────────────────

const LAYER_PALETTES = {
  far:  ['#1b1a36', '#1c1a30', '#1a1c38'],
  mid:  ['#261c3a', '#22183a', '#2a1838', '#1f1432'],
  near: ['#2e1638', '#1e0a26', '#321844', '#3a1c4a'],
} as const;
const ROOF_ACC  = '#3a2050';
const WIN_WARM  = '#ffb964';
const WIN_AMB   = '#ff8c40';
const WIN_COOL  = '#6ec0ff';
const NEON_PINK = '#ff4d8a';
const NEON_TEAL = '#38e8d2';
const WIN_COLS  = [WIN_WARM, WIN_WARM, WIN_AMB, WIN_COOL] as const;
const BB_LABELS = ['NOODLES', 'OPEN 24H', 'JAZZ', 'HOTEL'] as const;
const ARCHS     = ['flat','flat','spire','setback','setback','gabled','domed','crown','water','factory','billboard'] as const;
type Arch = typeof ARCHS[number];

export function pr(seed: number) {
  const x = Math.sin(seed + 1) * 43758.5453;
  return x - Math.floor(x);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CityBldg = {
  x: number; w: number; h: number; color: string; arch: Arch;
  botH: number; topH: number; topW: number;
  t2H: number; t2W: number; t3H: number; t3W: number;
  glowRows: number; litRate: number;
  bbColor: string; bbLabel: string;
};

// ─── Building data generator ──────────────────────────────────────────────────

export function genBuildings(count: number, stripW: number, layer: 'far' | 'mid' | 'near'): CityBldg[] {
  const colors = LAYER_PALETTES[layer];
  const [wMin, wMax] = layer === 'far' ? [0.06, 0.14] : layer === 'mid' ? [0.10, 0.23] : [0.15, 0.34];
  const [hMin, hMax] = layer === 'far' ? [0.13, 0.35] : layer === 'mid' ? [0.21, 0.60] : [0.35, 0.85];
  const litRate = layer === 'far' ? 0.32 : layer === 'mid' ? 0.50 : 0.62;
  const base = layer === 'far' ? 0 : layer === 'mid' ? 3000 : 6000;
  return Array.from({ length: count }, (_, i) => {
    const s = i * 11 + base;
    const w = wMin + pr(s + 1) * (wMax - wMin);
    const h = hMin + pr(s + 2) * (hMax - hMin);
    const color = colors[Math.floor(pr(s + 3) * colors.length)];
    const arch = ARCHS[Math.floor(pr(s + 4) * ARCHS.length)];
    const r5 = pr(s + 5); const r6 = pr(s + 6);
    const botH = h * (0.45 + r5 * 0.25);
    return {
      x: (i / count) * stripW, w, h, color, arch, litRate,
      glowRows: Math.max(2, Math.floor(h / 0.055)),
      botH, topH: h - botH, topW: w * (0.55 + r6 * 0.2),
      t2H: h * 0.27, t2W: w * 0.78,
      t3H: h * (1 - 0.55 - 0.27), t3W: w * 0.50,
      bbColor: r5 < 0.5 ? NEON_TEAL : NEON_PINK,
      bbLabel: BB_LABELS[Math.floor(r6 * BB_LABELS.length)],
    };
  });
}

// ─── Renderers ────────────────────────────────────────────────────────────────

function BldgSegment({ w, h, color, opacity, glowRows, litRate, seed }: {
  w: number; h: number; color: string; opacity: number;
  glowRows: number; litRate: number; seed: number;
}) {
  const tr = opacity < 1;
  return (
    <group>
      <mesh>
        <boxGeometry args={[w, h, 0.001]} />
        <meshBasicMaterial color={color} transparent={tr} opacity={opacity} />
      </mesh>
      <mesh position={[0, h / 2 + 0.002, 0.0005]}>
        <boxGeometry args={[w + 0.004, 0.004, 0.001]} />
        <meshBasicMaterial color={ROOF_ACC} transparent={tr} opacity={opacity} />
      </mesh>
      {Array.from({ length: glowRows }, (_, j) => {
        if (pr(seed + j * 7) > litRate) return null;
        return (
          <mesh key={j} position={[0, -h / 2 + 0.010 + (j + 0.5) * ((h - 0.018) / glowRows), 0.0008]}>
            <planeGeometry args={[w * 0.62, 0.009]} />
            <meshBasicMaterial color={WIN_COLS[Math.floor(pr(seed + j * 3) * WIN_COLS.length)]} transparent opacity={0.80 * opacity} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Bldg3D({ b, seed, opacity }: { b: CityBldg; seed: number; opacity: number }) {
  if (b.arch === 'setback') return (
    <group>
      <group position={[0, -b.h / 2 + b.botH / 2, 0]}>
        <BldgSegment w={b.w} h={b.botH} color={b.color} opacity={opacity} glowRows={Math.max(2, Math.floor(b.botH / 0.055))} litRate={b.litRate} seed={seed} />
      </group>
      <group position={[0, -b.h / 2 + b.botH + b.topH / 2, 0]}>
        <BldgSegment w={b.topW} h={b.topH} color={b.color} opacity={opacity} glowRows={Math.max(2, Math.floor(b.topH / 0.055))} litRate={b.litRate} seed={seed + 50} />
      </group>
    </group>
  );
  if (b.arch === 'crown') return (
    <group>
      <group position={[0, -b.h / 2 + b.botH / 2, 0]}>
        <BldgSegment w={b.w} h={b.botH} color={b.color} opacity={opacity} glowRows={Math.max(2, Math.floor(b.botH / 0.055))} litRate={b.litRate} seed={seed} />
      </group>
      <group position={[0, -b.h / 2 + b.botH + b.t2H / 2, 0]}>
        <BldgSegment w={b.t2W} h={b.t2H} color={b.color} opacity={opacity} glowRows={Math.max(2, Math.floor(b.t2H / 0.055))} litRate={b.litRate} seed={seed + 50} />
      </group>
      <group position={[0, -b.h / 2 + b.botH + b.t2H + b.t3H / 2, 0]}>
        <BldgSegment w={b.t3W} h={b.t3H} color={b.color} opacity={opacity} glowRows={Math.max(2, Math.floor(b.t3H / 0.055))} litRate={b.litRate} seed={seed + 100} />
      </group>
    </group>
  );
  const tr = opacity < 1;
  return (
    <group>
      <BldgSegment w={b.w} h={b.h} color={b.color} opacity={opacity} glowRows={b.glowRows} litRate={b.litRate} seed={seed} />
      {b.arch === 'spire' && <>
        <mesh position={[0, b.h / 2 + 0.018, 0]}>
          <cylinderGeometry args={[0.001, 0.001, 0.034, 3]} />
          <meshBasicMaterial color="#1a1830" transparent={tr} opacity={opacity} />
        </mesh>
        <mesh position={[0, b.h / 2 + 0.037, 0]}>
          <sphereGeometry args={[0.003, 4, 4]} />
          <meshBasicMaterial color={NEON_PINK} />
        </mesh>
      </>}
      {b.arch === 'gabled' && (
        <mesh position={[0, b.h / 2 + b.w * 0.20, 0]}>
          <coneGeometry args={[b.w * 0.52, b.w * 0.40, 3, 1]} />
          <meshBasicMaterial color={ROOF_ACC} transparent={tr} opacity={opacity} />
        </mesh>
      )}
      {b.arch === 'domed' && (
        <mesh position={[0, b.h / 2 + b.w * 0.08, 0]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[b.w * 0.32, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={b.color} transparent={tr} opacity={opacity} />
        </mesh>
      )}
      {b.arch === 'water' && (
        <mesh position={[b.w * 0.16, b.h / 2 + 0.013, 0]}>
          <cylinderGeometry args={[b.w * 0.09, b.w * 0.09, 0.018, 6]} />
          <meshBasicMaterial color="#1a0a20" transparent={tr} opacity={opacity} />
        </mesh>
      )}
      {b.arch === 'factory' && (
        <mesh position={[b.w * 0.20, b.h / 2 + 0.015, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.030, 4]} />
          <meshBasicMaterial color="#160820" transparent={tr} opacity={opacity} />
        </mesh>
      )}
      {b.arch === 'billboard' && (
        <mesh position={[0, b.h / 2 + 0.007, 0.001]}>
          <planeGeometry args={[b.w * 0.76, 0.014]} />
          <meshBasicMaterial color={b.bbColor} />
        </mesh>
      )}
    </group>
  );
}
