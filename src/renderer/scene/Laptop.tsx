import { RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

type Props = {
  position: [number, number, number];
  rotationY?: number;
  stream: MediaStream | null;
  paused?: boolean;
  label?: string;
  onDoubleClick?: () => void;
};

export function Laptop({ position, rotationY = 0, stream, paused, label, onDoubleClick }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const texture = useMemo(() => {
    const v = document.createElement('video');
    v.autoplay = true;
    v.muted = true;
    v.playsInline = true;
    videoRef.current = v;
    const t = new THREE.VideoTexture(v);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stream && !paused) {
      v.srcObject = stream;
      v.play().catch(() => {});
    } else {
      v.srcObject = null;
    }
  }, [stream, paused]);

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onDoubleClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onDoubleClick?.();
      }}
    >
      <RoundedBox args={[1.24, 0.08, 0.86]} radius={0.07} smoothness={4} position={[0, 0.84, 0]} castShadow receiveShadow>
        <meshToonMaterial color="#f7f4ef" />
      </RoundedBox>
      <RoundedBox args={[1.12, 0.03, 0.7]} radius={0.04} smoothness={3} position={[0, 0.88, 0.02]} castShadow>
        <meshToonMaterial color="#d7d2ca" />
      </RoundedBox>
      <group position={[0, 1.25, -0.35]} rotation={[-0.25, 0, 0]}>
        <RoundedBox args={[1.2, 0.84, 0.06]} radius={0.07} smoothness={4} castShadow>
          <meshToonMaterial color="#f7f4ef" />
        </RoundedBox>
        <RoundedBox args={[1.04, 0.66, 0.02]} radius={0.03} smoothness={3} position={[0, 0, 0.03]}>
          <meshToonMaterial color="#243142" />
        </RoundedBox>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.1, 0.7]} />
          {paused ? (
            <meshBasicMaterial color="#5e6a7b" />
          ) : stream ? (
            <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
          ) : (
            <meshBasicMaterial color="#6f84a5" />
          )}
        </mesh>
      </group>
      {label && (
        <group position={[0, 0.98, 0.42]}>
          <RoundedBox args={[0.5, 0.08, 0.2]} radius={0.04} smoothness={3}>
            <meshToonMaterial color="#fff8ef" />
          </RoundedBox>
          <mesh position={[0, 0.001, 0.11]}>
            <planeGeometry args={[0.34, 0.08]} />
            <meshBasicMaterial color={label === 'you' ? '#76a9f3' : '#f2a06f'} transparent opacity={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}
