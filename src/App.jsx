import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import Scene from './components/Scene';
import ControlPanel from './components/UI/ControlPanel';

function Loader() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        zIndex: 9999,
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 16 }}>🚦 Loading 3D City Assets...</div>
      <div
        style={{
          width: 260,
          height: 8,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
            transition: 'width 0.2s ease-out',
          }}
        />
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: '#94a3b8' }}>
        {Math.round(progress)}% loaded
      </div>
    </div>
  );
}

function LoadingFallback() {
  return null;
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Loader />
      <Canvas
        shadows="percentage"
        camera={{
          position: [48, 42, 48],
          fov: 55,
          near: 0.1,
          far: 1200,
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene />
        </Suspense>
      </Canvas>
      <ControlPanel />

      {/* Help text */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 11,
          fontFamily: "'Segoe UI', sans-serif",
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        🖱 Left drag: Rotate &nbsp;|&nbsp; Scroll: Zoom &nbsp;|&nbsp; Right drag: Pan
      </div>
    </div>
  );
}
