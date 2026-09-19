import React, { useMemo } from 'react';
import * as THREE from 'three';

// Shader material for distant faded skyline towers in one corner
// Blends deep atmospheric skyline shadow at base into pale horizon haze at high altitude and distance
const farSkylineShader = {
  uniforms: {
    shadowColor: { value: new THREE.Color('#253346') }, // Atmospheric distant tower silhouette
    hazeColor: { value: new THREE.Color('#bae6fd') }, // Soft pale horizon sky blue
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    varying float vNormalizedHeight;

    void main() {
      vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      // position.y is from -0.5 to 0.5 in unit box
      vNormalizedHeight = position.y + 0.5;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 shadowColor;
    uniform vec3 hazeColor;
    varying vec3 vWorldPosition;
    varying float vNormalizedHeight;

    void main() {
      float dist = length(vWorldPosition.xz);
      // Atmospheric distance fade from 320m out to 520m
      float distFactor = clamp((dist - 320.0) / 200.0, 0.0, 0.90);

      // Towers softly fade into the clean blue horizon haze
      float fade = clamp(distFactor * 0.70 + vNormalizedHeight * 0.32, 0.0, 0.92);
      vec3 col = mix(shadowColor, hazeColor, fade);

      gl_FragColor = vec4(col, 0.90);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

function FarCitySkyline() {
  const count = 48;

  // Single unit box geometry shared across all 48 silhouette towers
  const boxGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(farSkylineShader.uniforms),
      vertexShader: farSkylineShader.vertexShader,
      fragmentShader: farSkylineShader.fragmentShader,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  // Compute instance matrices for 48 distant skyline towers concentrated in ONE corner (NE: +X, -Z)
  // Strictly outside city bounds (X > 280m, Z < -280m), leaving all 3 other sides completely open
  const instancedMesh = useMemo(() => {
    const mesh = new THREE.InstancedMesh(boxGeometry, material, count);
    const dummy = new THREE.Object3D();

    const pseudoRand = (seed) => {
      const x = Math.sin(seed * 9871.432) * 10000;
      return x - Math.floor(x);
    };

    // Realistic skyline cluster in the North-East diagonal quadrant beyond the 285m city perimeter
    for (let i = 0; i < count; i++) {
      // Distribute towers across X: 285m to 480m, Z: -480m to -285m
      // Clustered like a real distant downtown skyline on the horizon
      const row = Math.floor(i / 8);
      const col = i % 8;

      const baseX = 285 + col * 28 + (pseudoRand(i * 1.7) - 0.5) * 10;
      const baseZ = -(285 + row * 32 + (pseudoRand(i * 2.3) - 0.5) * 10);

      const width = 10 + pseudoRand(i * 3.1) * 14;
      const depth = 10 + pseudoRand(i * 4.7) * 14;
      // Tall skyline silhouette spikes and high-rise crowns
      const isMegaTower = i % 7 === 0;
      const height = isMegaTower
        ? 130 + pseudoRand(i * 5.9) * 55 // 130m to 185m signature spires
        : 50 + pseudoRand(i * 5.3) * 65; // 50m to 115m high-rises

      dummy.position.set(baseX, height / 2, baseZ);
      dummy.rotation.set(0, (pseudoRand(i * 6.7) - 0.5) * 0.5, 0);
      dummy.scale.set(width, height, depth);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [boxGeometry, material, count]);

  return (
    <group>
      {/* Distant city skyline towers in ONE corner (NE), 3 sides completely open to the blue horizon */}
      <primitive object={instancedMesh} />
    </group>
  );
}

export default React.memo(FarCitySkyline);
