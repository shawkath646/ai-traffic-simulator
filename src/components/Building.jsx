import React, { useMemo } from 'react';
import { useGLTF, Clone } from '@react-three/drei';
import * as THREE from 'three';

import { BUILDING_CONFIGS } from '../utils/buildingConfigs';

// Global cache of centered model scenes (computed once per model type)
// This normalizes any raw model offsets (such as house_modern's -109m internal offset)
// ensuring every building rotates around its true geometric center and rests flat on Y=0
const centeredSceneCache = new Map();

function getCenteredScene(modelPath, rawScene) {
  if (centeredSceneCache.has(modelPath)) {
    return centeredSceneCache.get(modelPath);
  }
  const cloned = rawScene.clone(true);
  const box = new THREE.Box3().setFromObject(cloned);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Shift mesh so geometric center is at (0, 0) and bottom sits flat on ground (Y = 0)
  cloned.position.set(-center.x, -box.min.y, -center.z);

  const wrapper = new THREE.Group();
  wrapper.add(cloned);
  centeredSceneCache.set(modelPath, wrapper);
  return wrapper;
}

function Building({
  position,
  rotation = [0, 0, 0],
  type = 'quaternius',
  scaleMultiplier = 1.0,
}) {
  if (!BUILDING_CONFIGS[type] && process.env.NODE_ENV !== 'production') {
    console.warn(`Building: unknown type "${type}", falling back to "quaternius"`);
  }
  const config = BUILDING_CONFIGS[type] || BUILDING_CONFIGS.quaternius;
  const { scene } = useGLTF(config.model);

  const centeredScene = useMemo(() => {
    return getCenteredScene(config.model, scene);
  }, [config.model, scene]);

  const s = config.defaultScale * scaleMultiplier;

  return (
    <group position={position} rotation={rotation}>
      <Clone object={centeredScene} scale={[s, s, s]} castShadow receiveShadow />
    </group>
  );
}

export default React.memo(Building);

// Preload buildings
useGLTF.preload('/models/building_quaternius.glb');
useGLTF.preload('/models/building_kenney_g.glb');
useGLTF.preload('/models/building_kenney_a.glb');
useGLTF.preload('/models/skyscraper.glb');
useGLTF.preload('/models/apartment_building.glb');
useGLTF.preload('/models/cinema.glb');
useGLTF.preload('/models/hospital.glb');
useGLTF.preload('/models/church.glb');
useGLTF.preload('/models/building_kay_1.glb');
useGLTF.preload('/models/building_kay_2.glb');
useGLTF.preload('/models/business_building.glb');
useGLTF.preload('/models/skyscraper_kenney.glb');
useGLTF.preload('/models/house_modern.glb');
useGLTF.preload('/models/house_villa.glb');
