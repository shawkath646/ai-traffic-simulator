import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Clone } from '@react-three/drei';
import { EffectComposer, SSAO, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import Intersection from './Intersection';
import TrafficLight from './TrafficLight';
import Environment from './Environment';
import CityChunk from './CityChunk';
import FarCitySkyline from './FarCitySkyline';
import Vehicle from './Vehicle';
import Pedestrian from './Pedestrian';
import useSimulationStore from '../systems/SimulationStore';
import { TraditionalController } from '../systems/TrafficLightController';
import { AITrafficController } from '../systems/AITrafficController';
import { VehicleManager } from '../systems/VehicleManager';
import { PedestrianManager } from '../systems/PedestrianManager';
import { ROAD_WIDTH, VEHICLE_STOP_DISTANCE } from '../utils/constants';
import { getCachedTileTexture } from '../utils/textureHelpers';

// NOTE: @react-three/postprocessing must be installed for the SSAO/Bloom
// pass below (`npm install @react-three/postprocessing`). If you'd rather
// not add the dependency yet, delete the import above and the
// <EffectComposer> block near the bottom of the returned JSX.

// Soft, natural fair-weather 3D cumulus clouds drifting gracefully in the skyline backdrop
function RealisticClouds() {
  const { scene } = useGLTF('/models/clouds_model.glb');
  const cloudGroup = useRef();

  // Ensure cloud model has soft, crisp white shading
  const softWhiteScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#ffffff'),
          roughness: 0.95,
          metalness: 0.0,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
        });
      }
    });
    return cloned;
  }, [scene]);

  // Peaceful cloud drift across the sky backdrop
  useFrame((_, delta) => {
    if (cloudGroup.current) {
      cloudGroup.current.children.forEach((cloud, i) => {
        cloud.position.x += (0.6 + (i % 4) * 0.15) * delta;
        if (cloud.position.x > 380) cloud.position.x = -380;
      });
    }
  });

  // Clouds positioned in the horizon backdrop (Y = 145m to 175m) across all quadrants
  const cloudConfigs = useMemo(
    () => [
      { pos: [-220, 150, -180], scale: 65, rot: [0, 0.4, 0] },
      { pos: [-120, 162, 220], scale: 72, rot: [0, 1.2, 0] },
      { pos: [-260, 145, 60], scale: 60, rot: [0, 2.5, 0] },
      { pos: [140, 168, -220], scale: 70, rot: [0, 0.8, 0] },
      { pos: [240, 155, -90], scale: 62, rot: [0, 3.1, 0] },
      { pos: [260, 150, 160], scale: 68, rot: [0, 1.9, 0] },
      { pos: [-40, 172, -250], scale: 56, rot: [0, 0.5, 0] },
      { pos: [60, 160, 240], scale: 66, rot: [0, 2.1, 0] },
    ],
    []
  );

  return (
    <group ref={cloudGroup}>
      {cloudConfigs.map((cfg, i) => (
        <group key={i} position={cfg.pos} rotation={cfg.rot} scale={[cfg.scale, cfg.scale * 0.48, cfg.scale * 0.85]}>
          <Clone object={softWhiteScene} />
        </group>
      ))}
    </group>
  );
}

// Custom Sunny Sky Dome shader with rich azure blue zenith and crisp soft blue horizon
const sunnySkyShader = {
  uniforms: {
    topColor: { value: new THREE.Color('#0284c7') }, // Vibrant deep azure blue at zenith
    midColor: { value: new THREE.Color('#38bdf8') }, // Crisp sunny cyan/sky blue
    horizonColor: { value: new THREE.Color('#bae6fd') }, // Soft pale sky blue at horizon (no orange/yellow)
    bottomColor: { value: new THREE.Color('#e0f2fe') }, // Soft airy sky-blue floor transition
    sunDirection: { value: new THREE.Vector3(50, 110, 30).normalize() },
    sunGlowColor: { value: new THREE.Color('#ffffff') }, // Soft natural white solar radiance
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Sky bands are blended with smoothstep instead of hard if/else cuts so the
  // gradient has no visible seam at the h=0.0 / h=0.25 breakpoints.
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 midColor;
    uniform vec3 horizonColor;
    uniform vec3 bottomColor;
    uniform vec3 sunDirection;
    uniform vec3 sunGlowColor;
    varying vec3 vWorldPosition;

    void main() {
      vec3 dir = normalize(vWorldPosition);
      float h = dir.y;

      // Continuous blend across bottom -> horizon -> mid -> top, no hard branches
      vec3 lowBand = mix(bottomColor, horizonColor, smoothstep(-0.15, 0.0, h));
      vec3 midBand = mix(horizonColor, midColor, smoothstep(0.0, 0.25, h));
      vec3 highBand = mix(midColor, topColor, smoothstep(0.25, 1.0, h));

      vec3 sky = mix(lowBand, midBand, smoothstep(-0.05, 0.05, h));
      sky = mix(sky, highBand, smoothstep(0.15, 0.35, h));

      // Subtle, soft natural white solar highlight in direction of sun
      float sunDot = max(0.0, dot(dir, sunDirection));
      float sunGlow = pow(sunDot, 6.0) * 0.20;
      sky = mix(sky, sunGlowColor, sunGlow);

      gl_FragColor = vec4(sky, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

function SunnySkyDome() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(sunnySkyShader.uniforms),
      vertexShader: sunnySkyShader.vertexShader,
      fragmentShader: sunnySkyShader.fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh material={material}>
      <sphereGeometry args={[500, 32, 16]} />
    </mesh>
  );
}

// Create persistent instances outside component to survive re-renders
const traditionalController = new TraditionalController();
const aiController = new AITrafficController();
const vehicleManager = new VehicleManager();
const pedestrianManager = new PedestrianManager();

function VehiclesLayer() {
  const vehicles = useSimulationStore((s) => s.vehicles);
  return (
    <>
      {vehicles.map((v) => (
        <Vehicle key={v.id} data={v} />
      ))}
    </>
  );
}

function PedestriansLayer() {
  const pedestrians = useSimulationStore((s) => s.pedestrians);
  return (
    <>
      {pedestrians.map((p) => (
        <Pedestrian key={p.id} data={p} />
      ))}
    </>
  );
}

const MemoizedSkyDome = React.memo(SunnySkyDome);
const MemoizedClouds = React.memo(RealisticClouds);

function PerformanceMonitor() {
  const { gl } = useThree();
  const frameCount = useRef(0);
  const lastTime = useRef(null);
  const setPerfStats = useSimulationStore((s) => s.setPerfStats);

  useFrame(() => {
    const now = performance.now();
    if (lastTime.current === null) {
      lastTime.current = now;
      return;
    }
    frameCount.current++;
    if (now - lastTime.current >= 500) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      const drawCalls = gl.info.render.calls;
      const triangles = gl.info.render.triangles;
      frameCount.current = 0;
      lastTime.current = now;
      if (setPerfStats) {
        setPerfStats({ fps, drawCalls, triangles });
      }
    }
  });

  return null;
}

export default function Scene() {
  const storeRef = useRef(useSimulationStore);
  const lastModeRef = useRef(null);
  const lastScenarioRef = useRef(null);
  // Sub-second elapsed-time accumulator kept locally instead of mutating the
  // Zustand state object directly; only crosses into the store on whole-second
  // boundaries, same throttling behavior without touching store internals.
  const subSecondElapsedRef = useRef(0);

  useFrame((_, rawDelta) => {
    const store = storeRef.current;
    const state = store.getState();
    if (state.paused) return;

    const delta = Math.min(rawDelta, 0.1) * state.simulationSpeed;

    // Smooth HUD controller mode transition (traditional <-> ai)
    if (lastModeRef.current !== null && state.mode !== lastModeRef.current) {
      if (state.mode === 'traditional') {
        if (typeof traditionalController.syncFromCurrentState === 'function') {
          traditionalController.syncFromCurrentState(store);
        }
      } else {
        if (typeof aiController.syncFromCurrentState === 'function') {
          aiController.syncFromCurrentState(store);
        }
      }
    }
    lastModeRef.current = state.mode;

    // Smooth HUD scenario transition
    if (lastScenarioRef.current !== null && state.simulationMode !== lastScenarioRef.current) {
      if (typeof vehicleManager.handleModeSwitch === 'function') {
        vehicleManager.handleModeSwitch(state.simulationMode);
      }
    }
    lastScenarioRef.current = state.simulationMode;

    // Update elapsed time (throttle store update to whole seconds to avoid frame thrashing)
    const newElapsed = state.elapsedTime + delta;
    if (Math.floor(newElapsed) !== Math.floor(state.elapsedTime)) {
      subSecondElapsedRef.current = 0;
      store.getState().setElapsedTime(newElapsed);
    } else {
      subSecondElapsedRef.current = newElapsed - state.elapsedTime;
    }

    // Update traffic lights
    if (state.mode === 'traditional') {
      traditionalController.update(delta, store);
    } else {
      aiController.update(delta, store);
    }

    // Update vehicles and pedestrians
    vehicleManager.update(delta, store);
    pedestrianManager.update(delta, store);
  });

  const halfRoad = ROAD_WIDTH / 2;
  const lightOffset = halfRoad + 1.5;

  // Natural organic grass texture for city ground (1 tile ≈ 23.6m, seamless)
  const groundGrassTex = useMemo(() => getCachedTileTexture('natural_turf', 22, 22), []);

  // 520x520 ground geometry with opening for the Central Park sunken pond basin (X: -88 to -48, Z: 35 to 75)
  const groundGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-260, -260);
    shape.lineTo(260, -260);
    shape.lineTo(260, 260);
    shape.lineTo(-260, 260);
    shape.closePath();

    // Central Park pond basin cutout (local X: -88 to -48, local Y: -75 to -35 maps to world X: -88 to -48, Z: 35 to 75)
    const hole = new THREE.Path();
    hole.moveTo(-88, -75);
    hole.lineTo(-48, -75);
    hole.lineTo(-48, -35);
    hole.lineTo(-88, -35);
    hole.closePath();
    shape.holes.push(hole);

    const geo = new THREE.ShapeGeometry(shape);
    const pos = geo.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      uvs[i * 2] = ((x + 260) / 520) * 22;
      uvs[i * 2 + 1] = ((y + 260) / 520) * 22;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, []);

  return (
    <>
      {/* Rich Sunny Blue Sky Dome with warm golden horizon */}
      <MemoizedSkyDome />

      {/* High-altitude crisp fair-weather cumulus clouds */}
      <MemoizedClouds />

      {/* Distance fog matched to the sky dome's horizon color so the far
          skyline and sky dome blend instead of meeting at a hard seam */}
      <fog attach="fog" args={['#bae6fd', 120, 480]} />

      {/* Real-time Render Performance Tracker (FPS, draw calls, triangles) */}
      <PerformanceMonitor />

      {/* Lighting - Natural crisp daylight with subtle warm sunlight */}
      <ambientLight intensity={0.55} color="#f8fafc" />
      <directionalLight
        position={[80, 140, 60]}
        intensity={2.1}
        color="#fffef5"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-95}
        shadow-camera-right={95}
        shadow-camera-top={95}
        shadow-camera-bottom={-95}
        shadow-camera-near={0.5}
        shadow-camera-far={320}
        shadow-bias={-0.00005}
        shadow-normalBias={0.02}
        shadow-radius={4}
      />
      <hemisphereLight
        skyColor="#7dd3fc"
        groundColor="#52743a"
        intensity={0.50}
      />

      {/* Expanded 520x520 City Chunk Ground with Natural Earthy Grass Turf (cutout for sunken pond) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} geometry={groundGeometry} receiveShadow>
        <meshStandardMaterial map={groundGrassTex} roughness={0.95} metalness={0.0} color="#ffffff" />
      </mesh>

      {/* Primary Intersection */}
      <Intersection />

      {/* Expanded City Grid: Extended Avenues, secondary streets, and 80+ buildings out to 210m */}
      <CityChunk />

      {/* Far City Skyline Shadow: 160-tower distant silhouette and perimeter grounding shadow */}
      <FarCitySkyline />

      {/* Overhead Cantilever Traffic Lights - 4 corners aligned with stop bars */}
      <TrafficLight position={[lightOffset, 0, -VEHICLE_STOP_DISTANCE]} direction="north" rotationY={0} />
      <TrafficLight position={[-lightOffset, 0, VEHICLE_STOP_DISTANCE]} direction="south" rotationY={Math.PI} />
      <TrafficLight position={[VEHICLE_STOP_DISTANCE, 0, lightOffset]} direction="east" rotationY={-Math.PI / 2} />
      <TrafficLight position={[-VEHICLE_STOP_DISTANCE, 0, -lightOffset]} direction="west" rotationY={Math.PI / 2} />

      {/* Environment: trees, streetlights */}
      <Environment />

      {/* Isolated Vehicle and Pedestrian Layers to protect Root Scene from re-rendering */}
      <VehiclesLayer />
      <PedestriansLayer />

      {/* Camera controls - damped for a smoother, more cinematic orbit feel */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={15}
        maxDistance={230}
        target={[0, 0, 0]}
        rotateSpeed={0.8}
        panSpeed={0.8}
        zoomSpeed={1.2}
      />

      {/* Post-processing: SSAO grounds buildings/vehicles instead of looking
          flat under ambient light; Bloom makes the sun glow and any emissive
          materials (headlights, traffic lights) actually read as bright.
          Requires @react-three/postprocessing. */}
      <EffectComposer multisampling={0}>
        <SSAO radius={0.15} intensity={20} luminanceInfluence={0.4} samples={16} />
        <Bloom intensity={0.4} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
      </EffectComposer>
    </>
  );
}
