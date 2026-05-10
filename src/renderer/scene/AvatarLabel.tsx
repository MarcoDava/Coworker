import { Billboard, Html } from '@react-three/drei';

type Props = {
  /** World position of the avatar root. Label floats above the head. */
  position: [number, number, number];
  name: string;
  /** Body color — used to tint the pill border so player identity reads at a glance. */
  color: string;
  /** Short status hint shown below the name (e.g., "typing", "idle", "paused"). */
  status?: string;
};

const HEAD_OFFSET_Y = 2.05;

export function AvatarLabel({ position, name, color, status }: Props) {
  return (
    <Billboard position={[position[0], position[1] + HEAD_OFFSET_Y, position[2]]} follow>
      <Html
        center
        distanceFactor={6}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(18, 22, 32, 0.78)',
            border: `1.5px solid ${color}`,
            boxShadow: `0 0 12px ${color}55`,
            color: '#fff',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontWeight: 600 }}>{name}</span>
          {status && (
            <span style={{ fontSize: 9, opacity: 0.7, color }}>{status}</span>
          )}
        </div>
      </Html>
    </Billboard>
  );
}
