"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, Center, Html } from "@react-three/drei";
import React, { Suspense, useMemo, useEffect, useState } from "react";
import * as THREE from 'three';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
// @ts-ignore
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
// @ts-ignore
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';
// @ts-ignore
import * as fflate from 'three/examples/jsm/libs/fflate.module.js';
import { useLoader } from "@react-three/fiber";

interface ModelProps {
  url: string;
  color?: string;
  materialType?: string;
  filename?: string;
  forceMulticolor?: boolean;
}

// Helper para abstrair se é STL, OBJ ou 3MF
function Model({ url, color = "#cccccc", materialType = "pla", filename = "", forceMulticolor = false }: ModelProps) {
  const fileExt = (filename || url).split('.').pop()?.toLowerCase();

  const isObj = fileExt === 'obj';
  const is3mf = fileExt === '3mf';

  // Configura o loader (3MF precisa do fflate para descompactar)
  const geometryOrGroup = useLoader(
    isObj ? OBJLoader : (is3mf ? ThreeMFLoader : STLLoader),
    url,
    (loader: any) => {
      // Garantir fflate antes da carga do 3MF
      if (typeof window !== 'undefined') {
        (window as any).fflate = fflate;
      }
      if (is3mf && loader.addLibrary) {
        loader.addLibrary(fflate);
      }
    }
  ) as THREE.BufferGeometry | THREE.Group;

  // IMPORTANTE: Clonamos o modelo DEEP (incluindo materiais) para não sujar o cache do useLoader
  const modelInstance = useMemo(() => {
    if (geometryOrGroup instanceof THREE.Group || (geometryOrGroup as any).isGroup) {
      const clone = (geometryOrGroup as THREE.Group).clone(true);

      // Clone manual dos materiais para independência total do cache do useLoader
      clone.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map(m => m.clone());
            } else {
              mesh.material = mesh.material.clone();
            }
          }
        }
      });
      return clone;
    }
    return geometryOrGroup;
  }, [geometryOrGroup, forceMulticolor]);

  const materialProps = useMemo(() => {
    const baseColor = new THREE.Color(color);
    return {
      color: baseColor,
      roughness: materialType.toLowerCase() === 'resin' ? 0.1 : (materialType.toLowerCase() === 'petg' ? 0.2 : 0.5),
      metalness: materialType.toLowerCase() === 'resin' ? 0.2 : 0.1,
      transparent: materialType.toLowerCase() === 'resin',
      opacity: materialType.toLowerCase() === 'resin' ? 0.8 : 1.0,
      clearcoat: materialType.toLowerCase() === 'resin' ? 1 : 0,
    };
  }, [color, materialType]);

  // Contagem para o Debug Overlay
  const stats = useMemo(() => {
    let hasVertexColors = false;
    let colorAttrName = "Nenhum";
    const colors = new Set<string>();
    const materialNames = new Set<string>();
    let meshCount = 0;

    if (modelInstance instanceof THREE.Group) {
      modelInstance.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          meshCount++;
          const mesh = node as THREE.Mesh;

          // Scanner de atributos de cor
          Object.keys(mesh.geometry.attributes).forEach(attr => {
            if (attr.toLowerCase().includes('color')) {
              hasVertexColors = true;
              colorAttrName = attr;
            }
          });

          const mat = mesh.material;
          if (mat) {
            const mats = Array.isArray(mat) ? mat : [mat];
            mats.forEach(m => {
              if (m.name) materialNames.add(m.name);
              if ((m as any).color) colors.add((m as any).color.getHexString().toUpperCase());
            });
          }
        }
      });
    }
    return { colors: Array.from(colors), meshes: meshCount, hasVertexColors, colorAttrName, materialNames: Array.from(materialNames) };
  }, [modelInstance]);

  // Se for um Group (OBJ ou 3MF)
  if (modelInstance instanceof THREE.Group || (modelInstance as any).isGroup) {
    const group = modelInstance as THREE.Group;

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        if (!forceMulticolor) {
          // Monocolor: força material padrão do BRCPrint
          mesh.material = new THREE.MeshStandardMaterial(materialProps);
        } else {
          // No modo multicolor, forçamos a ativação de vertex colors caso existam
          if (stats.hasVertexColors && mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m: any) => {
              m.vertexColors = true;
              m.needsUpdate = true;
            });
          }
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return (
      <group>
        <primitive object={group} dispose={null} />
      </group>
    );
  }

  // Se for apenas uma Geometry (STL)
  return (
    <mesh geometry={modelInstance as THREE.BufferGeometry} castShadow receiveShadow>
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}

export default function ModelViewer({ url, color, materialType, filename = "", forceMulticolor = false, onLoaded }: ModelProps & { onLoaded?: () => void }) {

  if (!url) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)", borderRadius: 12 }}>
        <p style={{ color: "var(--muted)" }}>Nenhum modelo selecionado.</p>
      </div>
    );
  }

  const checkStr = filename || url;
  const ext = checkStr.split('.').pop()?.toLowerCase() || "";
  const isValidFormat = ['stl', 'obj', '3mf'].includes(ext);

  if (!isValidFormat) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)", borderRadius: 12 }}>
        <p style={{ color: "var(--muted)", textAlign: "center", padding: "1rem" }}>
          Arquivo compactado ou formato não suportado (`{checkStr.split('.').pop()}`).<br />
          Baixe o arquivo para fatiar localmente.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 400, background: "var(--surface)", borderRadius: 12, overflow: "hidden", position: "relative" }}>
      <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [50, 50, 50], fov: 50 }}>
        <Suspense fallback={<FallbackLoading />}>
          <Stage environment="city" intensity={0.5} adjustCamera>
            <Center top>
              {/* Force complete remount on mode toggle */}
              <Model
                key={`${url}-${forceMulticolor}-${color}`}
                url={url}
                color={color}
                materialType={materialType}
                filename={filename}
                forceMulticolor={forceMulticolor}
              />
            </Center>
          </Stage>
        </Suspense>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
      </Canvas>



      <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 4, fontSize: "0.7rem", color: "white" }}>
        Clique e arraste para girar
      </div>
    </div>
  );
}

function FallbackLoading() {
  return (
    <mesh>
      <boxGeometry args={[10, 10, 10]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  );
}
