import React, { useMemo } from 'react';
import { useGLTF, Clone } from '@react-three/drei';
import Building from './Building';
import { Bench, PlanterBox, Tree } from './Environment';
import { getCachedNavigationBoardTexture } from '../utils/textureHelpers';

/**
 * Overhead Navigation Gantry spanning a 24.4m primary avenue
 * Features heavy steel truss lattice, maintenance walkway, luminaire spotlights,
 * and high-contrast dual highway destination signs.
 */
export function OverheadNavigationGantry({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  signType = 'downtown_north',
  span = 26.4,
  clearance = 6.4,
}) {
  const signTex = useMemo(() => getCachedNavigationBoardTexture(signType), [signType]);
  const halfSpan = span / 2;
  const trussY = clearance + 1.2;

  return (
    <group position={position} rotation={rotation}>
      {/* Support Columns (Vertical Steel Pillars at both curbs) */}
      {[-halfSpan, halfSpan].map((x, i) => (
        <group key={`col-${i}`} position={[x, 0, 0]}>
          {/* Concrete Footing */}
          <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[0.6, 0.75, 0.6, 8]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.9} />
          </mesh>
          {/* Base Plate with Bolts */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[0.8, 0.05, 0.8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Main Tubular Steel Column */}
          <mesh position={[0, (clearance + 2.0) / 2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.26, clearance + 2.0, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.35} />
          </mesh>
          {/* Top Joint Cap */}
          <mesh position={[0, clearance + 2.05, 0]}>
            <sphereGeometry args={[0.28, 10, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Overhead Horizontal Truss Box (Top & Bottom Chord Beams) */}
      <mesh position={[0, trussY, 0]} castShadow>
        <boxGeometry args={[span, 0.22, 0.8]} />
        <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, trussY + 1.1, 0]} castShadow>
        <boxGeometry args={[span, 0.22, 0.8]} />
        <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Truss Cross Bracing Struts */}
      {[-10, -6, -2, 2, 6, 10].map((bx, idx) => (
        <React.Fragment key={`brace-${idx}`}>
          <mesh position={[bx, trussY + 0.55, 0.35]} rotation={[0, 0, idx % 2 === 0 ? 0.78 : -0.78]}>
            <cylinderGeometry args={[0.04, 0.04, 1.4, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[bx, trussY + 0.55, -0.35]} rotation={[0, 0, idx % 2 === 0 ? -0.78 : 0.78]}>
            <cylinderGeometry args={[0.04, 0.04, 1.4, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.4} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Maintenance Catwalk Platform */}
      <mesh position={[0, trussY - 0.12, 0.7]} receiveShadow>
        <boxGeometry args={[span - 1.2, 0.06, 0.6]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Catwalk Safety Railing */}
      <mesh position={[0, trussY + 0.45, 0.98]}>
        <boxGeometry args={[span - 1.2, 0.04, 0.04]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
      </mesh>

      {/* Main Overhead Highway Destination Sign Panel (Facing forward) */}
      <group position={[0, trussY + 0.5, 0.46]}>
        {/* Sign Frame Backing Housing */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[11.2, 3.6, 0.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
        </mesh>
        {/* Front Face with Navigation Texture */}
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[11.0, 3.4]} />
          <meshBasicMaterial map={signTex} />
        </mesh>
        {/* Luminaire Arm Light Fixtures above sign */}
        {[-4.2, 0, 4.2].map((lx, li) => (
          <group key={`lum-${li}`} position={[lx, 1.9, 0.35]}>
            <mesh rotation={[-0.4, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.25, 0.18]}>
              <boxGeometry args={[0.7, 0.12, 0.25]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 0.19, 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.6, 0.2]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * Stainless Steel Street Bollard for pedestrian protection & corner safety
 */
export function Bollard({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.9, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Reflective Band */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.1, 12]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>
      {/* Domed Cap */}
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Modern Inverted-U Bicycle Parking Rack
 */
export function BicycleRack({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Concrete mounting strip */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[2.4, 0.04, 0.8]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
      {/* 3 Inverted-U steel loops */}
      {[-0.7, 0, 0.7].map((x, i) => (
        <group key={`rack-${i}`} position={[x, 0, 0]}>
          <mesh position={[-0.22, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.22, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.82, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.44, 8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Outdoor Cafe Table with Umbrella and 4 Chairs for Plazas & Sidewalks
 */
export function CafeTableWithUmbrella({ position = [0, 0, 0], color = '#e11d48' }) {
  return (
    <group position={position}>
      {/* Table Base & Stem */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.04, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Tabletop */}
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.65, 0.65, 0.04, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>

      {/* Umbrella Center Pole */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 2.0, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>
      {/* Umbrella Fabric Canopy */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <coneGeometry args={[1.5, 0.7, 12]} />
        <meshStandardMaterial color={color} roughness={0.85} side={2} />
      </mesh>

      {/* 4 Chairs surrounding table */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((rot, ci) => {
        const dist = 0.85;
        const cx = Math.sin(rot) * dist;
        const cz = Math.cos(rot) * dist;
        return (
          <group key={`chair-${ci}`} position={[cx, 0, cz]} rotation={[0, rot + Math.PI, 0]}>
            {/* Chair legs */}
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.44, 6]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            {/* Seat */}
            <mesh position={[0, 0.44, 0]} castShadow>
              <boxGeometry args={[0.42, 0.04, 0.4]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
            </mesh>
            {/* Backrest */}
            <mesh position={[0, 0.68, -0.18]} castShadow>
              <boxGeometry args={[0.42, 0.44, 0.03]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * Reusable Parking Lot module based on parking_lot.glb
 * Includes painted stalls, parking dividers, lampposts, and parked cars
 */
export function ParkingLot({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 5.8 }) {
  const { scene } = useGLTF('/models/parking_lot.glb');
  return (
    <group position={position} rotation={rotation}>
      <Clone object={scene} scale={[scale, scale, scale]} receiveShadow castShadow />
    </group>
  );
}

/**
 * Rock cluster using rocks_quaternius.glb
 */
export function ParkRock({ position = [0, 0, 0], variant = 1, scale = 1.0, rotation = [0, 0, 0] }) {
  const { nodes } = useGLTF('/models/rocks_quaternius.glb');
  const rockName = `Rock_${((variant - 1) % 5) + 1}`;
  const rockNode = nodes[rockName] || nodes.Rock_1;

  if (!rockNode) return null;

  return (
    <group position={position} rotation={rotation}>
      {/* Geometry vertices are centered, scaling by 100 aligns with model export */}
      <mesh
        geometry={rockNode.geometry}
        material={rockNode.material}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[100 * scale, 100 * scale, 100 * scale]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

/**
 * Architectural stairs leading to elevated plaza
 */
export function PlazaStairs({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1.5 }) {
  const { scene } = useGLTF('/models/stairs.glb');
  return (
    <group position={position} rotation={rotation}>
      <Clone object={scene} scale={[scale, scale, scale]} receiveShadow castShadow />
    </group>
  );
}

/**
 * 3D City Fountain with calibrated Y-offset to sit flush on plaza
 */
export function Fountain({ position = [0, 0, 0], scale = 2.8 }) {
  const { scene } = useGLTF('/models/fountain.glb');
  // Fountain origin is vertical center; 2.25 offset grounds the stone basin at Y=0
  return (
    <group position={[position[0], position[1] + 2.25, position[2]]}>
      <Clone object={scene} scale={[scale, scale, scale]} receiveShadow castShadow />
    </group>
  );
}

/**
 * Northwest District: Regional Hospital & Medical Campus
 */
export function HospitalComplex({ position = [-52, 0, -42] }) {
  return (
    <group position={position}>
      {/* Medical Center Foundation Plaza */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[62, 0.06, 52]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* Main Regional Hospital Building */}
      <Building
        position={[14, 0, 0]}
        type="hospital"
        rotation={[0, Math.PI, 0]}
        scaleMultiplier={1.0}
      />

      {/* Hospital Staff & Ambulance Parking Lot */}
      <ParkingLot position={[-16, 0.03, 0]} rotation={[0, 0, 0]} scale={5.5} />

      {/* Landscaped Perimeter Hedges & Planters */}
      <PlanterBox position={[28, 0.06, -20]} rotation={0} />
      <PlanterBox position={[28, 0.06, 20]} rotation={0} />
      <PlanterBox position={[-28, 0.06, -20]} rotation={0} />
      <PlanterBox position={[-28, 0.06, 20]} rotation={0} />

      {/* Courtyard Resting Benches */}
      <Bench position={[28, 0.06, -8]} rotation={-Math.PI / 2} />
      <Bench position={[28, 0.06, 8]} rotation={-Math.PI / 2} />
    </group>
  );
}

/**
 * Northeast District: Cinema & Entertainment Plaza
 */
export function CinemaPlaza({ position = [52, 0, -40] }) {
  return (
    <group position={position}>
      {/* Cinema Plaza Paved Foundation */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[62, 0.06, 52]} />
        <meshStandardMaterial color="#475569" roughness={0.75} />
      </mesh>

      {/* Cinema Multiplex Building */}
      <Building
        position={[-15, 0, 0]}
        type="cinema"
        rotation={[0, 0, 0]}
        scaleMultiplier={1.05}
      />

      {/* Cinema Guest Parking Lot */}
      <ParkingLot position={[16, 0.03, 0]} rotation={[0, -Math.PI / 2, 0]} scale={5.5} />

      {/* Entrance Plaza Amenities */}
      <Bench position={[-15, 0.06, 20]} rotation={Math.PI} />
      <Bench position={[-24, 0.06, 20]} rotation={Math.PI} />
      <PlanterBox position={[-6, 0.06, 20]} rotation={Math.PI} />
    </group>
  );
}

/**
 * Southwest District: Cultural & Heritage Central Park
 */
export function CentralPark({ position = [-50, 0, 50] }) {
  const { scene: pondScene } = useGLTF('/models/pond.glb');

  return (
    <group position={position}>
      {/* Lush Park Lawn Foundation */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[62, 0.06, 62]} />
        <meshStandardMaterial color="#2d6a4f" roughness={0.9} />
      </mesh>

      {/* Scenic Park Pond with Water & Shoreline */}
      <group position={[-10, 0.03, 10]} rotation={[0, 0.4, 0]}>
        <Clone object={pondScene} scale={[0.15, 0.15, 0.15]} receiveShadow castShadow />
      </group>

      {/* Historic Gothic Cathedral / Church overlooking the park */}
      <Building
        position={[15, 0, -12]}
        type="church"
        rotation={[0, -Math.PI / 2, 0]}
        scaleMultiplier={1.05}
      />

      {/* Natural Quaternius Rock Formations along pond perimeter */}
      <ParkRock position={[-10, 0.04, -8]} variant={1} scale={0.7} rotation={[0, 0.8, 0]} />
      <ParkRock position={[6, 0.04, 12]} variant={2} scale={0.8} rotation={[0, 2.1, 0]} />
      <ParkRock position={[-26, 0.04, 8]} variant={3} scale={0.65} rotation={[0, -1.2, 0]} />
      <ParkRock position={[-8, 0.04, 28]} variant={4} scale={0.75} rotation={[0, 1.5, 0]} />
      <ParkRock position={[2, 0.04, 26]} variant={5} scale={0.85} rotation={[0, 3.0, 0]} />

      {/* Park Promenade Benches */}
      <Bench position={[15, 0.06, 12]} rotation={-Math.PI / 2} />
      <Bench position={[15, 0.06, 22]} rotation={-Math.PI / 2} />
      <Bench position={[-10, 0.06, -14]} rotation={0} />

      {/* Lush Park Trees */}
      <Tree position={[22, 0.06, 4]} variant={1} scale={1.1} rotationY={0.5} />
      <Tree position={[22, 0.06, -24]} variant={2} scale={1.2} rotationY={1.8} />
      <Tree position={[-24, 0.06, -22]} variant={4} scale={1.05} rotationY={2.7} />
      <Tree position={[-25, 0.06, 25]} variant={5} scale={1.15} rotationY={1.2} />
    </group>
  );
}

/**
 * Southeast District: Civic Fountain Plaza & Residential District
 */
export function FountainPlaza({ position = [36, 0, 36] }) {
  return (
    <group position={position}>
      {/* Elegant Plaza Paved Foundation */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[26, 0.1, 26]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.6} />
      </mesh>

      {/* Inner Decorative Paving Ring */}
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[4.2, 10.5, 32]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
      </mesh>

      {/* Central 3D Fountain */}
      <Fountain position={[0, 0.1, 0]} scale={2.7} />

      {/* Plaza Stone Stairs connecting to street sidewalks */}
      <PlazaStairs position={[-13.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={1.3} />
      <PlazaStairs position={[0, 0, -13.5]} rotation={[0, 0, 0]} scale={1.3} />

      {/* Surrounding Plaza Benches */}
      <Bench position={[0, 0.11, 6.8]} rotation={Math.PI} />
      <Bench position={[0, 0.11, -6.8]} rotation={0} />
      <Bench position={[6.8, 0.11, 0]} rotation={Math.PI / 2} />
      <Bench position={[-6.8, 0.11, 0]} rotation={-Math.PI / 2} />

      {/* Corner Planter Boxes with flowers */}
      <PlanterBox position={[10.5, 0.11, 10.5]} rotation={Math.PI / 4} />
      <PlanterBox position={[-10.5, 0.11, 10.5]} rotation={-Math.PI / 4} />
      <PlanterBox position={[10.5, 0.11, -10.5]} rotation={-Math.PI / 4} />
      <PlanterBox position={[-10.5, 0.11, -10.5]} rotation={Math.PI / 4} />
    </group>
  );
}

// Preload models for city amenities
useGLTF.preload('/models/parking_lot.glb');
useGLTF.preload('/models/pond.glb');
useGLTF.preload('/models/fountain.glb');
useGLTF.preload('/models/stairs.glb');
useGLTF.preload('/models/rocks_quaternius.glb');
