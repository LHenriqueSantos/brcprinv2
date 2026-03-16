"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function AbstractPrinterMesh({ setParentHover }: { setParentHover: (h: boolean) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Rotate slowly and smoothly interpolate scale to avoid React state bouncing constraints
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.05;

      const targetScale = hovered ? 1.15 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.1;
      coreRef.current.rotation.x -= delta * 0.1;
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
        {/* Outer Wireframe / Solid Mesh */}
        <mesh
          ref={meshRef}
          onPointerEnter={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
            setHover(true);
            setParentHover(true);
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
            setHover(false);
            setParentHover(false);
          }}
        >
          <icosahedronGeometry args={[2, 1]} />
          <meshStandardMaterial
            color="#6c63ff"
            wireframe={!hovered}
            roughness={0.2}
            metalness={0.8}
            emissive={hovered ? "#ff6584" : "#1a1a2e"}
            emissiveIntensity={hovered ? 0.6 : 0.2}
          />
        </mesh>

        {/* Inner solid core */}
        <mesh ref={coreRef} scale={[1.8, 1.8, 1.8]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#ff6584"
            emissive="#ff6584"
            emissiveIntensity={0.2}
            wireframe={hovered}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default function Hero3DScene() {
  const [hovered, setHover] = useState(false);

  return (
    <div style={{ width: "100%", height: "450px", position: "relative" }}>
      {/* Decorative background glow behind the 3D object */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "300px",
        height: "300px",
        background: hovered ? "radial-gradient(circle, rgba(255, 101, 132, 0.4) 0%, rgba(0,0,0,0) 70%)" : "radial-gradient(circle, rgba(108, 99, 255, 0.4) 0%, rgba(0,0,0,0) 50%)",
        filter: "blur(40px)",
        zIndex: 0,
        pointerEvents: "none",
        animation: "pulseGlow 4s infinite",
        transition: "background 0.3s ease"
      }} />

      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} style={{ zIndex: 1, pointerEvents: "auto" }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.8} color="#ff6584" />
        <pointLight position={[0, 0, 0]} intensity={hovered ? 2 : 0} color="#ff6584" />

        <AbstractPrinterMesh setParentHover={setHover} />

        <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={10} blur={2.5} far={4} color="#6c63ff" />

        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2 + 0.3} minPolarAngle={Math.PI / 2 - 0.3} />

        {/* Simple local environment to avoid network issues pulling preset HDRs */}
        <Environment background={false}>
          <mesh position={[0, 5, -10]} scale={[10, 10, 10]}>
            <planeGeometry />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </Environment>
      </Canvas>
    </div>
  );
}
