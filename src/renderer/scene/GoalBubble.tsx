import { Billboard, Html } from '@react-three/drei';
import { useEffect, useState } from 'react';

type Props = {
  /** Avatar root world position. */
  position: [number, number, number];
  /** Goal text. Bubble hides if empty. */
  goal: string;
  /** Tint color — typically the speaker's body color. */
  color: string;
  /** When in ms the goal was first available. Bubble auto-hides after duration. */
  startedAt: number;
  /** Auto-hide delay in ms. Default 30s. */
  durationMs?: number;
};

const HEAD_OFFSET_Y = 2.85;

export function GoalBubble({ position, goal, color, startedAt, durationMs = 30000 }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!goal) { setVisible(false); return; }
    setVisible(true);
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, durationMs - elapsed);
    const id = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(id);
  }, [goal, startedAt, durationMs]);

  if (!visible || !goal) return null;

  return (
    <Billboard position={[position[0], position[1] + HEAD_OFFSET_Y, position[2]]} follow>
      <Html
        center
        distanceFactor={5.5}
        zIndexRange={[15, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            maxWidth: 220,
            padding: '8px 14px',
            borderRadius: 18,
            background: '#fff8ef',
            border: `2px solid ${color}`,
            boxShadow: `0 6px 22px ${color}44, 0 0 0 1px rgba(0,0,0,0.06)`,
            color: '#1a1a25',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: 13,
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: 1.3,
            animation: 'goal-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {goal}
          <div
            style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `8px solid ${color}`,
            }}
          />
        </div>
        <style>{`@keyframes goal-pop{0%{transform:translateY(10px) scale(0.6);opacity:0}70%{transform:translateY(-3px) scale(1.06);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}`}</style>
      </Html>
    </Billboard>
  );
}
