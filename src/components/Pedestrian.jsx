import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

function Pedestrian({ data }) {
  const groupRef = useRef();
  const modelUrl = data.model || '/models/character_woman.glb';
  const { scene, animations } = useGLTF(modelUrl);

  // Deep clone skinned mesh & bones properly so each pedestrian has an independent skeleton
  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    c.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  const { actions } = useAnimations(animations, groupRef);
  const activeClipRef = useRef(null);

  // Find appropriate walk, run, and idle clips from available action names
  const actionNames = useMemo(() => (actions ? Object.keys(actions) : []), [actions]);
  const walkClip = useMemo(
    () => data.walkAnim || actionNames.find((n) => n.toLowerCase().includes('walk')) || actionNames[0],
    [data.walkAnim, actionNames]
  );
  const runClip = useMemo(
    () =>
      actionNames.find((n) => {
        const s = n.toLowerCase();
        return (
          s.includes('run') &&
          !s.includes('back') &&
          !s.includes('shoot') &&
          !s.includes('left') &&
          !s.includes('right') &&
          !s.includes('jump')
        );
      }) || walkClip,
    [actionNames, walkClip]
  );
  const idleClip = useMemo(
    () =>
      data.idleAnim ||
      actionNames.find(
        (n) => n.toLowerCase().includes('idle') && !n.toLowerCase().includes('sword') && !n.toLowerCase().includes('gun')
      ) ||
      actionNames[1] ||
      walkClip,
    [data.idleAnim, actionNames, walkClip]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (actions) {
        Object.values(actions).forEach((action) => action?.stop());
      }
    };
  }, [actions]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.x = data.x;
    groupRef.current.position.z = data.z;

    // Smooth heading rotation interpolation
    let targetYaw = 0;
    if (data.movesAlongX) {
      targetYaw = data.targetX > data.x ? Math.PI / 2 : -Math.PI / 2;
    } else {
      targetYaw = data.targetZ > data.z ? 0 : Math.PI;
    }

    const currentYaw = groupRef.current.rotation.y;
    let diff = (targetYaw - currentYaw) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y = currentYaw + diff * 0.25;

    // Synchronize animation clips (Idle, Walk, Reactive Jogging Run) directly every frame
    if (actions) {
      const targetClip = data.waiting ? idleClip : data.isJogging ? runClip : walkClip;
      if (activeClipRef.current !== targetClip && actions[targetClip]) {
        if (activeClipRef.current && actions[activeClipRef.current]) {
          actions[activeClipRef.current].fadeOut(0.22);
        }
        const action = actions[targetClip].reset().fadeIn(0.22);
        const baseSpeed = data.isJogging ? 3.0 : 1.6;
        action.setEffectiveTimeScale((data.speed || baseSpeed) / baseSpeed);
        action.play();
        activeClipRef.current = targetClip;
      }
    }
  });

  let initialYaw = 0;
  if (data.movesAlongX) {
    initialYaw = data.targetX > data.x ? Math.PI / 2 : -Math.PI / 2;
  } else {
    initialYaw = data.targetZ > data.z ? 0 : Math.PI;
  }

  const s = data.modelScale || 1.0;

  return (
    <group ref={groupRef} position={[data.x, 0, data.z]} rotation={[0, initialYaw, 0]}>
      <primitive object={clone} scale={[s, s, s]} />
    </group>
  );
}

// Preload character models
useGLTF.preload('/models/character_woman.glb');
useGLTF.preload('/models/character_businessman.glb');
useGLTF.preload('/models/character_hoodie.glb');
useGLTF.preload('/models/character_man.glb');
useGLTF.preload('/models/character_punk.glb');

export default React.memo(Pedestrian);
