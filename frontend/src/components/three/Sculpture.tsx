'use client';

/**
 * Sculpture — the homepage's signature 3D element.
 *
 * A ribbon of 150 glossy ceramic tiles threaded along a two-coil helix,
 * continuously flowing upward like a compiled stream of code. Each tile
 * is an InstancedMesh entry driven entirely inside useFrame — no React
 * state, no re-renders, just matrix math.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three-stdlib';
import * as THREE from 'three';

const COUNT = 150;
const SPRING_RADIUS = 3.5;
const COILS = 2;
const SPAN = 22;
const X_OFFSET = 4;
const FADE_ZONE = 0.08;

interface SculptureProps {
  isDark: boolean;
}

export default function Sculpture({ isDark }: SculptureProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  const geometry = useMemo(
    () => new RoundedBoxGeometry(4, 0.3, 4, 2, 0.02),
    []
  );

  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: isDark ? new THREE.Color('#e4ecff') : new THREE.Color('#ffffff'),
      roughness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      metalness: 0.04,
      emissive: isDark ? new THREE.Color('#3d8bff') : new THREE.Color('#000000'),
      emissiveIntensity: isDark ? 0.16 : 0,
      reflectivity: 0.6,
    });
  }, [isDark]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < COUNT; i++) {
      const baseT = i / COUNT;
      const t = (baseT + time * 0.003) % 1;

      const y = (0.5 - t) * SPAN;
      const angle = t * Math.PI * 2 * COILS;
      const x = Math.sin(angle) * SPRING_RADIUS + X_OFFSET;
      const z = Math.cos(angle) * SPRING_RADIUS;

      dummy.position.set(x, y, z);

      // Look slightly ahead along the helix to orient each tile tangent
      // to the path, then lay it flat and twist it along the ribbon.
      const tAhead = t + 0.01;
      const angleAhead = tAhead * Math.PI * 2 * COILS;
      const yAhead = (0.5 - tAhead) * SPAN;
      const xAhead = Math.sin(angleAhead) * SPRING_RADIUS + X_OFFSET;
      const zAhead = Math.cos(angleAhead) * SPRING_RADIUS;
      lookTarget.set(xAhead, yAhead, zAhead);

      dummy.up.set(0, 1, 0);
      dummy.lookAt(lookTarget);
      dummy.rotateX(Math.PI / 2);

      const twist = t * Math.PI * 4 - time * 0.005;
      dummy.rotateY(twist);

      // Seamless loop: shrink tiles to nothing right at the seam so the
      // ribbon appears to endlessly regenerate instead of popping.
      let scale = 1;
      if (t < FADE_ZONE) {
        scale = t / FADE_ZONE;
      } else if (t > 1 - FADE_ZONE) {
        scale = (1 - t) / FADE_ZONE;
      }
      dummy.scale.setScalar(scale);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, COUNT]}
      castShadow
      receiveShadow
    />
  );
}
