import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  ROAD_WIDTH,
  HALF_ROAD,
  ROAD_LENGTH,
  MEDIAN_WIDTH,
  LANE_OFFSETS,
  SIDEWALK_WIDTH,
  SIDEWALK_HEIGHT,
  CROSSWALK_WIDTH,
  CROSSWALK_DISTANCE,
  VEHICLE_STOP_DISTANCE,
} from '../utils/constants';
import { getCachedPavementArrowTexture, getCachedTileTexture } from '../utils/textureHelpers';

// Median Divider with Steel Crash Barrier Fence
function MedianDivider({ length, rotation = 0, position = [0, 0, 0] }) {
  const postSpacing = 3.5;
  const postCount = Math.floor((length - 4) / postSpacing);
  const posts = [];

  for (let i = 0; i < postCount; i++) {
    const z = -length / 2 + 2 + i * postSpacing;
    posts.push(
      <group key={i} position={[0, 0.45, z]}>
        {/* Steel H/I-post */}
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.85, 0.12]} />
          <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Yellow reflector tab */}
        <mesh position={[0.05, 0.25, 0]}>
          <boxGeometry args={[0.02, 0.12, 0.08]} />
          <meshBasicMaterial color="#ffcc00" />
        </mesh>
        <mesh position={[-0.05, 0.25, 0]}>
          <boxGeometry args={[0.02, 0.12, 0.08]} />
          <meshBasicMaterial color="#ffcc00" />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Raised Concrete Median Island */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[MEDIAN_WIDTH, 0.2, length]} />
        <meshStandardMaterial color="#8e8e93" roughness={0.8} />
      </mesh>

      {/* Rounded end curb caps */}
      <mesh position={[0, 0.1, length / 2]}>
        <cylinderGeometry args={[MEDIAN_WIDTH / 2, MEDIAN_WIDTH / 2, 0.2, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#8e8e93" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.1, -length / 2]}>
        <cylinderGeometry args={[MEDIAN_WIDTH / 2, MEDIAN_WIDTH / 2, 0.2, 16, 1, false, Math.PI, Math.PI]} />
        <meshStandardMaterial color="#8e8e93" roughness={0.8} />
      </mesh>

      {/* Crash Barrier Horizontal Corrugated Guardrails (both sides of fence) */}
      <mesh position={[0.08, 0.55, 0]} castShadow>
        <boxGeometry args={[0.04, 0.35, length - 2]} />
        <meshStandardMaterial color="#999999" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[-0.08, 0.55, 0]} castShadow>
        <boxGeometry args={[0.04, 0.35, length - 2]} />
        <meshStandardMaterial color="#999999" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Vertical Fence Posts */}
      {posts}
    </group>
  );
}

// Wide Zebra Striped Crosswalk
function ZebraCrosswalk({ position, rotationY = 0 }) {
  const stripeCount = 14;
  const totalSpan = ROAD_WIDTH - 1.0;
  const stripeSpacing = totalSpan / stripeCount;
  const stripes = [];

  for (let i = 0; i < stripeCount; i++) {
    const x = -totalSpan / 2 + stripeSpacing / 2 + i * stripeSpacing;
    stripes.push(
      <mesh key={i} position={[x, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[stripeSpacing * 0.55, CROSSWALK_WIDTH]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    );
  }

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {stripes}
    </group>
  );
}

// Pavement Arrow Marking with cached texture
function RoadArrow({ position, rotationY = 0, type = 'straight' }) {
  const texture = getCachedPavementArrowTexture(type);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 4.4]} />
        <meshBasicMaterial map={texture} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Stop Sign with Octagonal Plate
function StopSign({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Pole */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.8, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Octagonal Red Plate */}
      <mesh position={[0, 2.7, 0.05]}>
        <cylinderGeometry args={[0.45, 0.45, 0.04, 8]} rotation={[Math.PI / 2, Math.PI / 8, 0]} />
        <meshStandardMaterial color="#cc1111" roughness={0.4} />
      </mesh>
      {/* White STOP lettering background */}
      <mesh position={[0, 2.7, 0.08]}>
        <boxGeometry args={[0.55, 0.22, 0.01]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// Raised Concrete Sidewalk with Pavers
function Sidewalk({ position, width, depth, texture }) {
  return (
    <group position={position}>
      <mesh position={[0, SIDEWALK_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[width, SIDEWALK_HEIGHT, depth]} />
        <meshStandardMaterial map={texture} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Intersection() {
  const armLen = ROAD_LENGTH - HALF_ROAD;
  const armCenter = (HALF_ROAD + ROAD_LENGTH) / 2;
  const medianCenter = (HALF_ROAD + 4 + ROAD_LENGTH - 2) / 2;
  const medianLen = ROAD_LENGTH - 2 - (HALF_ROAD + 4);

  const swWidth = SIDEWALK_WIDTH;
  const swCenter = HALF_ROAD + swWidth / 2;

  // Cached sidewalk texture matching CityChunk.jsx
  const sidewalkTileTex = useMemo(() => getCachedTileTexture('sidewalk_paving', 16, 2), []);

  return (
    <group>
      {/* Median Dividers with Steel Crash Barrier Fence (Primary Intersection specific) */}
      <MedianDivider position={[0, 0, -medianCenter]} length={medianLen} />
      <MedianDivider position={[0, 0, medianCenter]} length={medianLen} />
      <MedianDivider position={[medianCenter, 0, 0]} length={medianLen} rotation={Math.PI / 2} />
      <MedianDivider position={[-medianCenter, 0, 0]} length={medianLen} rotation={Math.PI / 2} />

      {/* Zebra Striped Crosswalks */}
      <ZebraCrosswalk position={[0, 0, -CROSSWALK_DISTANCE]} />
      <ZebraCrosswalk position={[0, 0, CROSSWALK_DISTANCE]} />
      <ZebraCrosswalk position={[CROSSWALK_DISTANCE, 0, 0]} rotationY={Math.PI / 2} />
      <ZebraCrosswalk position={[-CROSSWALK_DISTANCE, 0, 0]} rotationY={Math.PI / 2} />

      {/* Stop Bars (Solid White Line before crosswalk) */}
      {/* North approach (x > 0) */}
      <mesh position={[6.5, 0.02, -VEHICLE_STOP_DISTANCE]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11.4, 0.5]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* South approach (x < 0) */}
      <mesh position={[-6.5, 0.02, VEHICLE_STOP_DISTANCE]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11.4, 0.5]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* East approach (x > 0, z > 0) */}
      <mesh position={[VEHICLE_STOP_DISTANCE, 0.02, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 11.4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* West approach (x < 0, z < 0) */}
      <mesh position={[-VEHICLE_STOP_DISTANCE, 0.02, -6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 11.4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Pavement Turning Arrows */}
      {/* North Approach (Lane 0: Left, Lane 1: Straight, Lane 2: Straight+Right) */}
      <RoadArrow position={[LANE_OFFSETS[0], 0, -VEHICLE_STOP_DISTANCE - 5]} rotationY={0} type="left" />
      <RoadArrow position={[LANE_OFFSETS[0], 0, -VEHICLE_STOP_DISTANCE - 20]} rotationY={0} type="left" />
      <RoadArrow position={[LANE_OFFSETS[1], 0, -VEHICLE_STOP_DISTANCE - 5]} rotationY={0} type="straight" />
      <RoadArrow position={[LANE_OFFSETS[1], 0, -VEHICLE_STOP_DISTANCE - 20]} rotationY={0} type="straight" />
      <RoadArrow position={[LANE_OFFSETS[2], 0, -VEHICLE_STOP_DISTANCE - 5]} rotationY={0} type="straight_right" />
      <RoadArrow position={[LANE_OFFSETS[2], 0, -VEHICLE_STOP_DISTANCE - 20]} rotationY={0} type="straight_right" />

      {/* South Approach */}
      <RoadArrow position={[-LANE_OFFSETS[0], 0, VEHICLE_STOP_DISTANCE + 5]} rotationY={Math.PI} type="left" />
      <RoadArrow position={[-LANE_OFFSETS[0], 0, VEHICLE_STOP_DISTANCE + 20]} rotationY={Math.PI} type="left" />
      <RoadArrow position={[-LANE_OFFSETS[1], 0, VEHICLE_STOP_DISTANCE + 5]} rotationY={Math.PI} type="straight" />
      <RoadArrow position={[-LANE_OFFSETS[1], 0, VEHICLE_STOP_DISTANCE + 20]} rotationY={Math.PI} type="straight" />
      <RoadArrow position={[-LANE_OFFSETS[2], 0, VEHICLE_STOP_DISTANCE + 5]} rotationY={Math.PI} type="straight_right" />
      <RoadArrow position={[-LANE_OFFSETS[2], 0, VEHICLE_STOP_DISTANCE + 20]} rotationY={Math.PI} type="straight_right" />

      {/* East Approach (approaching from East towards center) */}
      <RoadArrow position={[VEHICLE_STOP_DISTANCE + 5, 0, LANE_OFFSETS[0]]} rotationY={-Math.PI / 2} type="left" />
      <RoadArrow position={[VEHICLE_STOP_DISTANCE + 20, 0, LANE_OFFSETS[0]]} rotationY={-Math.PI / 2} type="left" />
      <RoadArrow position={[VEHICLE_STOP_DISTANCE + 5, 0, LANE_OFFSETS[1]]} rotationY={-Math.PI / 2} type="straight" />
      <RoadArrow position={[VEHICLE_STOP_DISTANCE + 20, 0, LANE_OFFSETS[1]]} rotationY={-Math.PI / 2} type="straight" />
      <RoadArrow position={[VEHICLE_STOP_DISTANCE + 5, 0, LANE_OFFSETS[2]]} rotationY={-Math.PI / 2} type="straight_right" />
      <RoadArrow position={[VEHICLE_STOP_DISTANCE + 20, 0, LANE_OFFSETS[2]]} rotationY={-Math.PI / 2} type="straight_right" />

      {/* West Approach (approaching from West towards center) */}
      <RoadArrow position={[-VEHICLE_STOP_DISTANCE - 5, 0, -LANE_OFFSETS[0]]} rotationY={Math.PI / 2} type="left" />
      <RoadArrow position={[-VEHICLE_STOP_DISTANCE - 20, 0, -LANE_OFFSETS[0]]} rotationY={Math.PI / 2} type="left" />
      <RoadArrow position={[-VEHICLE_STOP_DISTANCE - 5, 0, -LANE_OFFSETS[1]]} rotationY={Math.PI / 2} type="straight" />
      <RoadArrow position={[-VEHICLE_STOP_DISTANCE - 20, 0, -LANE_OFFSETS[1]]} rotationY={Math.PI / 2} type="straight" />
      <RoadArrow position={[-VEHICLE_STOP_DISTANCE - 5, 0, -LANE_OFFSETS[2]]} rotationY={Math.PI / 2} type="straight_right" />
      <RoadArrow position={[-VEHICLE_STOP_DISTANCE - 20, 0, -LANE_OFFSETS[2]]} rotationY={Math.PI / 2} type="straight_right" />

      {/* Stop Signs at curb near stop line */}
      <StopSign position={[HALF_ROAD + 0.8, 0, -VEHICLE_STOP_DISTANCE]} rotationY={0} />
      <StopSign position={[-HALF_ROAD - 0.8, 0, VEHICLE_STOP_DISTANCE]} rotationY={Math.PI} />
      <StopSign position={[VEHICLE_STOP_DISTANCE, 0, HALF_ROAD + 0.8]} rotationY={-Math.PI / 2} />
      <StopSign position={[-VEHICLE_STOP_DISTANCE, 0, -HALF_ROAD - 0.8]} rotationY={Math.PI / 2} />

      {/* Sidewalks along roads */}
      <Sidewalk position={[swCenter, 0, -armCenter]} width={swWidth} depth={armLen} texture={sidewalkTileTex} />
      <Sidewalk position={[-swCenter, 0, -armCenter]} width={swWidth} depth={armLen} texture={sidewalkTileTex} />
      <Sidewalk position={[swCenter, 0, armCenter]} width={swWidth} depth={armLen} texture={sidewalkTileTex} />
      <Sidewalk position={[-swCenter, 0, armCenter]} width={swWidth} depth={armLen} texture={sidewalkTileTex} />

      <Sidewalk position={[armCenter, 0, -swCenter]} width={armLen} depth={swWidth} texture={sidewalkTileTex} />
      <Sidewalk position={[armCenter, 0, swCenter]} width={armLen} depth={swWidth} texture={sidewalkTileTex} />
      <Sidewalk position={[-armCenter, 0, -swCenter]} width={armLen} depth={swWidth} texture={sidewalkTileTex} />
      <Sidewalk position={[-armCenter, 0, swCenter]} width={armLen} depth={swWidth} texture={sidewalkTileTex} />

      {/* 4 Corner Sidewalk Plazas */}
      <Sidewalk position={[swCenter, 0, -swCenter]} width={swWidth} depth={swWidth} texture={sidewalkTileTex} />
      <Sidewalk position={[-swCenter, 0, -swCenter]} width={swWidth} depth={swWidth} texture={sidewalkTileTex} />
      <Sidewalk position={[swCenter, 0, swCenter]} width={swWidth} depth={swWidth} texture={sidewalkTileTex} />
      <Sidewalk position={[-swCenter, 0, swCenter]} width={swWidth} depth={swWidth} texture={sidewalkTileTex} />
    </group>
  );
}

export default React.memo(Intersection);
