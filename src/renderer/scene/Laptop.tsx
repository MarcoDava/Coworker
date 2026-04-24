import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

type Props = {
  position: [number, number, number];
  rotationY?: number;
  stream: MediaStream | null;
  paused?: boolean;
  label?: string;
};

export function Laptop({ position, rotationY = 0, stream, paused, label }: Props) {
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
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* desk */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.1, 1.2]} />
        <meshStandardMaterial color="#6a4a2a" />
      </mesh>
      {/* laptop base */}
      <mesh position={[0, 0.83, 0]}>
        <boxGeometry args={[1.2, 0.05, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* laptop screen */}
      <group position={[0, 1.25, -0.35]} rotation={[-0.25, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.8, 0.04]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[1.1, 0.7]} />
          {paused ? (
            <meshBasicMaterial color="#222233" />
          ) : stream ? (
            <meshBasicMaterial map={texture} toneMapped={false} />
          ) : (
            <meshBasicMaterial color="#101018" />
          )}
        </mesh>
      </group>
      {label && (
        <mesh position={[0, 1.9, -0.35]}>
          <planeGeometry args={[0.8, 0.15]} />
          <meshBasicMaterial color="#eeeeee" transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  );
}
