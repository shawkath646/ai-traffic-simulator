import React, { useMemo } from 'react';
import * as THREE from 'three';
import InstancedBuildings from './InstancedBuildings';
import {
  Tree,
  BusStop,
  Bench,
  PlanterBox,
  SidewalkTreeGrate,
  Dumpster,
  TrashCan,
  Flowers,
  GrassPatch,
  GrassMix,
  FireHydrant,
  StreetLight,
} from './Environment';
import {
  ParkingLot,
  Fountain,
  ParkRock,
  PlazaStairs,
  OverheadNavigationGantry,
  BicycleRack,
  Bollard,
  CafeTableWithUmbrella,
} from './CityAmenities';
import { useGLTF, Clone } from '@react-three/drei';
import { getCachedPavementArrowTexture, getCachedTileTexture } from '../utils/textureHelpers';
import { ROAD_WIDTH, HALF_ROAD, LANE_OFFSETS } from '../utils/constants';

// Modular 3D floor tile by Quaternius from new-assets
export function ModularFloorTile({ position, scale = [1, 1, 1], rotation = [0, 0, 0] }) {
  const { scene } = useGLTF('/models/floor_tile.glb');
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Clone object={scene} receiveShadow />
    </group>
  );
}

// Modular 3D wood floor by Quaternius from new-assets
export function ModularWoodFloor({ position, scale = [1, 1, 1], rotation = [0, 0, 0] }) {
  const { scene } = useGLTF('/models/floor_wood.glb');
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Clone object={scene} receiveShadow />
    </group>
  );
}

// =========================================================================
// MASTER CITY URBAN PLANNING SPECIFICATION (270 ORGANIC MIXED BUILDINGS)
// Zero collisions, zero road encroachments, diverse architectural mixing, organic offsets
// =========================================================================
const MASTER_BUILDINGS = [
  { pos: [-46, 0.3, -45], type: 'hospital', rot: [0, Math.PI, 0], scale: 1 },
  { pos: [-30, 0.02, 32], type: 'church', rot: [0, -Math.PI / 2, 0], scale: 1.1 },
  { pos: [52, 0.3, 34], type: 'cinema', rot: [0, Math.PI, 0], scale: 1.05 },
  { pos: [27.12, 0.3, -28.99], type: 'kay_office_2', rot: [0, Math.PI / 2, 0], scale: 1.03 },
  { pos: [27.2, 0.3, -47.52], type: 'kay_office_2', rot: [0, -Math.PI / 2, 0], scale: 1.15 },
  { pos: [27.72, 0.3, -74.06], type: 'skyscraper', rot: [0, -Math.PI / 2, 0], scale: 1.08 },
  { pos: [26.27, 0.3, -96.37], type: 'kenney_a', rot: [0, 0, 0], scale: 1.02 },
  { pos: [25.47, 0.3, -112.06], type: 'kenney_g', rot: [0, -Math.PI / 2, 0], scale: 1.14 },
  { pos: [51.47, 0.3, -28.67], type: 'kenney_g', rot: [0, Math.PI, 0], scale: 1.03 },
  { pos: [71, 0.3, -25.07], type: 'kenney_a', rot: [0, 0, 0], scale: 1.1 },
  { pos: [93.27, 0.3, -29.38], type: 'skyscraper', rot: [0, Math.PI / 2, 0], scale: 1 },
  { pos: [113, 0.3, -28.94], type: 'kenney_a', rot: [0, Math.PI / 2, 0], scale: 0.99 },
  { pos: [48.95, 0.3, -110.61], type: 'kay_office_2', rot: [0, 6.28, 0], scale: 1.12 },
  { pos: [70.14, 0.3, -111.58], type: 'kenney_a', rot: [0, 6.28, 0], scale: 1.07 },
  { pos: [94.48, 0.3, -109.99], type: 'house_modern', rot: [0, Math.PI, 0], scale: 1.03 },
  { pos: [108.73, 0.3, -111.65], type: 'kenney_a', rot: [0, Math.PI / 2, 0], scale: 1.18 },
  { pos: [113.18, 0.3, -51.09], type: 'apartment', rot: [0, Math.PI, 0], scale: 1.1 },
  { pos: [111.02, 0.3, -71.84], type: 'kay_office_2', rot: [0, 4.71, 0], scale: 1.02 },
  { pos: [110.11, 0.3, -93.31], type: 'skyscraper', rot: [0, 0, 0], scale: 1.06 },
  { pos: [47.58, 0.3, -49.51], type: 'house_villa', rot: [0, -Math.PI / 2, 0], scale: 0.99 },
  { pos: [45.69, 0.3, -69.54], type: 'house_villa', rot: [0, 0, 0], scale: 1.11 },
  { pos: [96.1, 0.3, -46.68], type: 'business', rot: [0, 0, 0], scale: 1.19 },
  { pos: [92.37, 0.3, -71.17], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 0.99 },
  { pos: [94.09, 0.3, -92.47], type: 'kay_office_1', rot: [0, Math.PI / 2, 0], scale: 1.15 },
  { pos: [-29.01, 0.3, -70.64], type: 'skyscraper_kenney', rot: [0, Math.PI / 2, 0], scale: 1.08 },
  { pos: [-24.93, 0.3, -92.8], type: 'house_modern', rot: [0, Math.PI, 0], scale: 0.93 },
  { pos: [-29.47, 0.3, -109.86], type: 'business', rot: [0, 0, 0], scale: 1.12 },
  { pos: [-77.15, 0.3, -26.52], type: 'house_villa', rot: [0, -Math.PI / 2, 0], scale: 1.14 },
  { pos: [-95.38, 0.3, -28.53], type: 'kay_office_2', rot: [0, Math.PI, 0], scale: 0.98 },
  { pos: [-112.18, 0.3, -28.85], type: 'apartment', rot: [0, -Math.PI / 2, 0], scale: 1.01 },
  { pos: [-46.64, 0.3, -113.38], type: 'skyscraper_kenney', rot: [0, Math.PI, 0], scale: 0.92 },
  { pos: [-70.04, 0.3, -110.44], type: 'apartment', rot: [0, Math.PI, 0], scale: 0.98 },
  { pos: [-91.63, 0.3, -111.87], type: 'business', rot: [0, Math.PI / 2, 0], scale: 1 },
  { pos: [-111.06, 0.3, -110.8], type: 'skyscraper', rot: [0, 4.71, 0], scale: 1.11 },
  { pos: [-114.49, 0.3, -49.11], type: 'kay_office_2', rot: [0, Math.PI / 2, 0], scale: 0.94 },
  { pos: [-111.4, 0.3, -73.52], type: 'business', rot: [0, Math.PI / 2, 0], scale: 1.12 },
  { pos: [-111.37, 0.3, -92.28], type: 'house_villa', rot: [0, -Math.PI, 0], scale: 1.12 },
  { pos: [-48.07, 0.3, -79.37], type: 'apartment', rot: [0, 0, 0], scale: 0.94 },
  { pos: [-50.01, 0.3, -94.69], type: 'house_villa', rot: [0, Math.PI, 0], scale: 1.01 },
  { pos: [-74.09, 0.3, -78.07], type: 'house_villa', rot: [0, 0, 0], scale: 1.08 },
  { pos: [-75.22, 0.3, -95.01], type: 'kenney_a', rot: [0, Math.PI, 0], scale: 1.13 },
  { pos: [-96.71, 0.3, -50.32], type: 'apartment', rot: [0, Math.PI, 0], scale: 0.97 },
  { pos: [-99.32, 0.3, -71.11], type: 'apartment', rot: [0, -Math.PI / 2, 0], scale: 1.06 },
  { pos: [-28.67, 0.2, 59.15], type: 'kay_office_2', rot: [0, Math.PI / 2, 0], scale: 0.95 },
  { pos: [-26.84, 0.2, 82.92], type: 'kenney_g', rot: [0, Math.PI / 2, 0], scale: 1.06 },
  { pos: [-28.3, 0.2, 107], type: 'kenney_g', rot: [0, 4.71, 0], scale: 0.95 },
  { pos: [-50.48, 0.2, 112.14], type: 'quaternius', rot: [0, 0, 0], scale: 1.01 },
  { pos: [-75.99, 0.2, 112.69], type: 'quaternius', rot: [0, Math.PI, 0], scale: 0.93 },
  { pos: [-94.41, 0.2, 112.49], type: 'apartment', rot: [0, Math.PI, 0], scale: 1.06 },
  { pos: [-111.72, 0.2, 110.06], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 0.92 },
  { pos: [-111.42, 0.2, 37.2], type: 'kay_office_1', rot: [0, Math.PI / 2, 0], scale: 1.09 },
  { pos: [-114.32, 0.2, 60.86], type: 'house_villa', rot: [0, -Math.PI / 2, 0], scale: 0.97 },
  { pos: [-110.96, 0.2, 82.33], type: 'kay_office_1', rot: [0, 0, 0], scale: 0.92 },
  { pos: [-61.73, 0.2, 27.87], type: 'house_villa', rot: [0, Math.PI, 0], scale: 0.92 },
  { pos: [-79.64, 0.2, 27.52], type: 'house_modern', rot: [0, Math.PI, 0], scale: 0.92 },
  { pos: [29.19, 0.3, 35.37], type: 'skyscraper', rot: [0, -Math.PI / 2, 0], scale: 1.05 },
  { pos: [28.51, 0.3, 54.1], type: 'business', rot: [0, -Math.PI, 0], scale: 1.1 },
  { pos: [28.05, 0.3, 75.89], type: 'skyscraper_kenney', rot: [0, Math.PI / 2, 0], scale: 0.92 },
  { pos: [26.17, 0.3, 95.59], type: 'skyscraper_kenney', rot: [0, 0, 0], scale: 1.06 },
  { pos: [27.71, 0.3, 113.33], type: 'skyscraper', rot: [0, Math.PI / 2, 0], scale: 0.95 },
  { pos: [79.18, 0.3, 26.39], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 0.98 },
  { pos: [99.39, 0.3, 29.41], type: 'kenney_a', rot: [0, 6.28, 0], scale: 1.01 },
  { pos: [115.28, 0.3, 25.96], type: 'house_modern', rot: [0, 4.71, 0], scale: 0.95 },
  { pos: [116.16, 0.2, 53.43], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 1.12 },
  { pos: [116.27, 0.2, 77.24], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 1.12 },
  { pos: [112.65, 0.2, 97.41], type: 'house_modern', rot: [0, 0, 0], scale: 1.13 },
  { pos: [114.4, 0.2, 114.43], type: 'house_modern', rot: [0, 0, 0], scale: 0.92 },
  { pos: [49.21, 0.2, 113.51], type: 'business', rot: [0, Math.PI / 2, 0], scale: 0.97 },
  { pos: [71.39, 0.2, 111.99], type: 'apartment', rot: [0, Math.PI / 2, 0], scale: 1.07 },
  { pos: [92.64, 0.2, 111.63], type: 'house_villa', rot: [0, -Math.PI / 2, 0], scale: 1.02 },
  { pos: [80.44, 0.3, 49.45], type: 'kenney_a', rot: [0, Math.PI / 2, 0], scale: 0.96 },
  { pos: [101.36, 0.3, 51.99], type: 'kay_office_2', rot: [0, 0, 0], scale: 1.14 },
  { pos: [50.98, 0.2, 75.01], type: 'skyscraper', rot: [0, 0, 0], scale: 1.07 },
  { pos: [72.69, 0.2, 73.86], type: 'house_villa', rot: [0, 0, 0], scale: 1.1 },
  { pos: [94.9, 0.2, 72.37], type: 'kay_office_2', rot: [0, 0, 0], scale: 0.92 },
  { pos: [51.64, 0.2, 94.08], type: 'skyscraper', rot: [0, 0, 0], scale: 1.14 },
  { pos: [71.4, 0.2, 91.77], type: 'quaternius', rot: [0, Math.PI, 0], scale: 1.04 },
  { pos: [93.38, 0.2, 96.39], type: 'kay_office_1', rot: [0, Math.PI / 2, 0], scale: 1.1 },
  { pos: [160.31, 0.3, -29.71], type: 'kenney_g', rot: [0, Math.PI / 2, 0], scale: 1.13 },
  { pos: [159.94, 0.2, -56.14], type: 'skyscraper_kenney', rot: [0, Math.PI / 2, 0], scale: 1.04 },
  { pos: [160.22, 0.3, -86.9], type: 'apartment', rot: [0, Math.PI / 2, 0], scale: 1.11 },
  { pos: [156.88, 0.2, -113.44], type: 'skyscraper_kenney', rot: [0, 0, 0], scale: 0.99 },
  { pos: [184.46, 0.3, -28.05], type: 'kay_office_1', rot: [0, -Math.PI / 2, 0], scale: 0.97 },
  { pos: [186.69, 0.3, -58.98], type: 'skyscraper_kenney', rot: [0, Math.PI / 2, 0], scale: 1.11 },
  { pos: [185.31, 0.3, -85.71], type: 'quaternius', rot: [0, -Math.PI / 2, 0], scale: 1.06 },
  { pos: [188.85, 0.3, -112.49], type: 'kay_office_1', rot: [0, -Math.PI / 2, 0], scale: 1.1 },
  { pos: [212.64, 0.3, -25.2], type: 'kenney_g', rot: [0, 0, 0], scale: 1.09 },
  { pos: [213.21, 0.3, -58.5], type: 'house_villa', rot: [0, Math.PI, 0], scale: 1.1 },
  { pos: [212.31, 0.2, -85.46], type: 'kay_office_1', rot: [0, -Math.PI / 2, 0], scale: 0.99 },
  { pos: [212.05, 0.3, -110.35], type: 'kay_office_1', rot: [0, -Math.PI / 2, 0], scale: 1.04 },
  { pos: [240.58, 0.3, -25.43], type: 'skyscraper_kenney', rot: [0, 0, 0], scale: 1.12 },
  { pos: [235.23, 0.3, -58.97], type: 'apartment', rot: [0, -Math.PI / 2, 0], scale: 1.08 },
  { pos: [236.93, 0.2, -84.04], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 0.98 },
  { pos: [235.01, 0.3, -111.3], type: 'kay_office_1', rot: [0, Math.PI / 2, 0], scale: 1.13 },
  { pos: [28.02, 0.2, -158.61], type: 'house_villa', rot: [0, Math.PI / 2, 0], scale: 0.93 },
  { pos: [25.27, 0.3, -188.26], type: 'apartment', rot: [0, 6.28, 0], scale: 1.13 },
  { pos: [25.31, 0.3, -213.69], type: 'kay_office_2', rot: [0, Math.PI / 2, 0], scale: 1.12 },
  { pos: [30.27, 0.3, -239.19], type: 'kenney_a', rot: [0, 4.71, 0], scale: 0.99 },
  { pos: [57.48, 0.3, -158.61], type: 'quaternius', rot: [0, Math.PI, 0], scale: 1.03 },
  { pos: [53.08, 0.2, -184.22], type: 'kay_office_2', rot: [0, Math.PI / 2, 0], scale: 1.09 },
  { pos: [53.59, 0.3, -209.9], type: 'kay_office_1', rot: [0, Math.PI, 0], scale: 1.03 },
  { pos: [54.76, 0.2, -239.89], type: 'house_villa', rot: [0, Math.PI / 2, 0], scale: 1.13 },
  { pos: [86.71, 0.3, -161.69], type: 'kay_office_1', rot: [0, Math.PI / 2, 0], scale: 1.04 },
  { pos: [82.78, 0.3, -187.54], type: 'house_villa', rot: [0, Math.PI / 2, 0], scale: 1.05 },
  { pos: [85.9, 0.3, -211.31], type: 'skyscraper', rot: [0, 6.28, 0], scale: 1 },
  { pos: [85.41, 0.3, -237.28], type: 'skyscraper_kenney', rot: [0, Math.PI / 2, 0], scale: 0.98 },
  { pos: [111.44, 0.2, -159.31], type: 'kay_office_2', rot: [0, Math.PI, 0], scale: 1.05 },
  { pos: [110.11, 0.3, -183.27], type: 'skyscraper_kenney', rot: [0, Math.PI, 0], scale: 1.07 },
  { pos: [111.58, 0.3, -209.41], type: 'house_villa', rot: [0, 4.71, 0], scale: 1.11 },
  { pos: [111.56, 0.2, -235.62], type: 'kenney_a', rot: [0, Math.PI / 2, 0], scale: 1.03 },
  { pos: [160.19, 0.3, -162.15], type: 'apartment', rot: [0, 0, 0], scale: 1.12 },
  { pos: [157.21, 0.3, -188.48], type: 'business', rot: [0, 0, 0], scale: 1.01 },
  { pos: [159.15, 0.2, -214.86], type: 'skyscraper', rot: [0, 0, 0], scale: 1 },
  { pos: [161.74, 0.3, -239.17], type: 'skyscraper_kenney', rot: [0, 0, 0], scale: 0.93 },
  { pos: [186.71, 0.3, -161.67], type: 'skyscraper', rot: [0, Math.PI, 0], scale: 1.11 },
  { pos: [184.2, 0.3, -188.23], type: 'kay_office_1', rot: [0, Math.PI / 2, 0], scale: 0.94 },
  { pos: [188.75, 0.2, -212.72], type: 'house_modern', rot: [0, 0, 0], scale: 0.95 },
  { pos: [183.28, 0.3, -239.4], type: 'quaternius', rot: [0, Math.PI / 2, 0], scale: 0.97 },
  { pos: [215.12, 0.3, -162.14], type: 'kay_office_2', rot: [0, Math.PI / 2, 0], scale: 1.09 },
  { pos: [208.82, 0.3, -186.81], type: 'kenney_a', rot: [0, Math.PI, 0], scale: 0.94 },
  { pos: [211.71, 0.3, -213.67], type: 'kenney_a', rot: [0, Math.PI, 0], scale: 1.03 },
  { pos: [213.11, 0.3, -240.58], type: 'business', rot: [0, -Math.PI / 2, 0], scale: 1 },
  { pos: [241.17, 0.3, -161.43], type: 'business', rot: [0, -Math.PI / 2, 0], scale: 1.14 },
  { pos: [239.61, 0.3, -188.46], type: 'kay_office_1', rot: [0, 0, 0], scale: 1.08 },
  { pos: [236.57, 0.2, -209.16], type: 'kay_office_2', rot: [0, -Math.PI / 2, 0], scale: 1.11 },
  { pos: [240.58, 0.2, -240.58], type: 'skyscraper', rot: [0, Math.PI / 2, 0], scale: 1.1 },
  { pos: [-157.02, 0.2, -25.39], type: 'quaternius', rot: [0, -Math.PI / 2, 0], scale: 1.1 },
  { pos: [-158.11, 0.3, -54.66], type: 'kay_office_1', rot: [0, -Math.PI / 2, 0], scale: 0.98 },
  { pos: [-158.54, 0.3, -81.86], type: 'quaternius', rot: [0, Math.PI, 0], scale: 1.04 },
  { pos: [-162.59, 0.3, -111.25], type: 'kenney_a', rot: [0, Math.PI, 0], scale: 1.11 },
  { pos: [-187.72, 0.3, -28.71], type: 'skyscraper_kenney', rot: [0, Math.PI / 2, 0], scale: 1.06 },
  { pos: [-186.2, 0.3, -56.08], type: 'skyscraper', rot: [0, Math.PI / 2, 0], scale: 0.96 },
  { pos: [-188.29, 0.2, -85.65], type: 'house_modern', rot: [0, Math.PI, 0], scale: 1.1 },
  { pos: [-185.47, 0.3, -108.88], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 1.11 },
  { pos: [-214.39, 0.3, -30.83], type: 'kay_office_2', rot: [0, Math.PI, 0], scale: 1.08 },
  { pos: [-214.52, 0.3, -54.18], type: 'house_modern', rot: [0, Math.PI, 0], scale: 1.07 },
  { pos: [-209.74, 0.3, -83.99], type: 'business', rot: [0, Math.PI, 0], scale: 0.93 },
  { pos: [-210.71, 0.3, -111.72], type: 'kenney_g', rot: [0, 0, 0], scale: 0.97 },
  { pos: [-234.89, 0.3, -29.64], type: 'kenney_a', rot: [0, Math.PI, 0], scale: 1.02 },
  { pos: [-240.95, 0.3, -53.23], type: 'quaternius', rot: [0, -Math.PI / 2, 0], scale: 0.95 },
  { pos: [-239.97, 0.3, -81.14], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 1.05 },
  { pos: [-236.19, 0.3, -111.24], type: 'quaternius', rot: [0, Math.PI, 0], scale: 0.95 },
  { pos: [-30.3, 0.3, -161.4], type: 'business', rot: [0, Math.PI, 0], scale: 0.95 },
  { pos: [-27.35, 0.3, -187.49], type: 'kenney_g', rot: [0, Math.PI / 2, 0], scale: 1.12 },
  { pos: [-28.03, 0.3, -209.37], type: 'kay_office_1', rot: [0, Math.PI / 2, 0], scale: 1.09 },
  { pos: [-30.18, 0.3, -237.71], type: 'house_villa', rot: [0, Math.PI / 2, 0], scale: 0.94 },
  { pos: [-53.28, 0.3, -159.98], type: 'kenney_g', rot: [0, Math.PI / 2, 0], scale: 0.95 },
  { pos: [-58.39, 0.3, -188.43], type: 'business', rot: [0, 4.71, 0], scale: 0.99 },
  { pos: [-58.59, 0.3, -210.55], type: 'skyscraper_kenney', rot: [0, 6.28, 0], scale: 1.12 },
  { pos: [-58.13, 0.3, -236.99], type: 'house_villa', rot: [0, Math.PI / 2, 0], scale: 0.98 },
  { pos: [-82.89, 0.3, -161.63], type: 'quaternius', rot: [0, Math.PI, 0], scale: 1.09 },
  { pos: [-81.13, 0.3, -183.93], type: 'kay_office_2', rot: [0, Math.PI, 0], scale: 1.07 },
  { pos: [-85.12, 0.3, -210.55], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 1 },
  { pos: [-86.33, 0.3, -239.36], type: 'skyscraper', rot: [0, Math.PI / 2, 0], scale: 0.95 },
  { pos: [-110.61, 0.3, -157.83], type: 'quaternius', rot: [0, 4.71, 0], scale: 0.99 },
  { pos: [-112.64, 0.3, -184.63], type: 'quaternius', rot: [0, 4.71, 0], scale: 0.99 },
  { pos: [-111.89, 0.2, -213.62], type: 'business', rot: [0, Math.PI, 0], scale: 1.01 },
  { pos: [-112.62, 0.3, -236.27], type: 'quaternius', rot: [0, Math.PI / 2, 0], scale: 1.12 },
  { pos: [-160.7, 0.2, -159.25], type: 'apartment', rot: [0, Math.PI / 2, 0], scale: 0.97 },
  { pos: [-157.99, 0.3, -188.42], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 1.05 },
  { pos: [-163.17, 0.3, -211.25], type: 'quaternius', rot: [0, -Math.PI / 2, 0], scale: 1.01 },
  { pos: [-161.29, 0.3, -238.4], type: 'house_modern', rot: [0, Math.PI, 0], scale: 0.93 },
  { pos: [-189.03, 0.3, -157.35], type: 'skyscraper', rot: [0, Math.PI, 0], scale: 1.08 },
  { pos: [-185.85, 0.3, -186.76], type: 'kay_office_2', rot: [0, -Math.PI / 2, 0], scale: 1.11 },
  { pos: [-188.41, 0.2, -214.09], type: 'kay_office_2', rot: [0, -Math.PI / 2, 0], scale: 1.09 },
  { pos: [-188.19, 0.3, -237.21], type: 'apartment', rot: [0, 0, 0], scale: 1.09 },
  { pos: [-209.06, 0.3, -162.8], type: 'apartment', rot: [0, Math.PI / 2, 0], scale: 0.96 },
  { pos: [-209.67, 0.3, -183.91], type: 'house_modern', rot: [0, 0, 0], scale: 1.01 },
  { pos: [-213.89, 0.2, -213.61], type: 'kay_office_1', rot: [0, 0, 0], scale: 1.07 },
  { pos: [-213.2, 0.2, -236.97], type: 'house_villa', rot: [0, 0, 0], scale: 1.02 },
  { pos: [-237.86, 0.3, -160.66], type: 'skyscraper_kenney', rot: [0, Math.PI / 2, 0], scale: 1.13 },
  { pos: [-240.13, 0.3, -184.14], type: 'apartment', rot: [0, Math.PI / 2, 0], scale: 1.05 },
  { pos: [-237.48, 0.3, -214.08], type: 'quaternius', rot: [0, Math.PI, 0], scale: 1.06 },
  { pos: [-240.58, 0.2, -235.54], type: 'business', rot: [0, Math.PI, 0], scale: 1.02 },
  { pos: [157.11, 0.3, 26.4], type: 'skyscraper_kenney', rot: [0, 0, 0], scale: 1 },
  { pos: [161.71, 0.3, 56.68], type: 'skyscraper_kenney', rot: [0, -Math.PI / 2, 0], scale: 1.08 },
  { pos: [160.56, 0.3, 82.64], type: 'kenney_g', rot: [0, 0, 0], scale: 1.1 },
  { pos: [162.21, 0.3, 112.8], type: 'kenney_g', rot: [0, 0, 0], scale: 0.93 },
  { pos: [188.36, 0.3, 30.91], type: 'quaternius', rot: [0, 0, 0], scale: 1.08 },
  { pos: [189.18, 0.3, 56.68], type: 'kenney_a', rot: [0, 0, 0], scale: 0.95 },
  { pos: [186.37, 0.3, 86.67], type: 'kenney_a', rot: [0, Math.PI, 0], scale: 1.07 },
  { pos: [188.49, 0.3, 110.2], type: 'quaternius', rot: [0, -Math.PI / 2, 0], scale: 1.06 },
  { pos: [210.85, 0.3, 30.2], type: 'kenney_a', rot: [0, Math.PI / 2, 0], scale: 1 },
  { pos: [210, 0.3, 53.61], type: 'kay_office_2', rot: [0, -Math.PI / 2, 0], scale: 0.96 },
  { pos: [214.08, 0.3, 83.36], type: 'kay_office_1', rot: [0, Math.PI, 0], scale: 1.02 },
  { pos: [209.41, 0.3, 113.38], type: 'quaternius', rot: [0, Math.PI / 2, 0], scale: 0.99 },
  { pos: [238.44, 0.3, 29.13], type: 'kay_office_2', rot: [0, Math.PI / 2, 0], scale: 0.96 },
  { pos: [238.79, 0.3, 57.41], type: 'house_modern', rot: [0, 0, 0], scale: 0.98 },
  { pos: [238.36, 0.3, 82.07], type: 'kay_office_1', rot: [0, Math.PI / 2, 0], scale: 1.12 },
  { pos: [239.3, 0.3, 111.65], type: 'skyscraper_kenney', rot: [0, -Math.PI / 2, 0], scale: 1.01 },
  { pos: [27.34, 0.2, 161.89], type: 'quaternius', rot: [0, 0, 0], scale: 0.95 },
  { pos: [31, 0.3, 186.5], type: 'skyscraper', rot: [0, Math.PI / 2, 0], scale: 1 },
  { pos: [29.63, 0.3, 209.64], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 1.03 },
  { pos: [25.36, 0.3, 239.83], type: 'apartment', rot: [0, Math.PI, 0], scale: 1.11 },
  { pos: [54.71, 0.3, 162.4], type: 'kenney_a', rot: [0, 0, 0], scale: 1.09 },
  { pos: [57.43, 0.3, 187.5], type: 'business', rot: [0, Math.PI / 2, 0], scale: 1.04 },
  { pos: [57.24, 0.2, 213.24], type: 'house_modern', rot: [0, Math.PI, 0], scale: 1.04 },
  { pos: [56.28, 0.3, 235.37], type: 'apartment', rot: [0, Math.PI, 0], scale: 0.94 },
  { pos: [84.69, 0.3, 158.42], type: 'quaternius', rot: [0, 0, 0], scale: 1.03 },
  { pos: [82.19, 0.3, 186.12], type: 'kay_office_1', rot: [0, -Math.PI / 2, 0], scale: 0.95 },
  { pos: [85.32, 0.2, 210.2], type: 'kenney_a', rot: [0, -Math.PI / 2, 0], scale: 0.99 },
  { pos: [83.42, 0.3, 239.21], type: 'kay_office_2', rot: [0, -Math.PI / 2, 0], scale: 1 },
  { pos: [113.01, 0.3, 158.46], type: 'kenney_a', rot: [0, 0, 0], scale: 1.06 },
  { pos: [113.83, 0.3, 184.5], type: 'skyscraper_kenney', rot: [0, Math.PI / 2, 0], scale: 1.02 },
  { pos: [109.62, 0.3, 209.06], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 0.96 },
  { pos: [108.9, 0.3, 240.67], type: 'skyscraper', rot: [0, -Math.PI / 2, 0], scale: 0.94 },
  { pos: [161.81, 0.3, 158.27], type: 'kay_office_2', rot: [0, Math.PI, 0], scale: 1.04 },
  { pos: [161.68, 0.3, 184.78], type: 'skyscraper', rot: [0, Math.PI, 0], scale: 1.11 },
  { pos: [158.65, 0.3, 211.95], type: 'kay_office_1', rot: [0, 0, 0], scale: 1.01 },
  { pos: [161.25, 0.3, 235.5], type: 'kenney_g', rot: [0, Math.PI / 2, 0], scale: 1.03 },
  { pos: [184.81, 0.3, 159.97], type: 'apartment', rot: [0, Math.PI / 2, 0], scale: 1.03 },
  { pos: [185.87, 0.3, 189.1], type: 'business', rot: [0, -Math.PI / 2, 0], scale: 1.07 },
  { pos: [186.15, 0.3, 214.6], type: 'house_modern', rot: [0, -Math.PI / 2, 0], scale: 1.01 },
  { pos: [187.8, 0.2, 238.63], type: 'kay_office_2', rot: [0, -Math.PI / 2, 0], scale: 0.93 },
  { pos: [212.55, 0.3, 159.31], type: 'quaternius', rot: [0, Math.PI, 0], scale: 1.11 },
  { pos: [210.53, 0.3, 186.77], type: 'house_modern', rot: [0, Math.PI, 0], scale: 0.97 },
  { pos: [209.87, 0.3, 212.75], type: 'kay_office_2', rot: [0, Math.PI, 0], scale: 1.03 },
  { pos: [212.7, 0.3, 239.38], type: 'quaternius', rot: [0, 0, 0], scale: 1.13 },
  { pos: [240.77, 0.3, 158.4], type: 'house_modern', rot: [0, 0, 0], scale: 1.13 },
  { pos: [237.8, 0.3, 186.34], type: 'kay_office_1', rot: [0, 0, 0], scale: 1.11 },
  { pos: [238.32, 0.3, 214.93], type: 'business', rot: [0, Math.PI / 2, 0], scale: 1.13 },
  { pos: [238.08, 0.3, 239.9], type: 'kenney_a', rot: [0, Math.PI / 2, 0], scale: 1.06 },
  { pos: [-158.81, 0.3, 27.39], type: 'apartment', rot: [0, 0, 0], scale: 0.95 },
  { pos: [-160.59, 0.3, 53.54], type: 'kay_office_1', rot: [0, Math.PI / 2, 0], scale: 1.12 },
  { pos: [-163.15, 0.3, 82.47], type: 'business', rot: [0, Math.PI / 2, 0], scale: 0.96 },
  { pos: [-157.95, 0.2, 109.92], type: 'house_villa', rot: [0, 0, 0], scale: 1 },
  { pos: [-188.04, 0.3, 26.02], type: 'skyscraper', rot: [0, Math.PI / 2, 0], scale: 1.08 },
  { pos: [-186.51, 0.3, 56.9], type: 'apartment', rot: [0, Math.PI / 2, 0], scale: 1.07 },
  { pos: [-183.62, 0.3, 86.3], type: 'kenney_g', rot: [0, 0, 0], scale: 1.02 },
  { pos: [-183.62, 0.3, 109.96], type: 'kenney_a', rot: [0, Math.PI / 2, 0], scale: 1.03 },
  { pos: [-210.4, 0.3, 30.8], type: 'house_villa', rot: [0, 0, 0], scale: 0.93 },
  { pos: [-209.82, 0.3, 55.76], type: 'kay_office_1', rot: [0, Math.PI, 0], scale: 1.03 },
  { pos: [-212.14, 0.3, 81.37], type: 'kay_office_1', rot: [0, 0, 0], scale: 0.96 },
  { pos: [-208.83, 0.3, 109.77], type: 'kay_office_2', rot: [0, Math.PI, 0], scale: 1 },
  { pos: [-236.56, 0.3, 31.08], type: 'house_modern', rot: [0, -Math.PI / 2, 0], scale: 1.02 },
  { pos: [-241.19, 0.2, 58.65], type: 'house_villa', rot: [0, Math.PI, 0], scale: 1.09 },
  { pos: [-240.19, 0.3, 82.6], type: 'house_villa', rot: [0, -Math.PI / 2, 0], scale: 1.05 },
  { pos: [-237.83, 0.3, 111.47], type: 'apartment', rot: [0, Math.PI / 2, 0], scale: 0.99 },
  { pos: [-28.37, 0.3, 160.99], type: 'kay_office_1', rot: [0, -Math.PI / 2, 0], scale: 0.98 },
  { pos: [-29.68, 0.2, 184.9], type: 'kay_office_1', rot: [0, Math.PI / 2, 0], scale: 1.09 },
  { pos: [-29.63, 0.3, 213.73], type: 'kenney_g', rot: [0, 0, 0], scale: 0.95 },
  { pos: [-26.08, 0.3, 236.8], type: 'kenney_g', rot: [0, 0, 0], scale: 1.07 },
  { pos: [-57.71, 0.3, 158.67], type: 'quaternius', rot: [0, Math.PI, 0], scale: 1.1 },
  { pos: [-53.57, 0.3, 183.05], type: 'house_villa', rot: [0, -Math.PI / 2, 0], scale: 1.1 },
  { pos: [-58.73, 0.3, 214.48], type: 'house_villa', rot: [0, -Math.PI / 2, 0], scale: 0.93 },
  { pos: [-58.27, 0.2, 235.9], type: 'house_modern', rot: [0, Math.PI / 2, 0], scale: 1.1 },
  { pos: [-84.44, 0.3, 158.24], type: 'skyscraper', rot: [0, Math.PI, 0], scale: 1.02 },
  { pos: [-85.51, 0.2, 185.23], type: 'skyscraper', rot: [0, Math.PI, 0], scale: 0.99 },
  { pos: [-80.96, 0.3, 215], type: 'kay_office_1', rot: [0, -Math.PI / 2, 0], scale: 1.07 },
  { pos: [-81.44, 0.2, 236.89], type: 'apartment', rot: [0, Math.PI / 2, 0], scale: 1.14 },
  { pos: [-112.83, 0.2, 161.84], type: 'skyscraper_kenney', rot: [0, Math.PI / 2, 0], scale: 1.03 },
  { pos: [-110.59, 0.3, 187.17], type: 'quaternius', rot: [0, Math.PI, 0], scale: 1.03 },
  { pos: [-113.38, 0.3, 211.01], type: 'apartment', rot: [0, -Math.PI / 2, 0], scale: 1.02 },
  { pos: [-112.68, 0.3, 235.51], type: 'skyscraper_kenney', rot: [0, -Math.PI / 2, 0], scale: 1.05 },
  { pos: [-160.75, 0.2, 158.8], type: 'house_modern', rot: [0, 0, 0], scale: 0.97 },
  { pos: [-159.45, 0.2, 184.6], type: 'skyscraper_kenney', rot: [0, -Math.PI / 2, 0], scale: 1.1 },
  { pos: [-161.06, 0.3, 211.06], type: 'skyscraper', rot: [0, -Math.PI / 2, 0], scale: 1.05 },
  { pos: [-157.04, 0.2, 240.3], type: 'house_villa', rot: [0, Math.PI / 2, 0], scale: 1.12 },
  { pos: [-184.06, 0.3, 157.66], type: 'skyscraper', rot: [0, Math.PI, 0], scale: 0.94 },
  { pos: [-187.97, 0.3, 186.07], type: 'house_villa', rot: [0, -Math.PI / 2, 0], scale: 1.03 },
  { pos: [-186.27, 0.3, 210.87], type: 'kenney_g', rot: [0, Math.PI / 2, 0], scale: 1.02 },
  { pos: [-183.19, 0.3, 240.58], type: 'house_modern', rot: [0, Math.PI, 0], scale: 0.99 },
  { pos: [-209.02, 0.3, 160.55], type: 'kenney_g', rot: [0, -Math.PI / 2, 0], scale: 1 },
  { pos: [-209.62, 0.3, 187.3], type: 'kay_office_2', rot: [0, Math.PI / 2, 0], scale: 1.13 },
  { pos: [-208.86, 0.3, 212.57], type: 'business', rot: [0, Math.PI, 0], scale: 1.01 },
  { pos: [-211.01, 0.3, 238.49], type: 'kay_office_1', rot: [0, -Math.PI / 2, 0], scale: 0.94 },
  { pos: [-239.92, 0.2, 163.2], type: 'skyscraper', rot: [0, 0, 0], scale: 1 },
  { pos: [-235.07, 0.3, 184.02], type: 'skyscraper_kenney', rot: [0, -Math.PI / 2, 0], scale: 1.02 },
  { pos: [-239.52, 0.3, 211.9], type: 'house_villa', rot: [0, Math.PI / 2, 0], scale: 1.09 },
  { pos: [-238.34, 0.3, 236.16], type: 'quaternius', rot: [0, Math.PI, 0], scale: 1.07 },
];

// Lane line divider offsets
const LINE_01 = 4.6;
const LINE_12 = 8.4;
const SHOULDER = 11.9;

// Dashed lane line parameters
const DASH_LEN = 2.0;
const GAP_LEN = 2.5;
const PITCH = DASH_LEN + GAP_LEN; // 4.5m
const DASHES_PER_SEG = 22;

// Segments for all primary avenues (between intersections)
// Inner segments: [-117, -18] and [18, 117] (length 99m)
// Outer segments: [-256, -153] and [153, 256] (length 103m)
const SEG_STARTS = [-256, -117, 18, 153];

// Instanced dashed lane lines count (2112 dashes covering all 6 primary 3-lane avenues)
const TOTAL_DASHES = DASHES_PER_SEG * 4 * 4 * 6; // 2112

function CityChunk() {
  const { scene: rawPondScene } = useGLTF('/models/pond.glb');

  // Prepare pond scene with realistic crystal-clear water and shadow flags
  const pondScene = useMemo(() => {
    const cloned = rawPondScene.clone(true);
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const matName = child.material.name || '';
          if (matName === '039BE5' || matName === '00BCD4') {
            child.material = new THREE.MeshStandardMaterial({
              color: matName === '039BE5' ? new THREE.Color('#0284c7') : new THREE.Color('#38bdf8'),
              roughness: 0.12,
              metalness: 0.15,
              transparent: true,
              opacity: 0.90,
            });
          }
        }
      }
    });
    return cloned;
  }, [rawPondScene]);

  // Instanced dashed lane lines mesh
  const dashedMesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.18, DASH_LEN);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const mesh = new THREE.InstancedMesh(geo, mat, TOTAL_DASHES);
    const dummy = new THREE.Object3D();
    let idx = 0;

    // 1. North-South Avenues (X = -135, 0, +135)
    [-135, 0, 135].forEach((aveX) => {
      [-LINE_12, -LINE_01, LINE_01, LINE_12].forEach((off) => {
        const xPos = aveX + off;
        SEG_STARTS.forEach((baseZ) => {
          for (let i = 0; i < DASHES_PER_SEG; i++) {
            const zPos = baseZ + i * PITCH + DASH_LEN / 2;
            dummy.position.set(xPos, 0.02, zPos);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(idx++, dummy.matrix);
          }
        });
      });
    });

    // 2. East-West Avenues (Z = -135, 0, +135)
    [-135, 0, 135].forEach((aveZ) => {
      [-LINE_12, -LINE_01, LINE_01, LINE_12].forEach((off) => {
        const zPos = aveZ + off;
        SEG_STARTS.forEach((baseX) => {
          for (let i = 0; i < DASHES_PER_SEG; i++) {
            const xPos = baseX + i * PITCH + DASH_LEN / 2;
            dummy.position.set(xPos, 0.02, zPos);
            dummy.rotation.set(0, Math.PI / 2, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(idx++, dummy.matrix);
          }
        });
      });
    });

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  // Secondary intersection zebra crosswalks (8 intersections * 4 approaches * 20 stripes = 640 stripes)
  const secondaryCrosswalksMesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.5, 3.2);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const mesh = new THREE.InstancedMesh(geo, mat, 640);
    const dummy = new THREE.Object3D();
    let idx = 0;

    // 8 secondary intersections: 4 ring intersections + 4 corner intersections
    const interCenters = [
      [0, -135], [0, 135], [-135, 0], [135, 0],
      [-135, -135], [135, -135], [-135, 135], [135, 135]
    ];

    interCenters.forEach(([cx, cz]) => {
      // North & South Crosswalks (spanning across 24.4m road along X)
      [-14.5, 14.5].forEach((dz) => {
        const z = cz + dz;
        for (let i = 0; i < 20; i++) {
          const x = cx - 10.45 + i * 1.1;
          dummy.position.set(x, 0.02, z);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx++, dummy.matrix);
        }
      });

      // East & West Crosswalks (spanning across 24.4m road along Z)
      [-14.5, 14.5].forEach((dx) => {
        const x = cx + dx;
        for (let i = 0; i < 20; i++) {
          const z = cz - 10.45 + i * 1.1;
          dummy.position.set(x, 0.02, z);
          dummy.rotation.set(0, Math.PI / 2, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx++, dummy.matrix);
        }
      });
    });

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  // Secondary Stop Bars (8 intersections * 4 approaches = 32 stop bars)
  const secondaryStopBarsMesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10.5, 0.45);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const mesh = new THREE.InstancedMesh(geo, mat, 32);
    const dummy = new THREE.Object3D();
    let idx = 0;

    const interCenters = [
      [0, -135], [0, 135], [-135, 0], [135, 0],
      [-135, -135], [135, -135], [-135, 135], [135, 135]
    ];

    interCenters.forEach(([cx, cz]) => {
      // North approach (traffic moving South)
      dummy.position.set(cx + 6.2, 0.022, cz - 17.0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx++, dummy.matrix);

      // South approach (traffic moving North)
      dummy.position.set(cx - 6.2, 0.022, cz + 17.0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx++, dummy.matrix);

      // West approach (traffic moving East)
      dummy.position.set(cx - 17.0, 0.022, cz - 6.2);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx++, dummy.matrix);

      // East approach (traffic moving West)
      dummy.position.set(cx + 17.0, 0.022, cz + 6.2);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx++, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  // Sidewalk trees along central avenues (outer spans) and all cross-avenues
  const avenueTrees = useMemo(() => {
    const trees = [];
    const centralDistances = [105, 155, 185, 215, 245];
    const crossOffsets = [-240, -210, -180, -90, -45, 45, 90, 180, 210, 240];
    const sidewalkOffset = HALF_ROAD + 2.0;

    let seed = 456;
    const pseudoRand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 1. Along Central Avenues (outer segments, beyond Environment.jsx reach)
    centralDistances.forEach((d) => {
      [-1, 1].forEach((signZ) => {
        [-sidewalkOffset, sidewalkOffset].forEach((x) => {
          trees.push({
            pos: [x, 0, signZ * d],
            variant: Math.floor(pseudoRand() * 5) + 1,
            scale: 0.95 + pseudoRand() * 0.2,
            rotY: pseudoRand() * Math.PI * 2,
          });
        });
      });
      [-1, 1].forEach((signX) => {
        [-sidewalkOffset, sidewalkOffset].forEach((z) => {
          trees.push({
            pos: [signX * d, 0, z],
            variant: Math.floor(pseudoRand() * 5) + 1,
            scale: 0.95 + pseudoRand() * 0.2,
            rotY: pseudoRand() * Math.PI * 2,
          });
        });
      });
    });

    // 2. Along Cross-Avenues (Z = ±135 and X = ±135)
    [-135, 135].forEach((aveZ) => {
      [-sidewalkOffset, sidewalkOffset].forEach((zOff) => {
        crossOffsets.forEach((x) => {
          trees.push({
            pos: [x, 0, aveZ + zOff],
            variant: Math.floor(pseudoRand() * 5) + 1,
            scale: 0.95 + pseudoRand() * 0.2,
            rotY: pseudoRand() * Math.PI * 2,
          });
        });
      });
    });

    [-135, 135].forEach((aveX) => {
      [-sidewalkOffset, sidewalkOffset].forEach((xOff) => {
        crossOffsets.forEach((z) => {
          trees.push({
            pos: [aveX + xOff, 0, z],
            variant: Math.floor(pseudoRand() * 5) + 1,
            scale: 0.95 + pseudoRand() * 0.2,
            rotY: pseudoRand() * Math.PI * 2,
          });
        });
      });
    });

    return trees;
  }, []);

  // Streetlights along central avenues (outer spans) and all cross-avenues
  const streetlightPositions = useMemo(() => {
    const positions = [];
    const centralDistances = [98, 150, 180, 210, 240];
    const crossOffsets = [-225, -195, -70, -30, 30, 70, 195, 225];
    const curbOffset = HALF_ROAD + 1.2;

    // 1. Central Avenues (outer segments, complementary to Environment.jsx)
    centralDistances.forEach((d) => {
      positions.push([curbOffset, 0, -d, Math.PI]);
      positions.push([-curbOffset, 0, -d, 0]);
      positions.push([curbOffset, 0, d, Math.PI]);
      positions.push([-curbOffset, 0, d, 0]);

      positions.push([d, 0, curbOffset, -Math.PI / 2]);
      positions.push([d, 0, -curbOffset, Math.PI / 2]);
      positions.push([-d, 0, curbOffset, -Math.PI / 2]);
      positions.push([-d, 0, -curbOffset, Math.PI / 2]);
    });

    // 2. Cross-Avenues (Z = ±135 and X = ±135)
    [-135, 135].forEach((aveZ) => {
      crossOffsets.forEach((x) => {
        positions.push([x, 0, aveZ + curbOffset, -Math.PI / 2]);
        positions.push([x, 0, aveZ - curbOffset, Math.PI / 2]);
      });
    });

    [-135, 135].forEach((aveX) => {
      crossOffsets.forEach((z) => {
        positions.push([aveX + curbOffset, 0, z, Math.PI]);
        positions.push([aveX - curbOffset, 0, z, 0]);
      });
    });

    return positions;
  }, []);

  // Cached Pavement Arrow Textures
  const leftArrowTex = useMemo(() => getCachedPavementArrowTexture('left'), []);
  const straightArrowTex = useMemo(() => getCachedPavementArrowTexture('straight'), []);
  const straightRightArrowTex = useMemo(() => getCachedPavementArrowTexture('straight_right'), []);

  // Cached Architectural Tile Textures
  const downtownTileTex = useMemo(() => getCachedTileTexture('downtown_granite', 28, 28), []);
  const civicTileTex = useMemo(() => getCachedTileTexture('civic_concrete', 28, 28), []);
  const plazaTileTex = useMemo(() => getCachedTileTexture('plaza_limestone', 14, 14), []);
  const sidewalkTileTex = useMemo(() => getCachedTileTexture('sidewalk_paving', 28, 2), []);
  // World-space scale-matched seamless grass textures
  const parkGrassTex = useMemo(() => getCachedTileTexture('natural_turf', 4.3, 4.3), []);

  // Central Park lawn geometry with exact cutout opening for the sunken pond (X: -88 to -48, Z: 35 to 75)
  const parkTurfGeometry = useMemo(() => {
    const half = 50.8;
    const shape = new THREE.Shape();
    shape.moveTo(-half, -half);
    shape.lineTo(half, -half);
    shape.lineTo(half, half);
    shape.lineTo(-half, half);
    shape.closePath();

    // Opening for pond in Central Park (center [-67.5, 67.5], pond at [-68, 55], half = 20)
    // local X = -68 - (-67.5) = -0.5, local Y = -(55 - 67.5) = 12.5
    const cx = -0.5;
    const cy = 12.5;
    const ph = 20;
    const hole = new THREE.Path();
    hole.moveTo(cx - ph, cy - ph);
    hole.lineTo(cx + ph, cy - ph);
    hole.lineTo(cx + ph, cy + ph);
    hole.lineTo(cx - ph, cy + ph);
    hole.closePath();
    shape.holes.push(hole);

    const geo = new THREE.ShapeGeometry(shape);
    const pos = geo.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      uvs[i * 2] = ((x + half) / 101.6) * 4.3;
      uvs[i * 2 + 1] = ((y + half) / 101.6) * 4.3;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, []);

  const houseGrassTex = useMemo(() => getCachedTileTexture('natural_turf', 4.4, 2.2), []);
  const outerHouseGrassTex = useMemo(() => getCachedTileTexture('natural_turf', 4.4, 4.4), []);

  return (
    <group>
      {/* =================================================================== */}
      {/* 1. SEAMLESS CITY BLOCK PODIUMS (100% ZERO-GAP TO ROAD ASPHALT)     */}
      {/* =================================================================== */}

      {/* =================================================================== */}
      {/* 1. SEAMLESS ARCHITECTURAL SIDEWALKS (4.5m WIDE, ZERO-GAP TO ROADS) */}
      {/* =================================================================== */}

      {/* Primary Central Avenue Perimeter Sidewalks (Y = 0.15m, height 0.3m, sidewalkTileTex) */}
      {/* North Avenue Sidewalks (Z: -122.8 to -12.2) */}
      <mesh position={[-14.45, 0.15, -67.5]} receiveShadow>
        <boxGeometry args={[4.5, 0.3, 110.6]} />
        <meshStandardMaterial map={sidewalkTileTex} roughness={0.65} />
      </mesh>
      <mesh position={[14.45, 0.15, -67.5]} receiveShadow>
        <boxGeometry args={[4.5, 0.3, 110.6]} />
        <meshStandardMaterial map={sidewalkTileTex} roughness={0.65} />
      </mesh>

      {/* South Avenue Sidewalks (Z: 12.2 to 122.8) */}
      <mesh position={[-14.45, 0.15, 69.75]} receiveShadow>
        <boxGeometry args={[4.5, 0.3, 106.1]} />
        <meshStandardMaterial map={sidewalkTileTex} roughness={0.65} />
      </mesh>
      <mesh position={[14.45, 0.15, 67.5]} receiveShadow>
        <boxGeometry args={[4.5, 0.3, 110.6]} />
        <meshStandardMaterial map={sidewalkTileTex} roughness={0.65} />
      </mesh>

      {/* East Avenue Sidewalks (X: 16.7 to 122.8) */}
      <mesh position={[69.75, 0.15, -14.45]} receiveShadow>
        <boxGeometry args={[106.1, 0.3, 4.5]} />
        <meshStandardMaterial map={sidewalkTileTex} roughness={0.65} />
      </mesh>
      <mesh position={[69.75, 0.15, 14.45]} receiveShadow>
        <boxGeometry args={[106.1, 0.3, 4.5]} />
        <meshStandardMaterial map={sidewalkTileTex} roughness={0.65} />
      </mesh>

      {/* West Avenue Sidewalks (X: -122.8 to -16.7 / -12.2) */}
      <mesh position={[-69.75, 0.15, -14.45]} receiveShadow>
        <boxGeometry args={[106.1, 0.3, 4.5]} />
        <meshStandardMaterial map={sidewalkTileTex} roughness={0.65} />
      </mesh>
      <mesh position={[-67.5, 0.15, 14.45]} receiveShadow>
        <boxGeometry args={[110.6, 0.3, 4.5]} />
        <meshStandardMaterial map={sidewalkTileTex} roughness={0.65} />
      </mesh>

      {/* Central Park Outer Perimeter Sidewalks along Secondary Avenues */}
      <mesh position={[-67.5, 0.15, 120.55]} receiveShadow>
        <boxGeometry args={[101.6, 0.3, 4.5]} />
        <meshStandardMaterial map={sidewalkTileTex} roughness={0.65} />
      </mesh>
      <mesh position={[-120.55, 0.15, 67.5]} receiveShadow>
        <boxGeometry args={[4.5, 0.3, 101.6]} />
        <meshStandardMaterial map={sidewalkTileTex} roughness={0.65} />
      </mesh>

      {/* =================================================================== */}
      {/* 2. INTERIOR BLOCK PODIUMS (SET BACK 4.5m BEHIND PERIMETER SIDEWALKS) */}
      {/* =================================================================== */}

      {/* CORE BLOCK NE: DOWNTOWN FINANCIAL DISTRICT INTERIOR (X=16.7..122.8, Z=-122.8..-16.7) */}
      <mesh position={[69.75, 0.15, -69.75]} receiveShadow>
        <boxGeometry args={[106.1, 0.3, 106.1]} />
        <meshStandardMaterial map={downtownTileTex} roughness={0.65} metalness={0.1} />
      </mesh>
      {/* Financial Center Corporate Plaza Granite Inset */}
      <mesh position={[69.75, 0.305, -69.75]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[54, 54]} />
        <meshStandardMaterial map={plazaTileTex} roughness={0.55} />
      </mesh>
      {/* 3D Modular Floor Tiles flanking Corporate Plaza entrance */}
      {[-8, -4, 0, 4, 8].map((ox) => (
        <ModularFloorTile key={`ft-ne-${ox}`} position={[69.75 + ox, 0.31, -54]} scale={[1.2, 0.5, 1.2]} />
      ))}

      {/* CORE BLOCK NW: CIVIC & REGIONAL MEDICAL INTERIOR (X=-122.8..-16.7, Z=-122.8..-16.7) */}
      <mesh position={[-69.75, 0.15, -69.75]} receiveShadow>
        <boxGeometry args={[106.1, 0.3, 106.1]} />
        <meshStandardMaterial map={civicTileTex} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* CORE BLOCK SE: ARTS & RESIDENTIAL INTERIOR (X=16.7..122.8, Z=16.7..122.8) */}
      {/* Northern Half (Cinema & Fountain Plaza): Tiled Limestone (Z=16.7..67.5) */}
      <mesh position={[69.75, 0.15, 42.1]} receiveShadow>
        <boxGeometry args={[106.1, 0.3, 50.8]} />
        <meshStandardMaterial map={plazaTileTex} roughness={0.6} />
      </mesh>
      {/* Southern Half (House Area): Natural Lawns (Z=67.5..122.8) */}
      <mesh position={[69.75, 0.015, 95.15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[106.1, 55.3]} />
        <meshStandardMaterial map={houseGrassTex} roughness={0.92} color="#ffffff" />
      </mesh>
      {/* House Front Yard Concrete Walkway slabs */}
      {[50, 72, 94, 116].map((hx) => (
        <mesh key={`walk-${hx}`} position={[hx, 0.155, 120]} receiveShadow>
          <boxGeometry args={[3.5, 0.02, 5.5]} />
          <meshStandardMaterial map={civicTileTex} roughness={0.7} />
        </mesh>
      ))}

      {/* CORE BLOCK SW: CENTRAL PARK GROUND LEVEL TURF (with opening for sunken pond) */}
      <mesh position={[-67.5, 0.015, 67.5]} rotation={[-Math.PI / 2, 0, 0]} geometry={parkTurfGeometry} receiveShadow>
        <meshStandardMaterial map={parkGrassTex} roughness={0.95} color="#ffffff" />
      </mesh>
      {/* Stone steps descending from perimeter sidewalk into the park */}
      <PlazaStairs position={[-16.7, 0, 67.5]} rotation={[0, -Math.PI / 2, 0]} scale={1.2} />
      <PlazaStairs position={[-67.5, 0, 16.7]} rotation={[0, Math.PI, 0]} scale={1.2} />
      {/* Modular Wood Promenade Deck overlooking the pond south shoreline */}
      <ModularWoodFloor position={[-68, 0.03, 75.5]} scale={[1.2, 0.4, 1.2]} />
      <ModularWoodFloor position={[-64, 0.03, 75.5]} scale={[1.2, 0.4, 1.2]} />

      {/* =================================================================== */}
      {/* 2. OUTER BLOCK PODIUMS (FLUSH WITH 24.4m PRIMARY AVENUES AT 147.2m) */}
      {/* =================================================================== */}
      {/* Outer NE Corporate Clusters: Foundation pads under buildings */}
      <mesh position={[202.5, 0.15, -67.5]} receiveShadow>
        <boxGeometry args={[110.6, 0.3, 110.6]} />
        <meshStandardMaterial map={downtownTileTex} roughness={0.65} />
      </mesh>
      <mesh position={[67.5, 0.15, -202.5]} receiveShadow>
        <boxGeometry args={[110.6, 0.3, 110.6]} />
        <meshStandardMaterial map={downtownTileTex} roughness={0.65} />
      </mesh>
      <mesh position={[202.5, 0.15, -202.5]} receiveShadow>
        <boxGeometry args={[110.6, 0.3, 110.6]} />
        <meshStandardMaterial map={downtownTileTex} roughness={0.65} />
      </mesh>

      {/* Outer NW Commercial Clusters */}
      <mesh position={[-202.5, 0.15, -67.5]} receiveShadow>
        <boxGeometry args={[110.6, 0.3, 110.6]} />
        <meshStandardMaterial map={civicTileTex} roughness={0.7} />
      </mesh>
      <mesh position={[-67.5, 0.15, -202.5]} receiveShadow>
        <boxGeometry args={[110.6, 0.3, 110.6]} />
        <meshStandardMaterial map={civicTileTex} roughness={0.7} />
      </mesh>
      <mesh position={[-202.5, 0.15, -202.5]} receiveShadow>
        <boxGeometry args={[110.6, 0.3, 110.6]} />
        <meshStandardMaterial map={civicTileTex} roughness={0.7} />
      </mesh>

      {/* Outer SE: Residential & Houses nestled on natural grass at ground level */}
      <mesh position={[202.5, 0.015, 67.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[110.6, 110.6]} />
        <meshStandardMaterial map={outerHouseGrassTex} roughness={0.92} color="#ffffff" />
      </mesh>
      <mesh position={[67.5, 0.015, 202.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[110.6, 110.6]} />
        <meshStandardMaterial map={outerHouseGrassTex} roughness={0.92} color="#ffffff" />
      </mesh>
      <mesh position={[202.5, 0.015, 202.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[110.6, 110.6]} />
        <meshStandardMaterial map={outerHouseGrassTex} roughness={0.92} color="#ffffff" />
      </mesh>

      {/* Outer SW: Garden Suburb nestled on natural grass at ground level */}
      <mesh position={[-202.5, 0.015, 67.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[110.6, 110.6]} />
        <meshStandardMaterial map={outerHouseGrassTex} roughness={0.92} color="#ffffff" />
      </mesh>
      <mesh position={[-67.5, 0.015, 202.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[110.6, 110.6]} />
        <meshStandardMaterial map={outerHouseGrassTex} roughness={0.92} color="#ffffff" />
      </mesh>
      <mesh position={[-202.5, 0.015, 202.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[110.6, 110.6]} />
        <meshStandardMaterial map={outerHouseGrassTex} roughness={0.92} color="#ffffff" />
      </mesh>

      {/* =================================================================== */}
      {/* 3. 100% UNIFIED PRIMARY 3-LANE ROAD NETWORK (NO SECONDARY ROADS)  */}
      {/* =================================================================== */}
      {/* Continuous 24.4m Wide Primary Avenue Roadbeds (Asphalt #2a2b2e) */}
      {/* 2 Central Avenues */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.01, 520]} />
        <meshStandardMaterial color="#2a2b2e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[520, 0.01, ROAD_WIDTH]} />
        <meshStandardMaterial color="#2a2b2e" roughness={0.85} />
      </mesh>

      {/* 4 Cross Primary Avenues (Full 24.4m width, completely replacing old 14m streets) */}
      <mesh position={[0, 0.005, -135]} receiveShadow>
        <boxGeometry args={[520, 0.01, ROAD_WIDTH]} />
        <meshStandardMaterial color="#2a2b2e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.005, 135]} receiveShadow>
        <boxGeometry args={[520, 0.01, ROAD_WIDTH]} />
        <meshStandardMaterial color="#2a2b2e" roughness={0.85} />
      </mesh>
      <mesh position={[-135, 0.005, 0]} receiveShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.01, 520]} />
        <meshStandardMaterial color="#2a2b2e" roughness={0.85} />
      </mesh>
      <mesh position={[135, 0.005, 0]} receiveShadow>
        <boxGeometry args={[ROAD_WIDTH, 0.01, 520]} />
        <meshStandardMaterial color="#2a2b2e" roughness={0.85} />
      </mesh>

      {/* Raised Center Medians (Width 1.6m, Height 0.2m, Color #8e8e93) */}
      {/* Medians run along the center of all avenues, pausing cleanly at intersections */}
      {[-135, 0, 135].map((aveX) => (
        <React.Fragment key={`med-ns-${aveX}`}>
          <mesh position={[aveX, 0.1, -204.5]} receiveShadow>
            <boxGeometry args={[1.6, 0.2, 103]} />
            <meshStandardMaterial color="#8e8e93" roughness={0.8} />
          </mesh>
          {aveX !== 0 && (
            <>
              <mesh position={[aveX, 0.1, -67.5]} receiveShadow>
                <boxGeometry args={[1.6, 0.2, 99]} />
                <meshStandardMaterial color="#8e8e93" roughness={0.8} />
              </mesh>
              <mesh position={[aveX, 0.1, 67.5]} receiveShadow>
                <boxGeometry args={[1.6, 0.2, 99]} />
                <meshStandardMaterial color="#8e8e93" roughness={0.8} />
              </mesh>
            </>
          )}
          <mesh position={[aveX, 0.1, 204.5]} receiveShadow>
            <boxGeometry args={[1.6, 0.2, 103]} />
            <meshStandardMaterial color="#8e8e93" roughness={0.8} />
          </mesh>
        </React.Fragment>
      ))}
      {[-135, 0, 135].map((aveZ) => (
        <React.Fragment key={`med-ew-${aveZ}`}>
          <mesh position={[-204.5, 0.1, aveZ]} receiveShadow>
            <boxGeometry args={[103, 0.2, 1.6]} />
            <meshStandardMaterial color="#8e8e93" roughness={0.8} />
          </mesh>
          {aveZ !== 0 && (
            <>
              <mesh position={[-67.5, 0.1, aveZ]} receiveShadow>
                <boxGeometry args={[99, 0.2, 1.6]} />
                <meshStandardMaterial color="#8e8e93" roughness={0.8} />
              </mesh>
              <mesh position={[67.5, 0.1, aveZ]} receiveShadow>
                <boxGeometry args={[99, 0.2, 1.6]} />
                <meshStandardMaterial color="#8e8e93" roughness={0.8} />
              </mesh>
            </>
          )}
          <mesh position={[204.5, 0.1, aveZ]} receiveShadow>
            <boxGeometry args={[103, 0.2, 1.6]} />
            <meshStandardMaterial color="#8e8e93" roughness={0.8} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Solid White Outer Shoulder Lines (0.22m wide at offset ±11.9m, flat on roadbed) */}
      {[-135, 0, 135].map((aveX) => (
        <React.Fragment key={`sh-ns-${aveX}`}>
          {[-SHOULDER, SHOULDER].map((shOff, si) => (
            <React.Fragment key={`sh-line-${si}`}>
              <mesh position={[aveX + shOff, 0.02, -204.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.22, 103]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[aveX + shOff, 0.02, -67.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.22, 99]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[aveX + shOff, 0.02, 67.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.22, 99]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[aveX + shOff, 0.02, 204.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.22, 103]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
      {[-135, 0, 135].map((aveZ) => (
        <React.Fragment key={`sh-ew-${aveZ}`}>
          {[-SHOULDER, SHOULDER].map((shOff, si) => (
            <React.Fragment key={`sh-line-ew-${si}`}>
              <mesh position={[-204.5, 0.02, aveZ + shOff]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[103, 0.22]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[-67.5, 0.02, aveZ + shOff]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[99, 0.22]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[67.5, 0.02, aveZ + shOff]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[99, 0.22]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[204.5, 0.02, aveZ + shOff]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[103, 0.22]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}

      {/* Instanced Dashed Lane Lines */}
      <primitive object={dashedMesh} />

      {/* Instanced Secondary Zebra Crosswalks */}
      <primitive object={secondaryCrosswalksMesh} />

      {/* Instanced Secondary Stop Bars */}
      <primitive object={secondaryStopBarsMesh} />

      {/* Directional Pavement Arrows on Secondary Approaches (Central intersection rendered in Intersection.jsx) */}
      {[
        // Secondary intersection approaches
        { pos: [0, 0, -135], dist: 32, dir: 'N' },
        { pos: [0, 0, 135], dist: 32, dir: 'S' },
        { pos: [-135, 0, 0], dist: 32, dir: 'W' },
        { pos: [135, 0, 0], dist: 32, dir: 'E' },
      ].map((arr, ai) => (
        <React.Fragment key={`arrow-grp-${ai}`}>
          {arr.dir === 'N' && (
            <group rotation={[0, 0, 0]}>
              <mesh position={[arr.pos[0] + LANE_OFFSETS[0], 0.025, arr.pos[2] - arr.dist]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={leftArrowTex} transparent opacity={0.9} />
              </mesh>
              <mesh position={[arr.pos[0] + LANE_OFFSETS[1], 0.025, arr.pos[2] - arr.dist]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={straightArrowTex} transparent opacity={0.9} />
              </mesh>
              <mesh position={[arr.pos[0] + LANE_OFFSETS[2], 0.025, arr.pos[2] - arr.dist]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={straightRightArrowTex} transparent opacity={0.9} />
              </mesh>
            </group>
          )}
          {arr.dir === 'S' && (
            <group position={[arr.pos[0], 0, arr.pos[2] + arr.dist]} rotation={[0, Math.PI, 0]}>
              <mesh position={[LANE_OFFSETS[0], 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={leftArrowTex} transparent opacity={0.9} />
              </mesh>
              <mesh position={[LANE_OFFSETS[1], 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={straightArrowTex} transparent opacity={0.9} />
              </mesh>
              <mesh position={[LANE_OFFSETS[2], 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={straightRightArrowTex} transparent opacity={0.9} />
              </mesh>
            </group>
          )}
          {arr.dir === 'E' && (
            <group position={[arr.pos[0] + arr.dist, 0, arr.pos[2]]} rotation={[0, -Math.PI / 2, 0]}>
              <mesh position={[LANE_OFFSETS[0], 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={leftArrowTex} transparent opacity={0.9} />
              </mesh>
              <mesh position={[LANE_OFFSETS[1], 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={straightArrowTex} transparent opacity={0.9} />
              </mesh>
              <mesh position={[LANE_OFFSETS[2], 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={straightRightArrowTex} transparent opacity={0.9} />
              </mesh>
            </group>
          )}
          {arr.dir === 'W' && (
            <group position={[arr.pos[0] - arr.dist, 0, arr.pos[2]]} rotation={[0, Math.PI / 2, 0]}>
              <mesh position={[LANE_OFFSETS[0], 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={leftArrowTex} transparent opacity={0.9} />
              </mesh>
              <mesh position={[LANE_OFFSETS[1], 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={straightArrowTex} transparent opacity={0.9} />
              </mesh>
              <mesh position={[LANE_OFFSETS[2], 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.6, 3.2]} />
                <meshBasicMaterial map={straightRightArrowTex} transparent opacity={0.9} />
              </mesh>
            </group>
          )}
        </React.Fragment>
      ))}

      {/* =================================================================== */}
      {/* 4. OVERHEAD HIGHWAY & MAJOR AVENUE NAVIGATION GANTRIES              */}
      {/* =================================================================== */}
      {/* Central Intersection Approaches */}
      <OverheadNavigationGantry position={[0, 0, -48]} rotation={[0, 0, 0]} signType="downtown_north" />
      <OverheadNavigationGantry position={[0, 0, 48]} rotation={[0, Math.PI, 0]} signType="downtown_south" />
      <OverheadNavigationGantry position={[48, 0, 0]} rotation={[0, -Math.PI / 2, 0]} signType="avenue_east" />
      <OverheadNavigationGantry position={[-48, 0, 0]} rotation={[0, Math.PI / 2, 0]} signType="avenue_west" />

      {/* Secondary Ring Intersection Approaches (Lane Guidance) */}
      <OverheadNavigationGantry position={[0, 0, -112]} rotation={[0, 0, 0]} signType="lane_guidance" />
      <OverheadNavigationGantry position={[0, 0, 112]} rotation={[0, Math.PI, 0]} signType="lane_guidance" />
      <OverheadNavigationGantry position={[112, 0, 0]} rotation={[0, -Math.PI / 2, 0]} signType="lane_guidance" />
      <OverheadNavigationGantry position={[-112, 0, 0]} rotation={[0, Math.PI / 2, 0]} signType="lane_guidance" />

      {/* Cross-Avenue Approaches */}
      <OverheadNavigationGantry position={[67.5, 0, -135]} rotation={[0, -Math.PI / 2, 0]} signType="downtown_north" />
      <OverheadNavigationGantry position={[-67.5, 0, -135]} rotation={[0, Math.PI / 2, 0]} signType="avenue_west" />
      <OverheadNavigationGantry position={[67.5, 0, 135]} rotation={[0, -Math.PI / 2, 0]} signType="avenue_east" />
      <OverheadNavigationGantry position={[-67.5, 0, 135]} rotation={[0, Math.PI / 2, 0]} signType="downtown_south" />

      {/* =================================================================== */}
      {/* 5. HIGH-DENSITY URBAN FURNITURE, AMENITIES & STREETSCAPE           */}
      {/* =================================================================== */}
      {/* Roadside Avenue Trees in Cast-Iron Grates */}
      {avenueTrees.map((tree, i) => (
        <React.Fragment key={`ave-tree-${i}`}>
          <SidewalkTreeGrate position={tree.pos} />
          <Tree
            position={[tree.pos[0], 0.30, tree.pos[2]]}
            variant={tree.variant}
            scale={tree.scale}
            rotationY={tree.rotY}
          />
        </React.Fragment>
      ))}

      {/* Streetlights along primary avenues */}
      {streetlightPositions.map(([x, y, z, rotY], i) => (
        <StreetLight key={`streetlight-${i}`} position={[x, y, z]} rotationY={rotY} />
      ))}

      {/* Stainless Steel Pedestrian Safety Bollards at Intersection Corners */}
      {[
        [-13.5, -13.5], [13.5, -13.5], [-13.5, 13.5], [13.5, 13.5],
        // Cross intersection corners
        [-148.5, -13.5], [-121.5, -13.5], [121.5, -13.5], [148.5, -13.5],
        [-148.5, 13.5], [-121.5, 13.5], [121.5, 13.5], [148.5, 13.5],
      ].map(([bx, bz], i) => (
        <Bollard key={`bollard-${i}`} position={[bx, 0.15, bz]} />
      ))}

      {/* Modern Bicycle Racks along key destinations */}
      <BicycleRack position={[20, 0.3, -38]} rotation={[0, -Math.PI / 2, 0]} />
      <BicycleRack position={[-20, 0.3, -38]} rotation={[0, Math.PI / 2, 0]} />
      <BicycleRack position={[20, 0.3, 38]} rotation={[0, -Math.PI / 2, 0]} />
      <BicycleRack position={[-20, 0.3, 38]} rotation={[0, Math.PI / 2, 0]} />
      <BicycleRack position={[154, 0.3, -38]} rotation={[0, -Math.PI / 2, 0]} />
      <BicycleRack position={[-154, 0.3, -38]} rotation={[0, Math.PI / 2, 0]} />

      {/* Fire Hydrants at street corners */}
      <FireHydrant position={[13.5, 0.15, -20]} />
      <FireHydrant position={[-13.5, 0.15, 20]} />
      <FireHydrant position={[20, 0.15, 13.5]} />
      <FireHydrant position={[-20, 0.15, -13.5]} />
      <FireHydrant position={[121.5, 0.15, -20]} />
      <FireHydrant position={[-121.5, 0.15, 20]} />

      {/* Outdoor Cafe Seating with Umbrellas on Downtown & Cinema Plazas */}
      <CafeTableWithUmbrella position={[46, 0.3, 24]} color="#e11d48" />
      <CafeTableWithUmbrella position={[52, 0.3, 24]} color="#0284c7" />
      <CafeTableWithUmbrella position={[58, 0.3, 24]} color="#e11d48" />
      <CafeTableWithUmbrella position={[68, 0.3, -58]} color="#f59e0b" />
      <CafeTableWithUmbrella position={[74, 0.3, -58]} color="#10b981" />
      <CafeTableWithUmbrella position={[80, 0.3, -58]} color="#f59e0b" />

      {/* Bus Stops along extended avenues */}
      <BusStop position={[HALF_ROAD + 2.0, 0.3, -160]} rotation={[0, -Math.PI / 2, 0]} />
      <BusStop position={[-HALF_ROAD - 2.0, 0.3, 160]} rotation={[0, Math.PI / 2, 0]} />
      <BusStop position={[160, 0.3, HALF_ROAD + 2.0]} rotation={[0, Math.PI, 0]} />
      <BusStop position={[-160, 0.3, -HALF_ROAD - 2.0]} rotation={[0, 0, 0]} />

      {/* Avenue Benches */}
      <Bench position={[HALF_ROAD + 2.0, 0.3, -118]} rotation={-Math.PI / 2} />
      <Bench position={[-HALF_ROAD - 2.0, 0.3, -202]} rotation={Math.PI / 2} />
      <Bench position={[-HALF_ROAD - 2.0, 0.3, 118]} rotation={Math.PI / 2} />
      <Bench position={[HALF_ROAD + 2.0, 0.3, 202]} rotation={-Math.PI / 2} />
      <Bench position={[118, 0.3, HALF_ROAD + 2.0]} rotation={Math.PI} />
      <Bench position={[202, 0.3, -HALF_ROAD - 2.0]} rotation={0} />
      <Bench position={[-118, 0.3, -HALF_ROAD - 2.0]} rotation={0} />
      <Bench position={[-202, 0.3, HALF_ROAD + 2.0]} rotation={Math.PI} />

      {/* Planter Boxes */}
      <PlanterBox position={[HALF_ROAD + 2.4, 0.16, -112]} rotation={-Math.PI / 2} />
      <PlanterBox position={[-HALF_ROAD - 2.4, 0.16, -192]} rotation={Math.PI / 2} />
      <PlanterBox position={[-HALF_ROAD - 2.4, 0.16, 112]} rotation={Math.PI / 2} />
      <PlanterBox position={[HALF_ROAD + 2.4, 0.16, 192]} rotation={-Math.PI / 2} />
      <PlanterBox position={[112, 0.16, HALF_ROAD + 2.4]} rotation={Math.PI} />
      <PlanterBox position={[192, 0.16, -HALF_ROAD - 2.4]} rotation={0} />
      <PlanterBox position={[-112, 0.16, -HALF_ROAD - 2.4]} rotation={0} />
      <PlanterBox position={[-192, 0.16, HALF_ROAD + 2.4]} rotation={Math.PI} />

      {/* --- NE FINANCIAL CORPORATE PLAZA AMENITIES --- */}
      <Fountain position={[67.5, 0.3, -67.5]} scale={2.8} />
      <ParkingLot position={[67.5, 0.31, -92]} rotation={[0, 0, 0]} scale={4.5} />
      <PlazaStairs position={[52, 0.15, -67.5]} rotation={[0, Math.PI / 2, 0]} scale={1.2} />
      <PlazaStairs position={[83, 0.15, -67.5]} rotation={[0, -Math.PI / 2, 0]} scale={1.2} />
      <Bench position={[60, 0.31, -62]} rotation={0} />
      <Bench position={[75, 0.31, -62]} rotation={0} />
      <Bench position={[60, 0.31, -73]} rotation={Math.PI} />
      <Bench position={[75, 0.31, -73]} rotation={Math.PI} />
      <PlanterBox position={[54, 0.31, -67.5]} rotation={Math.PI / 2} />
      <PlanterBox position={[81, 0.31, -67.5]} rotation={-Math.PI / 2} />
      <Dumpster position={[52, 0.3, -92]} rotation={[0, Math.PI / 4, 0]} />

      {/* --- NW MEDICAL CAMPUS PARKING & AMENITIES --- */}
      <ParkingLot position={[-76, 0.31, -45]} rotation={[0, 0, 0]} scale={5.0} />
      <PlanterBox position={[-28, 0.31, -45]} rotation={Math.PI / 2} />
      <PlanterBox position={[-64, 0.31, -28]} rotation={0} />
      <Bench position={[-36, 0.31, -34]} rotation={-Math.PI / 2} />
      <Dumpster position={[-90, 0.3, -70]} rotation={[0, -Math.PI / 4, 0]} />

      {/* --- SW CENTRAL PARK: NATURAL SUNKEN POND BASIN (FLUSH WITH TURF) --- */}
      {/* Top perimeter grass is at Y = 12.66 in model units; at scale = 0.20 and Y = -2.517m, perimeter grass sits flush with turf at Y = 0.015m */}
      <group position={[-68, -2.517, 55]} rotation={[0, 0, 0]}>
        <primitive object={pondScene} scale={[0.20, 0.20, 0.20]} />
      </group>
      <ParkRock position={[-68, 0.02, 38]} variant={1} scale={0.7} rotation={[0, 0.8, 0]} />
      <ParkRock position={[-47, 0.02, 58]} variant={2} scale={0.8} rotation={[0, 2.1, 0]} />
      <ParkRock position={[-89, 0.02, 55]} variant={3} scale={0.65} rotation={[0, -1.2, 0]} />
      <ParkRock position={[-65, 0.02, 76]} variant={4} scale={0.75} rotation={[0, 1.5, 0]} />
      <ParkRock position={[-54, 0.02, 75]} variant={5} scale={0.85} rotation={[0, 3.0, 0]} />
      {/* Mature Park Trees grounded on turf */}
      <Tree position={[-42, 0.02, 45]} variant={1} scale={1.25} rotationY={0.5} />
      <Tree position={[-45, 0.02, 70]} variant={2} scale={1.3} rotationY={1.8} />
      <Tree position={[-90, 0.02, 40]} variant={4} scale={1.15} rotationY={2.7} />
      <Tree position={[-90, 0.02, 75]} variant={5} scale={1.25} rotationY={1.2} />
      <Tree position={[-60, 0.02, 85]} variant={3} scale={1.1} rotationY={0.9} />
      <Tree position={[-75, 0.02, 33]} variant={2} scale={1.05} rotationY={2.2} />
      {/* Promenade Benches grounded on turf */}
      <Bench position={[-44, 0.02, 56]} rotation={-Math.PI / 2} />
      <Bench position={[-68, 0.02, 33]} rotation={0} />
      <Bench position={[-68, 0.02, 77]} rotation={Math.PI} />
      <TrashCan position={[-38, 0.02, 38]} rotation={[0, 0, 0]} />
      <TrashCan position={[-74, 0.02, 80]} rotation={[0, Math.PI, 0]} />

      {/* 3D Natural Physical Grass Clumps in Central Park (on park turf around the pond) */}
      <GrassPatch position={[-60, 0.02, 32]} scale={1.2} rotationY={0.5} />
      <GrassPatch position={[-92, 0.02, 60]} scale={1.1} rotationY={1.8} />
      <GrassPatch position={[-44, 0.02, 66]} scale={1.3} rotationY={2.4} />
      <GrassPatch position={[-80, 0.02, 32]} scale={1.0} rotationY={0.9} />
      <GrassPatch position={[-44, 0.02, 45]} scale={1.15} rotationY={1.4} />
      <GrassPatch position={[-56, 0.02, 82]} scale={1.2} rotationY={3.1} />
      <GrassMix position={[-65, 0.02, 42]} scale={0.9} rotationY={1.1} />
      <GrassMix position={[-72, 0.02, 70]} scale={1.0} rotationY={2.0} />
      <GrassMix position={[-44, 0.02, 48]} scale={0.95} rotationY={0.3} />
      <GrassMix position={[-86, 0.02, 72]} scale={1.05} rotationY={1.7} />
      <GrassMix position={[-34, 0.02, 38]} scale={1.1} rotationY={2.6} />

      {/* --- SE CINEMA PLAZA & CIVIC FOUNTAIN --- */}
      <ParkingLot position={[76, 0.31, 34]} rotation={[0, 0, 0]} scale={5.0} />
      <Fountain position={[52, 0.3, 85]} scale={2.7} />
      <PlazaStairs position={[38, 0.15, 85]} rotation={[0, Math.PI / 2, 0]} scale={1.2} />
      <PlazaStairs position={[66, 0.15, 85]} rotation={[0, -Math.PI / 2, 0]} scale={1.2} />
      <Bench position={[52, 0.31, 76]} rotation={0} />
      <Bench position={[52, 0.31, 94]} rotation={Math.PI} />
      <PlanterBox position={[42, 0.31, 85]} rotation={Math.PI / 2} />
      <PlanterBox position={[62, 0.31, 85]} rotation={-Math.PI / 2} />
      <Dumpster position={[88, 0.3, 50]} rotation={[0, Math.PI / 3, 0]} />

      {/* --- RESIDENTIAL GREENERY: FLOWERS & GARDEN TREES IN HOUSE AREAS --- */}
      {/* SE House Area Flowers & Trees */}
      <Flowers position={[50, 0.2, 108]} rotation={[0, 0.2, 0]} />
      <Flowers position={[72, 0.2, 108]} rotation={[0, 1.4, 0]} />
      <Flowers position={[94, 0.2, 108]} rotation={[0, -0.6, 0]} />
      <Flowers position={[108, 0.2, 54]} rotation={[0, 0.8, 0]} />
      <Flowers position={[108, 0.2, 76]} rotation={[0, 2.1, 0]} />
      <Flowers position={[108, 0.2, 98]} rotation={[0, -1.2, 0]} />
      <Tree position={[61, 0.2, 108]} variant={3} scale={0.9} rotationY={1.1} />
      <Tree position={[83, 0.2, 108]} variant={4} scale={0.85} rotationY={2.4} />
      <Tree position={[108, 0.2, 65]} variant={1} scale={0.95} rotationY={0.4} />
      <Tree position={[108, 0.2, 87]} variant={2} scale={0.9} rotationY={1.7} />
      {/* 3D Physical Grass Clumps in SE House Lawns */}
      <GrassPatch position={[55, 0.16, 105]} scale={1.0} rotationY={0.6} />
      <GrassPatch position={[77, 0.16, 105]} scale={0.95} rotationY={1.9} />
      <GrassPatch position={[99, 0.16, 105]} scale={1.05} rotationY={2.8} />
      <GrassPatch position={[105, 0.16, 60]} scale={1.0} rotationY={0.4} />
      <GrassPatch position={[105, 0.16, 82]} scale={0.95} rotationY={1.6} />
      <GrassMix position={[66, 0.16, 106]} scale={0.85} rotationY={1.3} />
      <GrassMix position={[88, 0.16, 106]} scale={0.85} rotationY={2.2} />
      <GrassMix position={[105, 0.16, 71]} scale={0.8} rotationY={0.8} />

      {/* SW Garden Suburb Flowers & Trees (Outer SW) */}
      {[-160, -186, -212].map((x) => (
        <React.Fragment key={`sw-flora-${x}`}>
          <Flowers position={[x, 0.2, 42]} rotation={[0, ((Math.abs(x) * 1.1) % 6.28), 0]} />
          <Flowers position={[x, 0.2, 70]} rotation={[0, ((Math.abs(x) * 1.7) % 6.28), 0]} />
          <Flowers position={[x, 0.2, 98]} rotation={[0, ((Math.abs(x) * 2.3) % 6.28), 0]} />
          <Tree position={[x + 13, 0.2, 42]} variant={((Math.abs(x) % 5) + 1)} scale={0.9} rotationY={1.2} />
          <Tree position={[x + 13, 0.2, 70]} variant={((Math.abs(x) + 2) % 5 + 1)} scale={0.85} rotationY={2.5} />
          <Tree position={[x + 13, 0.2, 98]} variant={((Math.abs(x) + 3) % 5 + 1)} scale={0.95} rotationY={0.7} />
          <GrassPatch position={[x + 6, 0.16, 52]} scale={1.1} rotationY={((Math.abs(x) * 0.9) % 6.28)} />
          <GrassMix position={[x + 8, 0.16, 82]} scale={0.95} rotationY={((Math.abs(x) * 1.5) % 6.28)} />
        </React.Fragment>
      ))}

      {/* Far SE Corner Houses Flowers & Trees */}
      <Flowers position={[212, 0.2, 172]} rotation={[0, 0.5, 0]} />
      <Flowers position={[198, 0.2, 186]} rotation={[0, 1.8, 0]} />
      <Flowers position={[172, 0.2, 212]} rotation={[0, -0.4, 0]} />
      <Tree position={[200, 0.2, 172]} variant={1} scale={0.95} rotationY={0.9} />
      <Tree position={[172, 0.2, 198]} variant={5} scale={0.9} rotationY={2.1} />

      {/* =================================================================== */}
      {/* 6. MASTER CITY BUILDINGS (270 VALIDATED NON-COLLIDING INSTANCED)   */}
      {/* =================================================================== */}
      <InstancedBuildings buildings={MASTER_BUILDINGS} />
    </group>
  );
}

export default React.memo(CityChunk);

// Preload Quaternius modular floor models from new-assets
useGLTF.preload('/models/floor_tile.glb');
useGLTF.preload('/models/floor_wood.glb');
