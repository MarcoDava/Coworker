import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import { useRef } from 'react';

export type CameraMode = 'overhead' | 'firstPerson';

type Props = {
  mode: CameraMode;
  peeking: boolean;
  /** world-space position of the player's seat/laptop anchor (y=0) */
  selfAnchor: [number, number, number];
  peerAnchor: [number, number, number];
  freeLookRef?: MutableRefObject<{ enabled: boolean; yaw: number; pitch: number }>;
};

// Both modes share these laptop-relative constants.
const SCREEN_HEIGHT = 1.24;
const SCREEN_Z_BIAS = -0.35;
const HEAD_HEIGHT = 1.52;
const HEAD_Z_BIAS = 1.08;

// Overhead: camera hovers above+behind the head and angles down to the screen.
const OVERHEAD_OFFSET = new THREE.Vector3(0, 2.4, 2.6);

function screenPos(anchor: [number, number, number]) {
  return new THREE.Vector3(anchor[0], SCREEN_HEIGHT, anchor[2] + SCREEN_Z_BIAS);
}
function headPos(anchor: [number, number, number]) {
  return new THREE.Vector3(anchor[0], HEAD_HEIGHT, anchor[2] + HEAD_Z_BIAS);
}

export function CameraRig({ mode, peeking, selfAnchor, peerAnchor, freeLookRef }: Props) {
  const { camera } = useThree();
  const goalPos = useRef(new THREE.Vector3());
  const goalLook = useRef(new THREE.Vector3());
  const currentDir = useRef(new THREE.Vector3());
  const rightAxis = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    if (mode === 'firstPerson') {
      goalPos.current.copy(headPos(selfAnchor));
      goalLook.current.copy(screenPos(peeking ? peerAnchor : selfAnchor));
    } else {
      const activeAnchor = peeking ? peerAnchor : selfAnchor;
      goalPos.current.set(
        activeAnchor[0] + OVERHEAD_OFFSET.x,
        activeAnchor[1] + OVERHEAD_OFFSET.y,
        activeAnchor[2] + OVERHEAD_OFFSET.z,
      );
      goalLook.current.copy(screenPos(activeAnchor));
    }

    if (mode === 'firstPerson') {
      camera.position.copy(goalPos.current);
    } else {
      camera.position.lerp(goalPos.current, Math.min(1, dt * 3.2));
    }

    camera.getWorldDirection(currentDir.current);
    const desiredDir = goalLook.current.clone().sub(camera.position).normalize();
    if (mode === 'firstPerson' && freeLookRef?.current.enabled) {
      const worldUp = new THREE.Vector3(0, 1, 0);
      desiredDir.applyAxisAngle(worldUp, freeLookRef.current.yaw);
      rightAxis.current.crossVectors(desiredDir, worldUp).normalize();
      desiredDir.applyAxisAngle(rightAxis.current, freeLookRef.current.pitch);
    }
    const turnSpeed = mode === 'firstPerson' ? 5.5 : 4.2;
    const blended = currentDir.current.lerp(desiredDir, Math.min(1, dt * turnSpeed)).normalize();
    camera.lookAt(camera.position.clone().add(blended));
  });
  return null;
}
