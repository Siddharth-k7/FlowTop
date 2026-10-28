import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useFinish } from './useFinish';
import { CAMERA_CONFIG } from './hero-3d.config';

interface TapModelProps {
  scrollProgress?: number;
}

export const TapModel: React.FC<TapModelProps> = ({ scrollProgress = 0 }) => {
  const groupRef = useRef<THREE.Group | null>(null);
  const waterRef = useRef<THREE.Mesh | null>(null);
  const { activeFinish } = useFinish();

  // 1. Single Reusable MeshPhysicalMaterial Instance (Never recreated on finish swap = 0 memory leak!)
  const metallicMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(activeFinish.color),
      metalness: activeFinish.metalness,
      roughness: activeFinish.roughness,
      clearcoat: activeFinish.clearcoat,
      clearcoatRoughness: activeFinish.clearcoatRoughness,
      reflectivity: 1.0,
      envMapIntensity: 1.5,
    });
  }, []);

  // Aerator trim material (brushed dark chrome accent)
  const aeratorMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#3A3840'),
      metalness: 0.8,
      roughness: 0.25,
      clearcoat: 0.5,
    });
  }, []);

  // Water physical material (Translucent laminar water stream — well under 2000 triangles)
  const waterMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#D8ECF8'),
      transmission: 0.95,
      opacity: 0.85,
      transparent: true,
      roughness: 0.05,
      ior: 1.333, // True water index of refraction
      thickness: 0.4,
      depthWrite: false,
    });
  }, []);

  // Pre-allocated target color for smooth GC-free interpolation
  const targetColor = useMemo(() => new THREE.Color(activeFinish.color), []);

  useEffect(() => {
    targetColor.set(activeFinish.color);
  }, [activeFinish, targetColor]);

  // Clean up materials on unmount
  useEffect(() => {
    return () => {
      metallicMaterial.dispose();
      aeratorMaterial.dispose();
      waterMaterial.dispose();
    };
  }, [metallicMaterial, aeratorMaterial, waterMaterial]);

  // Construct High-Fidelity Architectural Tap Geometry
  // Sub-mesh naming contract: 'body', 'handle', 'spout', 'aerator'
  const spoutCurve = useMemo(() => {
    // Elegant sweeping gooseneck arch
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.4, 0),
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(0.1, 1.15, 0),
      new THREE.Vector3(0.4, 1.25, 0),
      new THREE.Vector3(0.7, 1.1, 0),
      new THREE.Vector3(0.82, 0.82, 0),
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.075, 24, false);
  }, []);

  // Animate finish transition, delta idle rotation, and water stream
  useFrame((_, delta) => {
    // A. Smooth Material Transition (~250ms lerp)
    // Lerp rate based on delta: 1 - Math.exp(-delta * 12)
    const lerpFactor = Math.min(1, delta * 12);
    metallicMaterial.metalness = THREE.MathUtils.lerp(
      metallicMaterial.metalness,
      activeFinish.metalness,
      lerpFactor
    );
    metallicMaterial.roughness = THREE.MathUtils.lerp(
      metallicMaterial.roughness,
      activeFinish.roughness,
      lerpFactor
    );
    metallicMaterial.clearcoat = THREE.MathUtils.lerp(
      metallicMaterial.clearcoat,
      activeFinish.clearcoat,
      lerpFactor
    );
    metallicMaterial.clearcoatRoughness = THREE.MathUtils.lerp(
      metallicMaterial.clearcoatRoughness,
      activeFinish.clearcoatRoughness,
      lerpFactor
    );
    metallicMaterial.color.lerp(targetColor, lerpFactor);

    // B. Idle Rotation scaled by delta (never fixed increment)
    if (groupRef.current) {
      // Rotate ~6° per second during idle, subdued when user scrubs
      const scrubDampening = Math.max(0.2, 1 - scrollProgress * 0.8);
      groupRef.current.rotation.y += CAMERA_CONFIG.idleRotationSpeedRadPerSec * delta * scrubDampening;
    }

    // C. Water stream micro-pulse animation
    if (waterRef.current) {
      const time = performance.now() * 0.003;
      const pulse = 1 + Math.sin(time * 8) * 0.03;
      waterRef.current.scale.set(pulse, 1, pulse);
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* 1. Sub-mesh: 'body' (Base escutcheon + main vertical cylinder) */}
      <group name="body">
        {/* Base Escutcheon Flange */}
        <mesh
          position={[0, 0.03, 0]}
          material={metallicMaterial}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.26, 0.28, 0.06, 48]} />
        </mesh>

        {/* Lower Decorative Collar */}
        <mesh
          position={[0, 0.08, 0]}
          material={metallicMaterial}
          castShadow
        >
          <cylinderGeometry args={[0.22, 0.24, 0.04, 48]} />
        </mesh>

        {/* Main Monobloc Body Column */}
        <mesh
          position={[0, 0.38, 0]}
          material={metallicMaterial}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.16, 0.18, 0.56, 48]} />
        </mesh>

        {/* Upper Cartridge Hub */}
        <mesh
          position={[0, 0.70, 0]}
          material={metallicMaterial}
          castShadow
        >
          <cylinderGeometry args={[0.155, 0.16, 0.12, 48]} />
        </mesh>
      </group>

      {/* 2. Sub-mesh: 'handle' (Top lever cartridge + ergonomic paddle) */}
      <group name="handle" position={[0, 0.78, 0]}>
        {/* Lever Pivot Dome */}
        <mesh material={metallicMaterial} castShadow>
          <cylinderGeometry args={[0.14, 0.15, 0.06, 40]} />
        </mesh>

        {/* Single Ergonomic Lever Arm */}
        <mesh
          position={[0.20, 0.03, 0]}
          rotation={[0, 0, -0.06]}
          material={metallicMaterial}
          castShadow
        >
          <boxGeometry args={[0.36, 0.03, 0.08]} />
        </mesh>
      </group>

      {/* 3. Sub-mesh: 'spout' (Swept architectural high-arc tube) */}
      <group name="spout">
        <mesh
          geometry={spoutCurve}
          material={metallicMaterial}
          castShadow
          receiveShadow
        />
      </group>

      {/* 4. Sub-mesh: 'aerator' (Recessed aerator collar + nozzle ring) */}
      <group name="aerator" position={[0.82, 0.80, 0]}>
        <mesh material={aeratorMaterial} castShadow>
          <cylinderGeometry args={[0.076, 0.076, 0.06, 32]} />
        </mesh>

        {/* Inner Aerator Mesh Filter Ring */}
        <mesh position={[0, -0.032, 0]} material={metallicMaterial}>
          <cylinderGeometry args={[0.062, 0.062, 0.01, 32]} />
        </mesh>

        {/* Water Stream (Thin translucent cylinder — Phase E.4, 240 triangles) */}
        <mesh
          ref={waterRef}
          position={[0, -0.38, 0]}
          material={waterMaterial}
        >
          <cylinderGeometry args={[0.024, 0.032, 0.72, 16]} />
        </mesh>
      </group>
    </group>
  );
};
