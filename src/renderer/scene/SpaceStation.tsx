import { Environment } from '@react-three/drei';
import * as THREE from 'three';

// Option A: Brutalist Military
const P = {
  floor:  '#7a8898',  fGrid: '#60707f',
  wall:   '#6a7480',  wallP: '#78838f',
  ceil:   '#585f6a',  beam:  '#626e7a',
  metal:  '#808c9a',  metD:  '#5a6470',
  chair:  '#5a6270',  pad:   '#6a7280',
  scBG:   '#040c1a',  scGl:  '#4488ee',
  cons:   '#5e6878',
  acc1:   '#60c8f0',  acc2:  '#ff4444',  acc3: '#55ee88',
  trim:   '#50a8d0',  cove:  '#4488cc',
} as const;

// Shared materials — one instance per visual style, reused across all meshes
const M = {
  floor:   new THREE.MeshStandardMaterial({ color: P.floor,  roughness: 0.85, metalness: 0.35 }),
  fGrid:   new THREE.MeshStandardMaterial({ color: P.fGrid,  roughness: 1,    metalness: 0    }),
  metD:    new THREE.MeshStandardMaterial({ color: P.metD,   roughness: 0.7,  metalness: 0.45 }),
  wall:    new THREE.MeshStandardMaterial({ color: P.wall,   roughness: 0.88, metalness: 0.2  }),
  ceil:    new THREE.MeshStandardMaterial({ color: P.ceil,   roughness: 0.9,  metalness: 0.1  }),
  beam:    new THREE.MeshStandardMaterial({ color: P.beam,   roughness: 0.6,  metalness: 0.6  }),
  wallP:   new THREE.MeshStandardMaterial({ color: P.wallP,  roughness: 0.7,  metalness: 0.35 }),
  metal:   new THREE.MeshStandardMaterial({ color: P.metal,  roughness: 0.4,  metalness: 0.82 }),
  metDFr:  new THREE.MeshStandardMaterial({ color: P.metD,   roughness: 0.5,  metalness: 0.8  }),
  metDDr:  new THREE.MeshStandardMaterial({ color: P.metD,   roughness: 0.3,  metalness: 0.88 }),
  metalDr: new THREE.MeshStandardMaterial({ color: P.metal,  roughness: 0.2,  metalness: 0.92 }),
  metDRl:  new THREE.MeshStandardMaterial({ color: P.metD,   roughness: 0.5,  metalness: 0.9  }),
  chair:   new THREE.MeshStandardMaterial({ color: P.chair,  roughness: 0.5,  metalness: 0.65 }),
  pad:     new THREE.MeshStandardMaterial({ color: P.pad,    roughness: 0.8,  metalness: 0.12 }),
  cons:    new THREE.MeshStandardMaterial({ color: P.cons,   roughness: 0.45, metalness: 0.7  }),
  consT:   new THREE.MeshStandardMaterial({ color: P.cons,   roughness: 0.4,  metalness: 0.7  }),
  consA:   new THREE.MeshStandardMaterial({ color: P.cons,   roughness: 0.5,  metalness: 0.6  }),
  trim:    new THREE.MeshStandardMaterial({ color: P.trim, emissive: new THREE.Color(P.trim), emissiveIntensity: 0.6,  roughness: 0.5, metalness: 0.2 }),
  trimR:   new THREE.MeshStandardMaterial({ color: P.trim, emissive: new THREE.Color(P.trim), emissiveIntensity: 0.35, roughness: 0.5, metalness: 0.2 }),
  trimS:   new THREE.MeshStandardMaterial({ color: P.trim, emissive: new THREE.Color(P.trim), emissiveIntensity: 0.5,  roughness: 0.5, metalness: 0.2 }),
  acc1F:   new THREE.MeshStandardMaterial({ color: P.acc1, emissive: new THREE.Color(P.acc1), emissiveIntensity: 0.3,  roughness: 0.5, metalness: 0.2 }),
  cove:    new THREE.MeshStandardMaterial({ color: P.cove, emissive: new THREE.Color(P.cove), emissiveIntensity: 0.8,  roughness: 0.5, metalness: 0.2 }),
  scr:     new THREE.MeshStandardMaterial({ color: P.scBG, emissive: new THREE.Color(P.scGl), emissiveIntensity: 0.8,  roughness: 0.5, metalness: 0.2 }),
  scrD:    new THREE.MeshStandardMaterial({ color: P.scBG, emissive: new THREE.Color(P.scGl), emissiveIntensity: 0.55, roughness: 0.5, metalness: 0.2 }),
  scrA:    new THREE.MeshStandardMaterial({ color: P.scBG, emissive: new THREE.Color(P.scGl), emissiveIntensity: 0.5,  roughness: 0.5, metalness: 0.2 }),
  sub:     new THREE.MeshStandardMaterial({ color: '#001020', emissive: new THREE.Color('#002a5a'), emissiveIntensity: 0.7, roughness: 0.5, metalness: 0.2 }),
  acc1I:   new THREE.MeshStandardMaterial({ color: P.acc1, emissive: new THREE.Color(P.acc1), emissiveIntensity: 1.1,  roughness: 0.5, metalness: 0.2 }),
  acc2I:   new THREE.MeshStandardMaterial({ color: P.acc2, emissive: new THREE.Color(P.acc2), emissiveIntensity: 1.2,  roughness: 0.5, metalness: 0.2 }),
  plq:     new THREE.MeshStandardMaterial({ color: P.metal, roughness: 0.3, metalness: 0.85 }),
  plqL:    new THREE.MeshStandardMaterial({ color: P.acc1, emissive: new THREE.Color(P.acc1), emissiveIntensity: 0.95, roughness: 0.5, metalness: 0.2 }),
};

// Button materials indexed [acc1, acc2, acc3] at different intensities
const BTN85 = [
  new THREE.MeshStandardMaterial({ color: P.acc1, emissive: new THREE.Color(P.acc1), emissiveIntensity: 0.85, roughness: 0.5, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: P.acc2, emissive: new THREE.Color(P.acc2), emissiveIntensity: 0.85, roughness: 0.5, metalness: 0.2 }),
];
const BTN90 = [
  new THREE.MeshStandardMaterial({ color: P.acc1, emissive: new THREE.Color(P.acc1), emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: P.acc2, emissive: new THREE.Color(P.acc2), emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: P.acc3, emissive: new THREE.Color(P.acc3), emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.2 }),
];
const BTN100 = [
  new THREE.MeshStandardMaterial({ color: P.acc1, emissive: new THREE.Color(P.acc1), emissiveIntensity: 1.0, roughness: 0.5, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: P.acc2, emissive: new THREE.Color(P.acc2), emissiveIntensity: 1.0, roughness: 0.5, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: P.acc3, emissive: new THREE.Color(P.acc3), emissiveIntensity: 1.0, roughness: 0.5, metalness: 0.2 }),
];
const PNL75 = [
  new THREE.MeshStandardMaterial({ color: P.acc1, emissive: new THREE.Color(P.acc1), emissiveIntensity: 0.75, roughness: 0.5, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: P.acc2, emissive: new THREE.Color(P.acc2), emissiveIntensity: 0.75, roughness: 0.5, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: P.acc3, emissive: new THREE.Color(P.acc3), emissiveIntensity: 0.75, roughness: 0.5, metalness: 0.2 }),
];
const AFT60 = [
  new THREE.MeshStandardMaterial({ color: P.acc1, emissive: new THREE.Color(P.acc1), emissiveIntensity: 0.6, roughness: 0.5, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: P.acc2, emissive: new THREE.Color(P.acc2), emissiveIntensity: 0.6, roughness: 0.5, metalness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: P.acc3, emissive: new THREE.Color(P.acc3), emissiveIntensity: 0.6, roughness: 0.5, metalness: 0.2 }),
];

// Shared geometry for repeated small buttons
const BTN_GEO_09 = new THREE.BoxGeometry(0.09, 0.035, 0.09);
const BTN_GEO_07 = new THREE.BoxGeometry(0.07, 0.032, 0.07);
const BTN_GEO_08 = new THREE.BoxGeometry(0.08, 0.035, 0.08);
const BTN_GEO_PL = new THREE.BoxGeometry(0.045, 0.09, 0.09);
const BTN_GEO_AF = new THREE.BoxGeometry(0.19, 0.045, 0.05);

function Floor() {
  const xLines = Array.from({ length: 8 }, (_, k) => -7 + k * 2);
  const zLines = Array.from({ length: 6 }, (_, k) => -5 + k * 2);
  return (
    <group>
      <mesh position={[0, -0.07, 0]} material={M.floor} receiveShadow>
        <boxGeometry args={[16, 0.14, 12]} />
      </mesh>
      {xLines.map((gx) => (
        <mesh key={gx} position={[gx, 0.01, 0]} material={M.fGrid}>
          <boxGeometry args={[0.05, 0.01, 12]} />
        </mesh>
      ))}
      {zLines.map((gz) => (
        <mesh key={gz} position={[0, 0.01, gz]} material={M.fGrid}>
          <boxGeometry args={[16, 0.01, 0.05]} />
        </mesh>
      ))}
      <mesh position={[0, 0.065, 1.3]} material={M.metD} receiveShadow>
        <boxGeometry args={[16, 0.13, 5.2]} />
      </mesh>
      <mesh position={[0, 0.14, -1.28]} material={M.trim}>
        <boxGeometry args={[16, 0.035, 0.05]} />
      </mesh>
      <mesh position={[-6.55, 0.01, -1.0]} material={M.acc1F}>
        <boxGeometry args={[0.04, 0.02, 9.8]} />
      </mesh>
      <mesh position={[6.55, 0.01, -1.0]} material={M.acc1F}>
        <boxGeometry args={[0.04, 0.02, 9.8]} />
      </mesh>
    </group>
  );
}

function Walls() {
  const beamXs = [-6, -3, 0, 3, 6];
  const beamZs = [-4, -2, 0, 2];
  return (
    <group>
      <mesh position={[0, 3.5, -6.05]} material={M.wall} receiveShadow>
        <boxGeometry args={[16, 7.2, 0.28]} />
      </mesh>
      <mesh position={[-7.22, 3.5, 0]} material={M.wall} receiveShadow>
        <boxGeometry args={[0.28, 7.2, 12]} />
      </mesh>
      <mesh position={[7.22, 3.5, 0]} material={M.wall} receiveShadow>
        <boxGeometry args={[0.28, 7.2, 12]} />
      </mesh>
      <mesh position={[0, 3.5, 2.55]} material={M.wall} receiveShadow>
        <boxGeometry args={[16, 7.2, 0.28]} />
      </mesh>
      <mesh position={[0, 6.16, 0]} material={M.ceil}>
        <boxGeometry args={[16, 0.22, 12]} />
      </mesh>
      {beamXs.map((bx) => (
        <mesh key={`bv${bx}`} position={[bx, 3, 0]} material={M.beam} castShadow>
          <boxGeometry args={[0.2, 6, 0.2]} />
        </mesh>
      ))}
      {beamZs.map((bz) => (
        <mesh key={`bh${bz}`} position={[0, 5.82, bz]} material={M.beam}>
          <boxGeometry args={[16, 0.15, 0.15]} />
        </mesh>
      ))}
      <mesh position={[0, 5.97, -4.4]} material={M.cove}>
        <boxGeometry args={[13.5, 0.05, 0.08]} />
      </mesh>
      <mesh position={[0, 5.97, 0.6]} material={M.cove}>
        <boxGeometry args={[13.5, 0.05, 0.08]} />
      </mesh>
      <pointLight color={P.cove} intensity={2.5} position={[0, 5.85, -4.4]} distance={20} decay={2} />
      <pointLight color={P.cove} intensity={2.5} position={[0, 5.85, 0.6]} distance={20} decay={2} />
    </group>
  );
}

function Viewscreen() {
  const subPanels: JSX.Element[] = [];
  for (let si = 0; si < 3; si++) {
    for (let sj = 0; sj < 2; sj++) {
      subPanels.push(
        <mesh key={`sp${si}${sj}`} position={[-2.9 + si * 2.9, 2.25 + sj * 2.12, -5.8]} material={M.sub}>
          <boxGeometry args={[2.9, 2.12, 0.05]} />
        </mesh>
      );
    }
  }
  return (
    <group>
      <mesh position={[0, 4.2, -5.87]} material={M.scr}>
        <boxGeometry args={[9.1, 4.6, 0.12]} />
      </mesh>
      <mesh position={[0, 6.62, -5.87]} material={M.metDFr}>
        <boxGeometry args={[9.5, 0.22, 0.18]} />
      </mesh>
      <mesh position={[0, 1.88, -5.87]} material={M.metDFr}>
        <boxGeometry args={[9.5, 0.22, 0.18]} />
      </mesh>
      <mesh position={[-4.61, 4.25, -5.87]} material={M.metDFr}>
        <boxGeometry args={[0.22, 4.96, 0.18]} />
      </mesh>
      <mesh position={[4.61, 4.25, -5.87]} material={M.metDFr}>
        <boxGeometry args={[0.22, 4.96, 0.18]} />
      </mesh>
      {subPanels}
      <pointLight color={P.scGl} intensity={4.0} position={[0, 4.2, -4.6]} distance={16} decay={2} />
    </group>
  );
}

function Chair({ cx, cy, cz, captain }: { cx: number; cy: number; cz: number; captain: boolean }) {
  const s = captain ? 1.0 : 0.8;
  return (
    <group>
      <mesh position={[cx, cy + 0.07 * s, cz]} material={M.chair} castShadow>
        <cylinderGeometry args={[0.56 * s, 0.62 * s, 0.14, 16]} />
      </mesh>
      <mesh position={[cx, cy + 0.34 * s, cz]} material={M.chair} castShadow>
        <cylinderGeometry args={[0.07 * s, 0.07 * s, 0.44 * s, 8]} />
      </mesh>
      <mesh position={[cx, cy + 0.64 * s, cz]} material={M.pad} castShadow>
        <boxGeometry args={[0.88 * s, 0.13 * s, 0.82 * s]} />
      </mesh>
      <mesh position={[cx, cy + 1.12 * s, cz + 0.36 * s]} material={M.pad} castShadow>
        <boxGeometry args={[0.86 * s, 0.86 * s, 0.1 * s]} />
      </mesh>
      <mesh position={[cx - 0.5 * s, cy + 0.73 * s, cz]} material={M.chair}>
        <boxGeometry args={[0.13 * s, 0.06 * s, 0.68 * s]} />
      </mesh>
      <mesh position={[cx + 0.5 * s, cy + 0.73 * s, cz]} material={M.chair}>
        <boxGeometry args={[0.13 * s, 0.06 * s, 0.68 * s]} />
      </mesh>
      {captain && ([0, 1, 2] as const).map((i) => (
        <group key={i}>
          <mesh position={[cx - 0.5 + i * 0.07, cy + 0.8, cz + 0.06]} geometry={BTN_GEO_07} material={BTN90[i]} />
          <mesh position={[cx + 0.5 - i * 0.07, cy + 0.8, cz + 0.06]} geometry={BTN_GEO_07} material={BTN90[i]} />
        </group>
      ))}
    </group>
  );
}

function ForwardConsole() {
  const sections = [
    { sx: -2, sz: -3.8, ry:  0.18 },
    { sx:  0, sz: -3.5, ry:  0    },
    { sx:  2, sz: -3.8, ry: -0.18 },
  ];
  return (
    <group>
      {sections.map(({ sx, sz, ry }, idx) => (
        <group key={idx}>
          <mesh position={[sx, 0.44, sz]} rotation={[0, ry, 0]} material={M.cons} castShadow receiveShadow>
            <boxGeometry args={[1.6, 0.88, 0.72]} />
          </mesh>
          <mesh position={[sx, 0.9, sz - 0.04]} rotation={[0.28, ry, 0]} material={M.scrD}>
            <boxGeometry args={[1.35, 0.04, 0.52]} />
          </mesh>
          {([-2, -1, 0, 1, 2] as const).map((bxi) => (
            <mesh key={bxi} position={[sx + bxi * 0.18, 0.9, sz - 0.14]} geometry={BTN_GEO_09} material={BTN85[bxi % 2 === 0 ? 0 : 1]} />
          ))}
        </group>
      ))}
      <mesh position={[0, 0.04, -3.38]} material={M.trimS}>
        <boxGeometry args={[5.4, 0.03, 0.05]} />
      </mesh>
      <pointLight color={P.acc1} intensity={2.5} position={[-2.5, 5.6, -3.5]} distance={8} decay={2} />
      <pointLight color={P.acc1} intensity={2.5} position={[2.5, 5.6, -3.5]} distance={8} decay={2} />
    </group>
  );
}

function CommandRail() {
  const ry = 0.97;
  const posts: [number, number, number][] = [
    [-2.5, ry / 2, -2.1], [2.5, ry / 2, -2.1],
    [-2.5, ry / 2, 0.18], [2.5, ry / 2, 0.18],
  ];
  return (
    <group>
      <mesh position={[0, ry, -2.1]} material={M.metal}>
        <boxGeometry args={[5.3, 0.065, 0.065]} />
      </mesh>
      <mesh position={[0, ry, 0.18]} material={M.metal}>
        <boxGeometry args={[5.3, 0.065, 0.065]} />
      </mesh>
      <mesh position={[-2.5, ry, -0.96]} material={M.metal}>
        <boxGeometry args={[0.065, 0.065, 2.4]} />
      </mesh>
      <mesh position={[2.5, ry, -0.96]} material={M.metal}>
        <boxGeometry args={[0.065, 0.065, 2.4]} />
      </mesh>
      <mesh position={[0, ry + 0.045, -2.1]} material={M.trimR}>
        <boxGeometry args={[5.3, 0.02, 0.026]} />
      </mesh>
      {posts.map(([px, py, pz], i) => (
        <mesh key={i} position={[px, py, pz]} material={M.metDRl}>
          <boxGeometry args={[0.065, ry, 0.065]} />
        </mesh>
      ))}
    </group>
  );
}

function TacticalConsole() {
  const platY = 0.13;
  const sections = [
    { sx: -1.2, sy: 0.53, sz: 0.72, sry:  0.28 },
    { sx:  0,   sy: 0.53, sz: 0.58, sry:  0    },
    { sx:  1.2, sy: 0.53, sz: 0.72, sry: -0.28 },
  ];
  return (
    <group>
      {sections.map(({ sx, sy, sz, sry }, idx) => (
        <group key={idx}>
          <mesh position={[sx, sy + platY, sz]} rotation={[0, sry, 0]} material={M.consT} castShadow>
            <boxGeometry args={[1.0, 0.94, 0.62]} />
          </mesh>
          <mesh position={[sx, sy + 0.95 + platY, sz - 0.03]} rotation={[0.33, sry, 0]} material={M.scrD}>
            <boxGeometry args={[0.85, 0.04, 0.46]} />
          </mesh>
          <mesh position={[sx, sy + 0.97 + platY, sz + 0.12]} material={M.acc2I}>
            <boxGeometry args={[0.05, 0.05, 0.05]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function AftStations() {
  const platY = 0.13;
  const bxOffsets = [-0.35, -0.15, 0.05, 0.25, 0.45];
  return (
    <group>
      {([-2.4, 0, 2.4] as const).map((ax) => (
        <group key={ax}>
          <mesh position={[ax, 0.69 + platY, 1.65]} material={M.consA} castShadow receiveShadow>
            <boxGeometry args={[1.4, 1.12, 0.52]} />
          </mesh>
          <mesh position={[ax, 1.04 + platY, 1.42]} rotation={[0.2, 0, 0]} material={M.scrA}>
            <boxGeometry args={[1.2, 0.82, 0.05]} />
          </mesh>
          {bxOffsets.map((bx, i) => (
            <mesh key={i} position={[ax + bx, 1.48 + platY, 1.43]} geometry={BTN_GEO_08} material={BTN100[i % 3]} />
          ))}
        </group>
      ))}
    </group>
  );
}

function TurboliftDoors() {
  return (
    <group>
      {([-3.2, 3.2] as const).map((dx) => (
        <group key={dx}>
          <mesh position={[dx, 1.225, 2.38]} material={M.metDDr} castShadow>
            <boxGeometry args={[1.45, 2.45, 0.24]} />
          </mesh>
          <mesh position={[dx - 0.33, 1.225, 2.32]} material={M.metalDr}>
            <boxGeometry args={[0.62, 2.22, 0.09]} />
          </mesh>
          <mesh position={[dx + 0.33, 1.225, 2.32]} material={M.metalDr}>
            <boxGeometry args={[0.62, 2.22, 0.09]} />
          </mesh>
          <mesh position={[dx, 2.6, 2.36]} material={M.acc1I}>
            <boxGeometry args={[0.13, 0.065, 0.065]} />
          </mesh>
          <pointLight color={P.acc1} intensity={1.0} position={[dx, 2.65, 2.32]} distance={2.5} decay={2} />
        </group>
      ))}
    </group>
  );
}

function WallPanels() {
  const leftWPs:  [number, number, number][] = [[-6.88, 2.2, -3.5], [-6.88, 2.2, -1.0], [-6.88, 2.2, 1.5]];
  const rightWPs: [number, number, number][] = [[ 6.88, 2.2, -3.5], [ 6.88, 2.2, -1.0], [ 6.88, 2.2, 1.5]];
  const aftWPs:   [number, number, number][] = [[-2.5, 2.85, 2.42], [0, 2.85, 2.42], [2.5, 2.85, 2.42]];

  return (
    <group>
      {leftWPs.map((wp, wi) => (
        <group key={`l${wi}`}>
          <mesh position={wp} material={M.wallP}>
            <boxGeometry args={[0.13, 1.85, 1.45]} />
          </mesh>
          {Array.from({ length: 3 }, (_, py) =>
            Array.from({ length: 4 }, (_, pz) => (
              <mesh key={`${py}${pz}`} position={[wp[0] + 0.08, wp[1] - 0.6 + py * 0.46, wp[2] - 0.52 + pz * 0.34]} geometry={BTN_GEO_PL} material={PNL75[(py + pz) % 3]} />
            ))
          ).flat()}
        </group>
      ))}
      {rightWPs.map((wp, wi) => (
        <group key={`r${wi}`}>
          <mesh position={wp} material={M.wallP}>
            <boxGeometry args={[0.13, 1.85, 1.45]} />
          </mesh>
          {Array.from({ length: 3 }, (_, py) =>
            Array.from({ length: 4 }, (_, pz) => (
              <mesh key={`${py}${pz}`} position={[wp[0] - 0.08, wp[1] - 0.6 + py * 0.46, wp[2] - 0.52 + pz * 0.34]} geometry={BTN_GEO_PL} material={PNL75[(py + pz) % 3]} />
            ))
          ).flat()}
        </group>
      ))}
      {aftWPs.map((ap, ai) => (
        <group key={`a${ai}`}>
          <mesh position={ap} material={M.wallP}>
            <boxGeometry args={[1.65, 0.72, 0.11]} />
          </mesh>
          {Array.from({ length: 5 }, (_, pi) => (
            <mesh key={pi} position={[ap[0] - 0.4 + pi * 0.2, ap[1] + 0.12, ap[2] + 0.1]} geometry={BTN_GEO_AF} material={AFT60[pi % 3]} />
          ))}
        </group>
      ))}
    </group>
  );
}

function DedicationPlaque() {
  return (
    <group>
      <mesh position={[-6.58, 3.8, -2.0]} material={M.plq}>
        <boxGeometry args={[1.22, 0.42, 0.07]} />
      </mesh>
      <mesh position={[-6.58, 3.90, -1.97]} material={M.plqL}>
        <boxGeometry args={[0.92, 0.042, 0.04]} />
      </mesh>
      <mesh position={[-6.58, 3.78, -1.97]} material={M.plqL}>
        <boxGeometry args={[0.72, 0.042, 0.04]} />
      </mesh>
      <mesh position={[-6.58, 3.66, -1.97]} material={M.plqL}>
        <boxGeometry args={[0.52, 0.042, 0.04]} />
      </mesh>
      <pointLight color={P.acc1} intensity={1.2} position={[-6.2, 3.82, -1.82]} distance={2.0} decay={2} />
    </group>
  );
}

const FILL_POS: [number, number, number][] = [
  [0, 5.5, -4.0], [0, 5.5, 0.5], [-4, 5.5, -2.0], [4, 5.5, -2.0], [0, 5.5, -1.5],
];

export function SpaceStation() {
  return (
    <>
      <color attach="background" args={['#07090e']} />
      <fogExp2 attach="fog" args={['#07090e', 0.038]} />
      <Environment preset="night" />

      <ambientLight intensity={1.8} color="#8898aa" />
      <directionalLight
        position={[3, 9, 5]}
        intensity={1.2}
        color="#d8e8f0"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-4, 3, 9]} intensity={0.42} color="#d8e8f0" />

      {FILL_POS.map(([x, y, z], i) => (
        <pointLight key={i} color="#c8d8e8" intensity={4.0} position={[x, y, z]} distance={14} decay={1.5} />
      ))}

      <Floor />
      <Walls />
      <Viewscreen />
      <Chair cx={0} cy={0} cz={-1} captain />
      <Chair cx={-1.35} cy={0} cz={-0.88} captain={false} />
      <Chair cx={1.35} cy={0} cz={-0.88} captain={false} />
      <ForwardConsole />
      <CommandRail />
      <TacticalConsole />
      <AftStations />
      <TurboliftDoors />
      <WallPanels />
      <DedicationPlaque />
    </>
  );
}
