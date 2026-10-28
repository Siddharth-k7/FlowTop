import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment } from '@react-three/drei';
import { TapModel } from './TapModel';
import { CAMERA_CONFIG } from './hero-3d.config';

interface Hero3DCanvasProps {
  scrollProgress?: number;
}

// Camera Lerp Controller for Scroll Progress (Phase E.4)
const CameraScrollRig: React.FC<{ scrollProgress: number }> = ({ scrollProgress }) => {
  const currentAngle = useRef(0);
  const currentDistance = useRef(3.8);
  const currentY = useRef(0.9);

  useFrame((state, delta) => {
    // Clamp scroll progress between 0 and 1
    const clampedProgress = Math.min(1, Math.max(0, scrollProgress));

    // Target parameters from Phase E.4:
    // Orbit 40° right (+0.70 rad), pull back 15% (3.8 * 1.15 = 4.37), lower 5% (0.9 - 0.05 = 0.85)
    const targetAngle = clampedProgress * CAMERA_CONFIG.scrollOrbitAngleMax;
    const targetDistance = 3.8 * (1 + clampedProgress * CAMERA_CONFIG.scrollPullbackMultiplier);
    const targetY = 0.9 - clampedProgress * CAMERA_CONFIG.scrollLowerOffset;

    // Smoothly lerp camera coordinates using delta
    const lerpSpeed = Math.min(1, delta * 8);
    currentAngle.current = THREE.MathUtils.lerp(currentAngle.current, targetAngle, lerpSpeed);
    currentDistance.current = THREE.MathUtils.lerp(
      currentDistance.current,
      targetDistance,
      lerpSpeed
    );
    currentY.current = THREE.MathUtils.lerp(currentY.current, targetY, lerpSpeed);

    // Calculate orbital X and Z positions
    const x = Math.sin(currentAngle.current) * currentDistance.current;
    const z = Math.cos(currentAngle.current) * currentDistance.current;

    state.camera.position.set(x, currentY.current, z);
    state.camera.lookAt(
      CAMERA_CONFIG.target[0],
      CAMERA_CONFIG.target[1],
      CAMERA_CONFIG.target[2]
    );
  });

  return null;
};

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = ({ scrollProgress = 0 }) => {
  return (
    <div
      className="relative w-full h-full min-h-[300px] sm:min-h-[360px] md:min-h-[440px] flex items-center justify-center select-none"
      aria-hidden="true"
    >
      <Canvas
        shadows
        dpr={[1, 2]} // Performance constraint: never render > 2x
        camera={{
          position: CAMERA_CONFIG.initialPosition,
          fov: CAMERA_CONFIG.fov,
        }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Dynamic Studio Lighting Rig for Crisp Chrome Reflections */}
        {/* 1. Key directional light from upper front-right */}
        <directionalLight
          position={[3.5, 5, 4]}
          intensity={2.6}
          color="#FFFFFF"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />

        {/* 2. Soft lavender fill light from front-left (Flowtop brand ambience) */}
        <directionalLight
          position={[-3.5, 2.5, 3]}
          intensity={1.2}
          color="#F4EEFA"
        />

        {/* 3. Rim/Back light for crisp specular edges on chrome & gold */}
        <directionalLight
          position={[0, 4.5, -4]}
          intensity={3.2}
          color="#FFFFFF"
        />

        {/* 4. Under-fill light for soft bounce illumination */}
        <directionalLight
          position={[0, -2, 2]}
          intensity={0.6}
          color="#E8E4EC"
        />

        {/* 5. Balanced ambient light */}
        <ambientLight intensity={0.7} color="#FAF8FC" />

        {/* Studio HDRI Environment for realistic physical reflections */}
        <Environment preset="city" />

        {/* Animated Tap Model with named sub-meshes */}
        <TapModel scrollProgress={scrollProgress} />

        {/* Contact Shadow directly beneath base — soft blur, grounded appearance */}
        <ContactShadows
          position={[0, -0.42, 0]}
          opacity={0.52}
          scale={5.5}
          blur={1.6}
          far={1.8}
          color="#16121C"
        />

        {/* Scroll Progress Camera Rig */}
        <CameraScrollRig scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
};

export default Hero3DCanvas;
