import React from 'react';
import * as THREE from 'three';
import useSimulationStore from '../systems/SimulationStore';

// Helper to generate crisp arrow textures for left/right turn indication
function createArrowTexture(direction, colorState) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();

  let strokeColor = '#242424';
  let fillColor = '#1a1a1a';
  let shadow = false;

  if (colorState === 'green') {
    strokeColor = '#00ff44';
    fillColor = '#22ff66';
    shadow = true;
  } else if (colorState === 'yellow') {
    strokeColor = '#ffbb00';
    fillColor = '#ffcc22';
    shadow = true;
  } else if (colorState === 'red') {
    strokeColor = '#ff2222';
    fillColor = '#ff3333';
    shadow = true;
  }

  if (shadow) {
    ctx.shadowColor = fillColor;
    ctx.shadowBlur = 18;
  }

  ctx.save();
  ctx.translate(128, 128);
  if (direction === 'right') {
    ctx.scale(-1, 1);
  }

  // Draw arrow pointing left
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  // Stem
  ctx.moveTo(60, -18);
  ctx.lineTo(-8, -18);
  // Top barb
  ctx.lineTo(-8, -50);
  // Arrowhead tip
  ctx.lineTo(-68, 0);
  // Bottom barb
  ctx.lineTo(-8, 50);
  ctx.lineTo(-8, 18);
  ctx.lineTo(60, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Helper to generate concentric Fresnel LED circular lens textures
function createBallTexture(colorState, type) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();

  const isLit = colorState !== 'off';
  let baseColor = '#1a1a1a';
  if (type === 'red') {
    baseColor = isLit ? '#ff2222' : '#280606';
  } else if (type === 'yellow') {
    baseColor = isLit ? '#ffbb00' : '#281a06';
  } else if (type === 'green') {
    baseColor = isLit ? '#00ff44' : '#06280e';
  }

  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 116);
  if (isLit) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, baseColor);
    grad.addColorStop(0.85, baseColor);
    grad.addColorStop(1, '#0a0a0a');
  } else {
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.8, '#141414');
    grad.addColorStop(1, '#080808');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.fill();

  // Concentric Fresnel rings
  ctx.strokeStyle = isLit ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 3;
  [36, 60, 84, 104].forEach((r) => {
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Street name sign texture helper
function createStreetSignTexture(name) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#005928';
  ctx.fillRect(0, 0, 512, 100);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 88);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Highway Gothic", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), 256, 50);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Caches for reusable textures across all traffic lights
const arrowTextureCache = new Map();
function getCachedArrowTexture(direction, colorState) {
  const key = `${direction}_${colorState}`;
  if (!arrowTextureCache.has(key)) {
    arrowTextureCache.set(key, createArrowTexture(direction, colorState));
  }
  return arrowTextureCache.get(key);
}

const ballTextureCache = new Map();
function getCachedBallTexture(colorState, type) {
  const key = `${type}_${colorState}`;
  if (!ballTextureCache.has(key)) {
    ballTextureCache.set(key, createBallTexture(colorState, type));
  }
  return ballTextureCache.get(key);
}

// Street name sign texture helper with module-level cache
const streetSignCache = new Map();
function getCachedStreetSignTexture(name) {
  if (!streetSignCache.has(name)) {
    streetSignCache.set(name, createStreetSignTexture(name));
  }
  return streetSignCache.get(name);
}

// High-Fidelity 5-Lens Horizontal Signal Head
// [ Left Arrow | Red Ball | Yellow Ball | Green Allowance Ball | Right Arrow ]
function HorizontalSignalHead({ throughState, leftState, rightState }) {
  const isLeftGreen = leftState === 'green';
  const isLeftYellow = leftState === 'yellow';
  const isLeftRed = leftState === 'red';

  const isThroughRed = throughState === 'red';
  const isThroughYellow = throughState === 'yellow';
  const isThroughGreen = throughState === 'green';

  const isRightGreen = rightState === 'green' || (!rightState && isThroughGreen);
  const isRightYellow = rightState === 'yellow' || (!rightState && isThroughYellow);
  const isRightRed = rightState === 'red';

  const leftArrowTex = getCachedArrowTexture('left', leftState);
  const redBallTex = getCachedBallTexture(isThroughRed ? 'red' : 'off', 'red');
  const yellowBallTex = getCachedBallTexture(isThroughYellow ? 'yellow' : 'off', 'yellow');
  const greenBallTex = getCachedBallTexture(isThroughGreen ? 'green' : 'off', 'green');
  const rightArrowTex = getCachedArrowTexture(
    'right',
    isRightGreen ? 'green' : isRightYellow ? 'yellow' : isRightRed ? 'red' : 'off'
  );

  // Aperture layout from driver's perspective (Left to Right):
  // Since parent group is rotated by Math.PI:
  // local +X points to driver's LEFT (Median)
  // local -X points to driver's RIGHT (Curb)
  const apertures = [
    { type: 'left_arrow', x: 1.6, tex: leftArrowTex, lit: isLeftGreen || isLeftYellow || isLeftRed },
    { type: 'red_ball', x: 0.8, tex: redBallTex, lit: isThroughRed },
    { type: 'yellow_ball', x: 0.0, tex: yellowBallTex, lit: isThroughYellow },
    { type: 'green_ball', x: -0.8, tex: greenBallTex, lit: isThroughGreen },
    { type: 'right_arrow', x: -1.6, tex: rightArrowTex, lit: isRightGreen || isRightYellow || isRightRed },
  ];

  return (
    <group>
      {/* Backing plate with yellow reflective border */}
      <mesh position={[0, 0, -0.05]} castShadow>
        <boxGeometry args={[4.8, 1.15, 0.08]} />
        <meshStandardMaterial color="#ffcc00" roughness={0.4} />
      </mesh>
      {/* Matte black inner backplate */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[4.65, 1.0, 0.02]} />
        <meshStandardMaterial color="#0c0c0c" roughness={0.8} />
      </mesh>

      {/* Main black aluminum horizontal housing */}
      <mesh position={[0, 0, 0.18]} castShadow>
        <boxGeometry args={[4.5, 0.88, 0.38]} />
        <meshStandardMaterial color="#181818" roughness={0.35} metalness={0.6} />
      </mesh>

      {/* Hood Visors over all 5 horizontal lenses */}
      {apertures.map((ap, i) => (
        <group key={i} position={[ap.x, 0, 0.38]}>
          {/* Top downward visor */}
          <mesh position={[0, 0.28, 0]} rotation={[0.25, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.3, 16, 1, true, 0, Math.PI]} />
            <meshStandardMaterial color="#151515" side={THREE.DoubleSide} />
          </mesh>

          {/* Silver metallic bezel ring */}
          <mesh position={[0, 0, 0.005]}>
            <ringGeometry args={[0.26, 0.285, 32]} />
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* High-res emissive lens face */}
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[0.26, 32]} />
            <meshBasicMaterial map={ap.tex} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Eye-level Pedestrian Crossing Signal Box texture generator
function createPedestrianTexture(signalState, countdown) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, 256, 256);

  if (signalState === 'walk') {
    // Walking figure in crisp white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(80, 55, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(70, 80, 22, 65);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(75, 90); ctx.lineTo(50, 125); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(85, 90); ctx.lineTo(115, 120); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(75, 145); ctx.lineTo(55, 205); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(85, 145); ctx.lineTo(115, 205); ctx.stroke();
  } else {
    // Red standing figure / hand
    ctx.fillStyle = signalState === 'flashing' ? '#ff7700' : '#ff2200';
    ctx.beginPath();
    ctx.arc(80, 55, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(70, 80, 22, 75);
    ctx.fillRect(65, 155, 14, 55);
    ctx.fillRect(85, 155, 14, 55);
  }

  // Digital countdown numerals on right side
  if (countdown > 0) {
    ctx.fillStyle = signalState === 'walk' ? '#00e5ff' : '#ff9900';
    ctx.font = 'bold 95px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(countdown).padStart(2, '0'), 185, 128);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const pedTextureCache = new Map();
function getCachedPedestrianTexture(signalState, countdown) {
  const displayCountdown = Math.max(0, Math.floor(countdown || 0));
  const key = `${signalState}_${displayCountdown}`;
  if (!pedTextureCache.has(key)) {
    pedTextureCache.set(key, createPedestrianTexture(signalState, displayCountdown));
  }
  return pedTextureCache.get(key);
}

// Eye-level Pedestrian Crossing Signal Box using cached CanvasTexture
function PedestrianSignalBox({ signalState, countdown }) {
  const tex = getCachedPedestrianTexture(signalState, countdown);

  return (
    <group position={[0, 2.4, 0]}>
      <mesh position={[0, 0, 0.25]} castShadow>
        <boxGeometry args={[0.85, 0.85, 0.35]} />
        <meshStandardMaterial color="#181818" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.45, 0.35]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.88, 0.08, 0.3]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0, 0, 0.43]}>
        <planeGeometry args={[0.75, 0.75]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
    </group>
  );
}

function TrafficLight({ position, direction, rotationY }) {
  const dirSignals = useSimulationStore((s) => s.trafficLightStates[direction]) || {
    through: 'red',
    left: 'red',
    right: 'red',
  };
  const pedSignal = useSimulationStore((s) => s.pedestrianSignals[direction]) || 'stop';
  const countdown = useSimulationStore((s) => s.pedestrianCountdowns[direction]) || 0;

  const streetName =
    direction === 'north' || direction === 'south' ? 'Broadway Ave' : '1st Avenue';
  const streetSignTex = getCachedStreetSignTexture(streetName);

  // Length of overhead cantilever mast arm across the 3 incoming lanes
  const armLength = 12.0;
  const armReach = armLength / 2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base mounting plate with anchor bolts */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.2, 8]} />
        <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.3} />
      </mesh>
      {[
        [-0.25, 0.22, -0.25],
        [0.25, 0.22, -0.25],
        [-0.25, 0.22, 0.25],
        [0.25, 0.22, 0.25],
      ].map((bPos, i) => (
        <mesh key={i} position={bPos}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 6]} />
          <meshStandardMaterial color="#888888" metalness={0.9} />
        </mesh>
      ))}

      {/* Main heavy vertical steel pole */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 7.6, 16]} />
        <meshStandardMaterial color="#3a3f47" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Cantilever connection collar */}
      <mesh position={[0, 6.8, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 12]} />
        <meshStandardMaterial color="#2d3238" metalness={0.8} />
      </mesh>

      {/* Horizontal tapered mast arm reaching out over the 3 lanes */}
      <mesh position={[-armReach, 6.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, armLength, 12]} />
        <meshStandardMaterial color="#3a3f47" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Support diagonal truss/gusset */}
      <mesh position={[-1.2, 6.0, 0]} rotation={[0, 0, 0.6]}>
        <cylinderGeometry args={[0.06, 0.06, 2.2, 8]} />
        <meshStandardMaterial color="#3a3f47" metalness={0.7} />
      </mesh>

      {/* Single Horizontal Traffic Light suspended over the 3 lanes */}
      <group position={[-armReach, 5.7, 0]} rotation={[0, Math.PI, 0]}>
        {/* Dual hanger brackets connecting to the mast arm above */}
        {[-1.5, 1.5].map((x, i) => (
          <mesh key={i} position={[x, 0.75, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
            <meshStandardMaterial color="#222222" metalness={0.7} />
          </mesh>
        ))}
        <HorizontalSignalHead
          throughState={dirSignals.through}
          leftState={dirSignals.left}
          rightState={dirSignals.right}
        />
      </group>

      {/* Overhead Street Name Sign mounted above the horizontal light on the arm */}
      <group position={[-armReach, 7.5, 0]}>
        <mesh>
          <boxGeometry args={[3.8, 0.75, 0.08]} />
          <meshStandardMaterial color="#00441e" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[3.6, 0.65]} />
          <meshBasicMaterial map={streetSignTex} />
        </mesh>
      </group>

      {/* Eye-level Pedestrian Signal Box mounted on vertical pole */}
      <group rotation={[0, Math.PI, 0]}>
        <PedestrianSignalBox signalState={pedSignal} countdown={countdown} />
      </group>
    </group>
  );
}

export default React.memo(TrafficLight);
