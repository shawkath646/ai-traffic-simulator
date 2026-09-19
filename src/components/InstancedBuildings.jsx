import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BUILDING_CONFIGS } from '../utils/buildingConfigs';

// Global cache of processed geometry parts per model path to avoid re-merging
const modelPartsCache = new Map();

function getProcessedModelParts(modelPath, rawScene) {
  if (modelPartsCache.has(modelPath)) {
    return modelPartsCache.get(modelPath);
  }

  // Deep clone to avoid mutating Drei's GLTF cache
  const cloned = rawScene.clone(true);
  const box = new THREE.Box3().setFromObject(cloned);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Normalize mesh so its geometric center is at (0, 0) and bottom sits flat on ground (Y = 0)
  cloned.position.set(-center.x, -box.min.y, -center.z);

  const wrapper = new THREE.Group();
  wrapper.add(cloned);
  wrapper.updateMatrixWorld(true);

  // Group submeshes by material
  const byMat = new Map();
  wrapper.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const mat = child.material;
      const key = Array.isArray(mat) ? mat[0].uuid : mat.uuid;
      if (!byMat.has(key)) {
        byMat.set(key, { material: mat, geometries: [] });
      }
      const geom = child.geometry.clone();
      geom.applyMatrix4(child.matrixWorld);
      byMat.get(key).geometries.push(geom);
    }
  });

  const parts = [];
  for (const group of byMat.values()) {
    let finalGeom;
    if (group.geometries.length === 1) {
      finalGeom = group.geometries[0];
    } else {
      finalGeom = mergeGeometries(group.geometries, false);
    }
    if (finalGeom) {
      finalGeom.computeBoundingBox();
      finalGeom.computeBoundingSphere();
      parts.push({
        geometry: finalGeom,
        material: group.material,
      });
    }
  }

  modelPartsCache.set(modelPath, parts);
  return parts;
}

function InstancedBuildingType({ type, instances }) {
  const config = BUILDING_CONFIGS[type] || BUILDING_CONFIGS.quaternius;
  const { scene } = useGLTF(config.model);

  const instancedMeshes = useMemo(() => {
    if (!instances || instances.length === 0) return [];

    const parts = getProcessedModelParts(config.model, scene);
    const count = instances.length;
    const dummy = new THREE.Object3D();
    const dummyEuler = new THREE.Euler(0, 0, 0, 'XYZ');

    return parts.map((part) => {
      const mesh = new THREE.InstancedMesh(part.geometry, part.material, count);
      for (let i = 0; i < count; i++) {
        const inst = instances[i];
        const s = config.defaultScale * (inst.scale ?? 1.0);
        dummy.position.set(inst.pos[0], inst.pos[1], inst.pos[2]);
        dummyEuler.set(inst.rot[0] || 0, inst.rot[1] || 0, inst.rot[2] || 0);
        dummy.setRotationFromEuler(dummyEuler);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.frustumCulled = false; // Prevents pop-in culling artifacts during camera orbits
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    });
  }, [config, scene, instances]);

  return (
    <>
      {instancedMeshes.map((mesh, idx) => (
        <primitive key={`${type}-mesh-${idx}`} object={mesh} />
      ))}
    </>
  );
}

const MemoizedInstancedBuildingType = React.memo(InstancedBuildingType);

function InstancedBuildings({ buildings = [] }) {
  const groupedBuildings = useMemo(() => {
    const map = new Map();
    buildings.forEach((b) => {
      const type = b.type || 'quaternius';
      if (!map.has(type)) {
        map.set(type, []);
      }
      map.get(type).push(b);
    });
    return Array.from(map.entries());
  }, [buildings]);

  return (
    <group>
      {groupedBuildings.map(([type, instances]) => (
        <MemoizedInstancedBuildingType key={type} type={type} instances={instances} />
      ))}
    </group>
  );
}

export default React.memo(InstancedBuildings);

// Preload all 14 building GLTF assets
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
