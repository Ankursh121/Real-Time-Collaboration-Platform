import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const ConstructionBlock = ({ position, color }) => {
  const meshRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.cos(t / 4) / 4;
    meshRef.current.rotation.y = Math.sin(t / 4) / 4;
    meshRef.current.position.y = position[1] + Math.sin(t / 2) / 2;
  });

  return (
    <mesh position={position} ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
    </mesh>
  );
};

const SiteScene = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-40 grayscale-[0.5]">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <ConstructionBlock position={[-2, 1, 0]} color="#3b82f6" />
          <ConstructionBlock position={[2, -1, 0]} color="#1e293b" />
          <ConstructionBlock position={[0, 0, -2]} color="#38bdf8" />
        </Float>

        <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#0f172a" transparent opacity={0.1} />
        </mesh>
      </Canvas>
    </div>
  );
};

export default SiteScene;
