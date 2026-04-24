import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';

export type CameraMode = 'overhead' | 'firstPerson';

type Props = {
  mode: CameraMode;
  peeking: boolean;
  /** world-space position of the player's seat/laptop anchor (y=0) */
  selfAnchor: [number, number, number];
  peerAnchor: [number, number, number];
};

// Both modes share these laptop-relative constants.
const SCREEN_HEIGHT = 1.25;   // Laptop screen center y
const SCREEN_Z_BIAS = -0.35;  // screen is slightly behind the laptop anchor
const HEAD_HEIGHT = 1.75;     // seated eye height
const HEAD_Z_BIAS = 0.8;      // head sits in front of the desk (toward +z viewer)

// Overhead: camera hovers above+behind the head and angles down to the screen.
const OVERHEAD_OFFSET = new THREE.Vector3(0, 2.4, 1.4);

function screenPos(anchor: [number, number, number]) {
  return new THREE.Vector3(anchor[0], SCREEN_HEIGHT, anchor[2] + SCREEN_Z_BIAS);
}
function headPos(anchor: [number, number, number]) {
  return new THREE.Vector3(anchor[0], HEAD_HEIGHT, anchor[2] + HEAD_Z_BIAS);
}

export function CameraRig({ mode, peeking, selfAnchor, peerAnchor }: Props) {
  const { camera } = useThree();
  const goalPos = useRef(new THREE.Vector3());
  const goalLook = useRef(new THREE.Vector3());
  const currentDir = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    if (mode === 'firstPerson') {
      // Camera stays locked at our head; only the look target rotates.
      goalPos.current.copy(headPos(selfAnchor));
      goalLook.current.copy(screenPos(peeking ? peerAnchor : selfAnchor));
    } else {
      // Overhead: camera follows the active laptop (own or peer when peeking).
      const activeAnchor = peeking ? peerAnchor : selfAnchor;
      goalPos.current.set(
        activeAnchor[0] + OVERHEAD_OFFSET.x,
        activeAnchor[1] + OVERHEAD_OFFSET.y,
        activeAnchor[2] + OVERHEAD_OFFSET.z,
      );
      goalLook.current.copy(screenPos(activeAnchor));
    }

    // Position: instant in FP, smooth in overhead.
    if (mode === 'firstPerson') {
      camera.position.copy(goalPos.current);
    } else {
      camera.position.lerp(goalPos.current, Math.min(1, dt * 4));
    }

    // Look: smooth rotation in both modes so peeks feel like a head turn.
    camera.getWorldDirection(currentDir.current);
    const desiredDir = goalLook.current.clone().sub(camera.position).normalize();
    const turnSpeed = mode === 'firstPerson' ? 6 : 5;
    const blended = currentDir.current.lerp(desiredDir, Math.min(1, dt * turnSpeed)).normalize();
    camera.lookAt(camera.position.clone().add(blended));
  });
  return null;
}
