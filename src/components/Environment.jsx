import React from 'react';
import * as THREE from 'three';
import { useGLTF, Clone } from '@react-three/drei';
import { HALF_ROAD } from '../utils/constants';

export function Tree({ position, variant = 1, scale = 1.0, rotationY = 0 }) {
  const { nodes } = useGLTF('/models/trees.glb');
  const meshName = `Tree_${((variant - 1) % 5) + 1}`;
  const treeMesh = nodes[meshName] || nodes.Tree_1;

  if (!treeMesh) return null;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Clone object={treeMesh} scale={[scale, scale, scale]} castShadow receiveShadow />
    </group>
  );
}

export function BusStop({ position, rotation = [0, 0, 0] }) {
  const { scene } = useGLTF('/models/bus_stop.glb');
  return (
    <group position={position} rotation={rotation}>
      <Clone object={scene} position={[0, 1.83, 0]} scale={[0.1, 0.1, 0.1]} castShadow receiveShadow />
    </group>
  );
}

export function Dumpster({ position, rotation = [0, 0, 0] }) {
  const { scene } = useGLTF('/models/dumpster.glb');
  return (
    <group position={position} rotation={rotation}>
      <Clone object={scene} scale={[0.9, 0.9, 0.9]} castShadow receiveShadow />
    </group>
  );
}

export function TrashCan({ position, rotation = [0, 0, 0] }) {
  const { scene } = useGLTF('/models/trashcan.glb');
  return (
    <group position={position} rotation={rotation}>
      <Clone object={scene} scale={[1.1, 1.1, 1.1]} castShadow receiveShadow />
    </group>
  );
}

export function Debris({ position, rotation = [0, 0, 0] }) {
  const { scene } = useGLTF('/models/debris.glb');
  return (
    <group position={position} rotation={rotation}>
      <Clone object={scene} scale={[1.0, 1.0, 1.0]} receiveShadow />
    </group>
  );
}

export function Flowers({ position, rotation = [0, 0, 0] }) {
  const { scene } = useGLTF('/models/flowers.glb');
  return (
    <group position={position} rotation={rotation}>
      <Clone object={scene} scale={[0.85, 0.85, 0.85]} castShadow receiveShadow />
    </group>
  );
}

export function GrassTuft({ position, scale = 1.0 }) {
  const { scene } = useGLTF('/models/grass.glb');
  return (
    <group position={position}>
      <Clone object={scene} scale={[scale, scale, scale]} castShadow receiveShadow />
    </group>
  );
}

export function GrassPatch({ position, scale = 1.0, rotationY = 0 }) {
  const { scene } = useGLTF('/models/grass_patch.glb');
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Clone object={scene} scale={[scale, scale, scale]} receiveShadow />
    </group>
  );
}

export function GrassTuftPoly({ position, scale = 1.0, rotationY = 0 }) {
  const { scene } = useGLTF('/models/grass_tuft.glb');
  const s = scale * 0.025;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Clone object={scene} scale={[s, s, s]} receiveShadow />
    </group>
  );
}

export function GrassMix({ position, scale = 1.0, rotationY = 0 }) {
  const { scene } = useGLTF('/models/grass_mix.glb');
  const s = scale * 1.4;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Clone object={scene} scale={[s, s, s]} receiveShadow />
    </group>
  );
}

export function Rock({ position, scale = 0.4, rotation = [0, 0, 0] }) {
  const { scene } = useGLTF('/models/rock.glb');
  return (
    <group position={position} rotation={rotation}>
      <Clone object={scene} scale={[scale, scale, scale]} castShadow receiveShadow />
    </group>
  );
}

// Shared static geometries and materials for StreetLight across the scene
const streetLightPoleGeo = new THREE.CylinderGeometry(0.08, 0.12, 7.0, 8);
const streetLightArmGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.0, 6);
const streetLightHeadGeo = new THREE.BoxGeometry(0.6, 0.15, 0.3);
const streetLightLensGeo = new THREE.PlaneGeometry(0.5, 0.25);

const streetLightMetalMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.3 });
const streetLightHeadMat = new THREE.MeshStandardMaterial({ color: '#334155' });
const streetLightGlowMat = new THREE.MeshBasicMaterial({ color: '#fef9c3' });

export function StreetLight({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Vertical Pole */}
      <mesh position={[0, 3.5, 0]} geometry={streetLightPoleGeo} material={streetLightMetalMat} castShadow />
      {/* Horizontal Arm reaching over curb towards road */}
      <mesh
        position={[1.0, 6.8, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        geometry={streetLightArmGeo}
        material={streetLightMetalMat}
        castShadow
      />
      {/* Light Head */}
      <mesh position={[2.0, 6.7, 0]} geometry={streetLightHeadGeo} material={streetLightHeadMat} />
      {/* Glowing Lens */}
      <mesh
        position={[2.0, 6.6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={streetLightLensGeo}
        material={streetLightGlowMat}
      />
    </group>
  );
}

export function Bench({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#6b3a1f" roughness={0.9} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.7, -0.22]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[1.5, 0.5, 0.06]} />
        <meshStandardMaterial color="#6b3a1f" roughness={0.9} />
      </mesh>
      {/* Legs */}
      {[-0.6, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.22, 0]}>
          <boxGeometry args={[0.06, 0.45, 0.4]} />
          <meshStandardMaterial color="#333333" metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function FireHydrant({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.7, 8]} />
        <meshStandardMaterial color="#cc2200" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#cc2200" roughness={0.4} />
      </mesh>
    </group>
  );
}

export function PlanterBox({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Concrete trough */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.5, 0.8]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[2.0, 0.05, 0.6]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      {/* Foliage hedge / shrubs */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.9, 0.35, 0.5]} />
        <meshStandardMaterial color="#2d6a4f" roughness={0.8} />
      </mesh>
      {/* Decorative colorful flowers */}
      {[-0.6, -0.2, 0.2, 0.6].map((ox, idx) => (
        <mesh key={idx} position={[ox, 0.85, idx % 2 === 0 ? 0.1 : -0.1]}>
          <sphereGeometry args={[0.1, 6, 6]} />
          <meshStandardMaterial color={idx % 2 === 0 ? '#f43f5e' : '#fbbf24'} />
        </mesh>
      ))}
    </group>
  );
}

export function SidewalkTreeGrate({ position }) {
  return (
    <group position={position}>
      {/* Dark cast iron square frame sitting flush on top of sidewalk (Y = 0.30) */}
      <mesh position={[0, 0.305, 0]}>
        <boxGeometry args={[1.6, 0.015, 1.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Soil inner opening */}
      <mesh position={[0, 0.308, 0]}>
        <boxGeometry args={[0.7, 0.016, 0.7]} />
        <meshStandardMaterial color="#271b12" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Environment() {
  // Curb is at HALF_ROAD = 12.2m. Sidewalk spans from 12.2m to 16.7m (width 4.5m)
  // Safe sidewalk curb offset: 14.0m (center of sidewalk, right on sidewalk without overlapping buildings)
  const sw = HALF_ROAD + 1.8; // 14.0m
  const curbEdge = HALF_ROAD + 0.8; // 13.0m

  return (
    <group>
      {/* Roadside Trees in Cast-Iron Grates along Central Sidewalks (Z: -80m to +80m, X: -80m to +80m) */}
      {[22, 42, 62, 82].map((dist) => (
        <React.Fragment key={`sw-trees-${dist}`}>
          {/* North Avenue (-Z) Sidewalks */}
          <SidewalkTreeGrate position={[sw, 0, -dist]} />
          <Tree position={[sw, 0.30, -dist]} variant={(dist % 5) + 1} scale={0.95} />
          <SidewalkTreeGrate position={[-sw, 0, -dist]} />
          <Tree position={[-sw, 0.30, -dist]} variant={((dist + 2) % 5) + 1} scale={0.95} />

          {/* South Avenue (+Z) Sidewalks */}
          <SidewalkTreeGrate position={[sw, 0, dist]} />
          <Tree position={[sw, 0.30, dist]} variant={((dist + 1) % 5) + 1} scale={0.95} />
          <SidewalkTreeGrate position={[-sw, 0, dist]} />
          <Tree position={[-sw, 0.30, dist]} variant={((dist + 3) % 5) + 1} scale={0.95} />

          {/* East Avenue (+X) Sidewalks */}
          <SidewalkTreeGrate position={[dist, 0, sw]} />
          <Tree position={[dist, 0.30, sw]} variant={(dist % 5) + 1} scale={0.95} />
          <SidewalkTreeGrate position={[dist, 0, -sw]} />
          <Tree position={[dist, 0.30, -sw]} variant={((dist + 2) % 5) + 1} scale={0.95} />

          {/* West Avenue (-X) Sidewalks */}
          <SidewalkTreeGrate position={[-dist, 0, sw]} />
          <Tree position={[-dist, 0.30, sw]} variant={((dist + 1) % 5) + 1} scale={0.95} />
          <SidewalkTreeGrate position={[-dist, 0, -sw]} />
          <Tree position={[-dist, 0.30, -sw]} variant={((dist + 3) % 5) + 1} scale={0.95} />
        </React.Fragment>
      ))}

      {/* Streetlights positioned right at curb edge facing inward over the roadway */}
      {[16, 48, 80].map((dist) => (
        <React.Fragment key={`sw-lights-${dist}`}>
          <StreetLight position={[curbEdge, 0, -dist]} rotationY={Math.PI} />
          <StreetLight position={[-curbEdge, 0, -dist]} rotationY={0} />
          <StreetLight position={[curbEdge, 0, dist]} rotationY={Math.PI} />
          <StreetLight position={[-curbEdge, 0, dist]} rotationY={0} />

          <StreetLight position={[dist, 0, curbEdge]} rotationY={-Math.PI / 2} />
          <StreetLight position={[dist, 0, -curbEdge]} rotationY={Math.PI / 2} />
          <StreetLight position={[-dist, 0, curbEdge]} rotationY={-Math.PI / 2} />
          <StreetLight position={[-dist, 0, -curbEdge]} rotationY={Math.PI / 2} />
        </React.Fragment>
      ))}

      {/* Dual Bus Stops facing the avenue roadway */}
      <BusStop position={[sw + 0.5, 0.3, -32]} rotation={[0, -Math.PI / 2, 0]} />
      <BusStop position={[-sw - 0.5, 0.3, -32]} rotation={[0, Math.PI / 2, 0]} />
      <BusStop position={[32, 0.3, -sw - 0.5]} rotation={[0, 0, 0]} />
      <BusStop position={[32, 0.3, sw + 0.5]} rotation={[0, Math.PI, 0]} />

      {/* Curbside Sidewalk Benches */}
      <Bench position={[sw, 0.3, -26]} rotation={-Math.PI / 2} />
      <Bench position={[-sw, 0.3, -26]} rotation={Math.PI / 2} />
      <Bench position={[sw, 0.3, 26]} rotation={-Math.PI / 2} />
      <Bench position={[-sw, 0.3, 26]} rotation={Math.PI / 2} />
      <Bench position={[26, 0.3, sw]} rotation={Math.PI} />
      <Bench position={[26, 0.3, -sw]} rotation={0} />
      <Bench position={[-26, 0.3, sw]} rotation={Math.PI} />
      <Bench position={[-26, 0.3, -sw]} rotation={0} />

      {/* Cast Iron Trash Cans near crosswalks & bus stops */}
      <TrashCan position={[curbEdge, 0.3, -14]} rotation={[0, -Math.PI / 2, 0]} />
      <TrashCan position={[-curbEdge, 0.3, -14]} rotation={[0, Math.PI / 2, 0]} />
      <TrashCan position={[curbEdge, 0.3, 14]} rotation={[0, -Math.PI / 2, 0]} />
      <TrashCan position={[-curbEdge, 0.3, 14]} rotation={[0, Math.PI / 2, 0]} />
      <TrashCan position={[14, 0.3, curbEdge]} rotation={[0, 0, 0]} />
      <TrashCan position={[14, 0.3, -curbEdge]} rotation={[0, Math.PI, 0]} />
      <TrashCan position={[-14, 0.3, curbEdge]} rotation={[0, 0, 0]} />
      <TrashCan position={[-14, 0.3, -curbEdge]} rotation={[0, Math.PI, 0]} />

      {/* Fire Hydrants at curb corners */}
      <FireHydrant position={[curbEdge + 0.3, 0.15, -12]} />
      <FireHydrant position={[-curbEdge - 0.3, 0.15, 12]} />
      <FireHydrant position={[12, 0.15, curbEdge + 0.3]} />
      <FireHydrant position={[-12, 0.15, -curbEdge - 0.3]} />
    </group>
  );
}

export default React.memo(Environment);

// Preload environmental props
useGLTF.preload('/models/trees.glb');
useGLTF.preload('/models/bus_stop.glb');
useGLTF.preload('/models/dumpster.glb');
useGLTF.preload('/models/trashcan.glb');
useGLTF.preload('/models/debris.glb');
useGLTF.preload('/models/flowers.glb');
useGLTF.preload('/models/grass.glb');
useGLTF.preload('/models/grass_patch.glb');
useGLTF.preload('/models/grass_tuft.glb');
useGLTF.preload('/models/grass_mix.glb');
useGLTF.preload('/models/rock.glb');
