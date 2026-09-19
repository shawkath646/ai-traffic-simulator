import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Clone, Html } from '@react-three/drei';
import * as THREE from 'three';
import useSimulationStore from '../systems/SimulationStore';

// Per-vehicle precise geometric light configurations and model transformations
const VEHICLE_CONFIGS = {
  car: {
    modelPos: [0, 0, 0],
    modelRot: [0, 0, 0],
    headlight: { x: 0.64, y: 0.48, z: 2.05, w: 0.20, h: 0.10 },
    taillight: { x: 0.58, y: 0.68, z: -1.98, w: 0.20, h: 0.12 },
    blinkerFront: { x: 0.78, y: 0.48, z: 2.00 },
    blinkerRear: { x: 0.72, y: 0.68, z: -1.94 },
  },
  taxi: {
    modelPos: [0, 0, 0],
    modelRot: [0, 0, 0],
    headlight: { x: 0.64, y: 0.46, z: 2.12, w: 0.20, h: 0.10 },
    taillight: { x: 0.58, y: 0.68, z: -1.88, w: 0.20, h: 0.12 },
    blinkerFront: { x: 0.78, y: 0.46, z: 2.08 },
    blinkerRear: { x: 0.72, y: 0.68, z: -1.84 },
  },
  suv: {
    modelPos: [0, 0, 0],
    modelRot: [0, 0, 0],
    headlight: { x: 0.70, y: 0.62, z: 2.05, w: 0.22, h: 0.12 },
    taillight: { x: 0.66, y: 0.88, z: -1.96, w: 0.22, h: 0.14 },
    blinkerFront: { x: 0.86, y: 0.62, z: 2.00 },
    blinkerRear: { x: 0.82, y: 0.88, z: -1.92 },
  },
  pickup: {
    modelPos: [0, 0, 0],
    modelRot: [0, 0, 0],
    headlight: { x: 0.84, y: 0.96, z: 2.62, w: 0.24, h: 0.14 },
    taillight: { x: 0.80, y: 0.97, z: -2.46, w: 0.22, h: 0.14 },
    blinkerFront: { x: 0.96, y: 0.96, z: 2.56 },
    blinkerRear: { x: 0.92, y: 0.97, z: -2.42 },
  },
  police_car: {
    modelPos: [0, 0, 0],
    modelRot: [0, 0, 0],
    headlight: { x: 0.60, y: 0.45, z: 1.80, w: 0.20, h: 0.10 },
    taillight: { x: 0.56, y: 0.65, z: -1.80, w: 0.20, h: 0.12 },
    blinkerFront: { x: 0.72, y: 0.45, z: 1.76 },
    blinkerRear: { x: 0.68, y: 0.65, z: -1.76 },
  },
  truck: {
    // Model rotated +PI/2 so white cab faces forward along +Z, cargo box faces rear along -Z
    modelPos: [0, 0.62, 0],
    modelRot: [0, Math.PI / 2, 0],
    headlight: { x: 0.92, y: 0.95, z: 2.12, w: 0.24, h: 0.14 },
    taillight: { x: 0.88, y: 0.95, z: -2.02, w: 0.24, h: 0.14 },
    blinkerFront: { x: 1.05, y: 0.95, z: 2.06 },
    blinkerRear: { x: 1.02, y: 0.95, z: -1.98 },
  },
  bus: {
    modelPos: [0, 0, 0],
    modelRot: [0, 0, 0],
    headlight: { x: 1.05, y: 0.65, z: 4.31, w: 0.30, h: 0.16 },
    taillight: { x: 1.05, y: 0.65, z: -4.31, w: 0.28, h: 0.16 },
    blinkerFront: { x: 1.22, y: 0.65, z: 4.25 },
    blinkerRear: { x: 1.22, y: 0.65, z: -4.25 },
  },
  ambulance: {
    modelPos: [0, 0.08, 0],
    modelRot: [0, 0, 0],
    headlight: { x: 0.94, y: 0.72, z: 2.82, w: 0.24, h: 0.14 },
    taillight: { x: 0.92, y: 0.72, z: -2.82, w: 0.24, h: 0.14 },
    blinkerFront: { x: 1.10, y: 0.72, z: 2.76 },
    blinkerRear: { x: 1.08, y: 0.72, z: -2.76 },
    strobePos: [0, 2.78, 0.30],
  },
};

function Vehicle({ data }) {
  const groupRef = useRef();
  const chassisRef = useRef();
  const leftStrobeRef = useRef();
  const rightStrobeRef = useRef();
  const strobeLightRef = useRef();
  const badgeTextRef = useRef();
  const leftBlinkerFrontRef = useRef();
  const leftBlinkerRearRef = useRef();
  const rightBlinkerFrontRef = useRef();
  const rightBlinkerRearRef = useRef();
  const leftBrakeLightRef = useRef();
  const rightBrakeLightRef = useRef();

  const selectedVehicleId = useSimulationStore((s) => s.selectedVehicleId);
  const setSelectedVehicleId = useSimulationStore((s) => s.setSelectedVehicleId);

  const isSelected = selectedVehicleId === data.id;
  const isEmergency = !!data.isEmergency;
  const modelUrl = data.model || '/models/car.glb';
  const { scene } = useGLTF(modelUrl);

  const scale = data.modelScale || 1.0;
  const vehicleType = data.type || 'car';
  const cfg = VEHICLE_CONFIGS[vehicleType] || VEHICLE_CONFIGS.car;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // 1. Smooth kinematic world positioning
    groupRef.current.position.x = data.x;
    groupRef.current.position.z = data.z;

    // Smooth yaw angle interpolation without 360-degree wrap popping
    const currentRot = groupRef.current.rotation.y;
    let targetRot = data.rotation;
    let diff = (targetRot - currentRot) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y = currentRot + diff * 0.35;

    // 2. Physics-based suspension dynamics: Pitch (squat/dive) & Roll (centrifugal lean)
    if (chassisRef.current) {
      const accel = data.acceleration || 0;
      // Pitch: dive down on hard braking (accel < 0), squat back on acceleration (accel > 0)
      const targetPitch = THREE.MathUtils.clamp(-accel * 0.007, -0.045, 0.035);
      chassisRef.current.rotation.x = THREE.MathUtils.lerp(chassisRef.current.rotation.x, targetPitch, 0.18);

      // Roll: centrifugal lean outward during cornering
      let targetRoll = 0;
      if (data.turning) {
        targetRoll = data.turn === 'right' ? -0.038 : 0.038;
      }
      chassisRef.current.rotation.z = THREE.MathUtils.lerp(chassisRef.current.rotation.z, targetRoll, 0.15);

      // Idle engine vibration & road bumps
      const bump = (data.currentSpeed || 0) > 0.1 ? Math.sin(t * 22) * 0.012 : Math.sin(t * 5) * 0.003;
      chassisRef.current.position.y = bump;
    }

    // 3. Dynamic Brake Lights
    const isBraking = !!data.isBraking;
    if (leftBrakeLightRef.current && rightBrakeLightRef.current) {
      const brakeIntensity = isBraking ? 2.8 : 0.25;
      leftBrakeLightRef.current.material.emissiveIntensity = brakeIntensity;
      rightBrakeLightRef.current.material.emissiveIntensity = brakeIntensity;
    }

    // 4. Animated Blinking Amber Turn Signals (Blink at 2.8 Hz)
    const blinkOn = Math.floor(t * 5.6) % 2 === 0;
    const signal = data.turnSignal;

    if (leftBlinkerFrontRef.current && leftBlinkerRearRef.current) {
      const leftInt = signal === 'left' && blinkOn ? 2.5 : 0.0;
      leftBlinkerFrontRef.current.material.emissiveIntensity = leftInt;
      leftBlinkerRearRef.current.material.emissiveIntensity = leftInt;
    }
    if (rightBlinkerFrontRef.current && rightBlinkerRearRef.current) {
      const rightInt = signal === 'right' && blinkOn ? 2.5 : 0.0;
      rightBlinkerFrontRef.current.material.emissiveIntensity = rightInt;
      rightBlinkerRearRef.current.material.emissiveIntensity = rightInt;
    }

    // 5. Emergency Vehicle Strobe Lights
    if (isEmergency) {
      const flash = Math.sin(t * 18) > 0;
      if (leftStrobeRef.current && rightStrobeRef.current) {
        leftStrobeRef.current.material.emissiveIntensity = flash ? 3.5 : 0.2;
        rightStrobeRef.current.material.emissiveIntensity = flash ? 0.2 : 3.5;
      }
      if (strobeLightRef.current) {
        strobeLightRef.current.color.set(flash ? '#ff1111' : '#0066ff');
      }
    }

    // 6. Direct DOM update for live wait time (zero React render overhead)
    if (badgeTextRef.current) {
      if (isEmergency) {
        badgeTextRef.current.innerText = data.waiting
          ? `Wait ${data.waitTime.toFixed(1)}s`
          : 'PRIORITY PASS';
      } else {
        badgeTextRef.current.innerText = `${data.waitTime.toFixed(1)}s`;
      }
    }
  });

  const badgeHeight = (data.height || 1.6) + (isEmergency ? 1.5 : 1.2);
  const showBadge = isSelected || isEmergency;

  return (
    <group
      ref={groupRef}
      position={[data.x, 0, data.z]}
      rotation={[0, data.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedVehicleId(isSelected ? null : data.id);
      }}
    >
      {/* Dynamic Chassis Group with Pitch, Roll & Suspension */}
      <group ref={chassisRef}>
        <group position={cfg.modelPos} rotation={cfg.modelRot}>
          <Clone object={scene} scale={[scale, scale, scale]} castShadow receiveShadow />
        </group>

        {/* --- Forward Crisp White/Warm Headlights --- */}
        <mesh position={[-cfg.headlight.x, cfg.headlight.y, cfg.headlight.z]}>
          <boxGeometry args={[cfg.headlight.w, cfg.headlight.h, 0.05]} />
          <meshStandardMaterial color="#ffffff" emissive="#fffaed" emissiveIntensity={1.8} roughness={0.2} />
        </mesh>
        <mesh position={[cfg.headlight.x, cfg.headlight.y, cfg.headlight.z]}>
          <boxGeometry args={[cfg.headlight.w, cfg.headlight.h, 0.05]} />
          <meshStandardMaterial color="#ffffff" emissive="#fffaed" emissiveIntensity={1.8} roughness={0.2} />
        </mesh>

        {/* --- Active Dynamic Brake Lights (Rear) --- */}
        <mesh ref={leftBrakeLightRef} position={[-cfg.taillight.x, cfg.taillight.y, cfg.taillight.z]}>
          <boxGeometry args={[cfg.taillight.w, cfg.taillight.h, 0.05]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.25} roughness={0.3} />
        </mesh>
        <mesh ref={rightBrakeLightRef} position={[cfg.taillight.x, cfg.taillight.y, cfg.taillight.z]}>
          <boxGeometry args={[cfg.taillight.w, cfg.taillight.h, 0.05]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.25} roughness={0.3} />
        </mesh>

        {/* --- Animated Amber Turn Signals --- */}
        {/* Left Front Blinker */}
        <mesh ref={leftBlinkerFrontRef} position={[-cfg.blinkerFront.x, cfg.blinkerFront.y, cfg.blinkerFront.z]}>
          <boxGeometry args={[0.14, 0.08, 0.05]} />
          <meshStandardMaterial color="#ff9900" emissive="#ff9900" emissiveIntensity={0} roughness={0.3} />
        </mesh>
        {/* Left Rear Blinker */}
        <mesh ref={leftBlinkerRearRef} position={[-cfg.blinkerRear.x, cfg.blinkerRear.y, cfg.blinkerRear.z]}>
          <boxGeometry args={[0.14, 0.08, 0.05]} />
          <meshStandardMaterial color="#ff9900" emissive="#ff9900" emissiveIntensity={0} roughness={0.3} />
        </mesh>
        {/* Right Front Blinker */}
        <mesh ref={rightBlinkerFrontRef} position={[cfg.blinkerFront.x, cfg.blinkerFront.y, cfg.blinkerFront.z]}>
          <boxGeometry args={[0.14, 0.08, 0.05]} />
          <meshStandardMaterial color="#ff9900" emissive="#ff9900" emissiveIntensity={0} roughness={0.3} />
        </mesh>
        {/* Right Rear Blinker */}
        <mesh ref={rightBlinkerRearRef} position={[cfg.blinkerRear.x, cfg.blinkerRear.y, cfg.blinkerRear.z]}>
          <boxGeometry args={[0.14, 0.08, 0.05]} />
          <meshStandardMaterial color="#ff9900" emissive="#ff9900" emissiveIntensity={0} roughness={0.3} />
        </mesh>

        {/* Flashing roof emergency strobe lights for Ambulance */}
        {isEmergency && (
          <group position={cfg.strobePos || [0, 2.78, 0.30]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.2, 0.08, 0.22]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
            </mesh>
            {/* Left Red LED Strobe */}
            <mesh ref={leftStrobeRef} position={[-0.45, 0.07, 0]}>
              <boxGeometry args={[0.28, 0.12, 0.18]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3.5} />
            </mesh>
            {/* Right Blue LED Strobe */}
            <mesh ref={rightStrobeRef} position={[0.45, 0.07, 0]}>
              <boxGeometry args={[0.28, 0.12, 0.18]} />
              <meshStandardMaterial color="#0055ff" emissive="#0055ff" emissiveIntensity={0.2} />
            </mesh>
            <pointLight ref={strobeLightRef} position={[0, 0.4, 0]} intensity={2.5} distance={10} />
          </group>
        )}
      </group>

      {/* Floating waiting time / priority badge */}
      {showBadge && (
        <Html position={[0, badgeHeight, 0]} center distanceFactor={24}>
          <div
            style={{
              background: isEmergency
                ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(37, 99, 235, 0.95))'
                : 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              border: '2px solid #ffffff',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Segoe UI', Tahoma, sans-serif",
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              pointerEvents: 'none',
              animation: isEmergency ? 'pulse 1s infinite' : 'none',
            }}
          >
            {isEmergency ? (
              <>
                <span>🚨 AMBULANCE:</span>
                <span ref={badgeTextRef} style={{ color: '#fef08a' }}>
                  {data.waiting ? `Wait ${data.waitTime.toFixed(1)}s` : 'PRIORITY PASS'}
                </span>
              </>
            ) : (
              <>
                <span>⏱ Wait:</span>
                <span ref={badgeTextRef} style={{ color: '#fef08a' }}>
                  {data.waitTime.toFixed(1)}s
                </span>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export default React.memo(Vehicle);

// Preload vehicle models for instant rendering without hitching
useGLTF.preload('/models/car.glb');
useGLTF.preload('/models/taxi.glb');
useGLTF.preload('/models/truck.glb');
useGLTF.preload('/models/police_car.glb');
useGLTF.preload('/models/suv.glb');
useGLTF.preload('/models/pickup.glb');
useGLTF.preload('/models/bus.glb');
useGLTF.preload('/models/ambulance.glb');
