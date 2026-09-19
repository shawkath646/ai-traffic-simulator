import React, { useMemo } from 'react';
import { useGLTF, Clone } from '@react-three/drei';
import * as THREE from 'three';

const BUILDING_CONFIGS = {
  quaternius: { model: '/models/building_quaternius.glb', defaultScale: 3.6 },
  kenney_g: { model: '/models/building_kenney_g.glb', defaultScale: 7.2 },
  kenney_a: { model: '/models/building_kenney_a.glb', defaultScale: 7.5 },
  skyscraper: { model: '/models/skyscraper.glb', defaultScale: 12.5 },
  apartment: { model: '/models/apartment_building.glb', defaultScale: 1.05 },
  cinema: { model: '/models/cinema.glb', defaultScale: 0.95 },
  hospital: { model: '/models/hospital.glb', defaultScale: 0.052 },
  church: { model: '/models/church.glb', defaultScale: 1.1 },
  kay_office_1: { model: '/models/building_kay_1.glb', defaultScale: 5.5 },
  kay_office_2: { model: '/models/building_kay_2.glb', defaultScale: 5.8 },
  business: { model: '/models/business_building.glb', defaultScale: 9.0 },
  skyscraper_kenney: { model: '/models/skyscraper_kenney.glb', defaultScale: 7.5 },
  house_modern: { model: '/models/house_modern.glb', defaultScale: 1.0 },
  house_villa: { model: '/models/house_villa.glb', defaultScale: 6.0 },
};

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
