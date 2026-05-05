import { Canvas } from '@react-three/fiber';
import { Avatar } from '../scene/Avatar';
import { DEFAULT_APPEARANCE, type AvatarAppearance } from '../data/skins';

type Props = {
  appearance?: AvatarAppearance;
  height?: number;
};

export function AvatarPortrait({ appearance = DEFAULT_APPEARANCE, height = 130 }: Props) {
  return (
    <div style={{ width: '100%', height, background: '#0b0f1c', flexShrink: 0 }}>
      <Canvas camera={{ position: [0, 0.28, 1.65], fov: 44 }} gl={{ antialias: true }}>
        <color attach="background" args={['#0b0f1c']} />
        <ambientLight intensity={0.8} color="#ffeedd" />
        <directionalLight position={[1, 3, 2]} intensity={1.4} />
        <directionalLight position={[-0.5, 1, -1]} intensity={0.22} color="#aabbff" />
        <group position={[0, -1.22, 0]}>
          <Avatar
            position={[0, 0, 0]}
            rotationY={0}
            color={appearance.bodyColor}
            skinColor={appearance.skinTone}
            hairColor={appearance.hairColor}
            eyeColor={appearance.eyeColor}
            chairColor={appearance.chairColor}
          />
        </group>
      </Canvas>
    </div>
  );
}
