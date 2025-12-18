
import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { PARTICLE_COUNT, COLOR_ARRAY, SCENE_CONFIG } from '../constants';
import { GestureState } from '../types';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

const dummy = new THREE.Object3D();

interface SceneInnerProps {
  gesture: GestureState;
}

const Particles: React.FC<SceneInnerProps> = ({ gesture }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const sphereMeshRef = useRef<THREE.InstancedMesh>(null!);
  
  const halfCount = Math.floor(PARTICLE_COUNT / 2);

  const targets = useMemo(() => {
    const nebula = new Float32Array(PARTICLE_COUNT * 3);
    const tree = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = Math.pow(Math.random(), 1/3) * SCENE_CONFIG.NEBULA_RADIUS;
      nebula[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      nebula[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      nebula[i * 3 + 2] = r * Math.cos(phi);

      const py = Math.random() * SCENE_CONFIG.TREE_HEIGHT;
      const pr = (1 - py / SCENE_CONFIG.TREE_HEIGHT) * SCENE_CONFIG.TREE_RADIUS * (0.2 + Math.random() * 0.8);
      const angle = Math.random() * Math.PI * 2;
      tree[i * 3 + 0] = pr * Math.cos(angle);
      tree[i * 3 + 1] = py - SCENE_CONFIG.TREE_HEIGHT / 2;
      tree[i * 3 + 2] = pr * Math.sin(angle);
    }
    return { nebula, tree };
  }, []);

  const currentPositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  useEffect(() => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      currentPositions[i * 3] = targets.nebula[i * 3];
      currentPositions[i * 3 + 1] = targets.nebula[i * 3 + 1];
      currentPositions[i * 3 + 2] = targets.nebula[i * 3 + 2];
    }
  }, [targets, currentPositions]);

  useEffect(() => {
    [meshRef.current, sphereMeshRef.current].forEach((mesh, meshIdx) => {
      if (!mesh) return;
      const count = meshIdx === 0 ? halfCount : PARTICLE_COUNT - halfCount;
      for (let i = 0; i < count; i++) {
        const globalIdx = meshIdx === 0 ? i : halfCount + i;
        const color = COLOR_ARRAY[globalIdx % COLOR_ARRAY.length];
        mesh.setColorAt(i, color);
      }
      mesh.instanceColor!.needsUpdate = true;
    });
  }, [halfCount]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const targetArr = gesture === 'TREE' ? targets.tree : targets.nebula;
    const lerpFactor = gesture === 'IDLE' ? 0.02 : 0.08;

    for (let i = 0; i < halfCount; i++) {
      const idx = i;
      currentPositions[idx * 3] += (targetArr[idx * 3] - currentPositions[idx * 3]) * lerpFactor;
      currentPositions[idx * 3 + 1] += (targetArr[idx * 3 + 1] - currentPositions[idx * 3 + 1]) * lerpFactor;
      currentPositions[idx * 3 + 2] += (targetArr[idx * 3 + 2] - currentPositions[idx * 3 + 2]) * lerpFactor;

      dummy.position.set(currentPositions[idx * 3], currentPositions[idx * 3 + 1] + Math.sin(time + idx) * 0.1, currentPositions[idx * 3 + 2]);
      dummy.rotation.set(time * 0.5 + idx, time * 0.2 + idx, time * 0.3);
      const s = 0.12 + Math.sin(time * 2 + idx) * 0.04;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    for (let i = 0; i < (PARTICLE_COUNT - halfCount); i++) {
      const idx = halfCount + i;
      currentPositions[idx * 3] += (targetArr[idx * 3] - currentPositions[idx * 3]) * lerpFactor;
      currentPositions[idx * 3 + 1] += (targetArr[idx * 3 + 1] - currentPositions[idx * 3 + 1]) * lerpFactor;
      currentPositions[idx * 3 + 2] += (targetArr[idx * 3 + 2] - currentPositions[idx * 3 + 2]) * lerpFactor;

      dummy.position.set(currentPositions[idx * 3], currentPositions[idx * 3 + 1] + Math.cos(time + idx) * 0.1, currentPositions[idx * 3 + 2]);
      dummy.rotation.set(time * 0.3 + idx, time * 0.1, time * 0.5 + idx);
      const s = 0.12 + Math.cos(time * 1.5 + idx) * 0.04;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      sphereMeshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    sphereMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, halfCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.9} roughness={0.1} />
      </instancedMesh>
      <instancedMesh ref={sphereMeshRef} args={[undefined as any, undefined as any, PARTICLE_COUNT - halfCount]}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshStandardMaterial metalness={0.9} roughness={0.1} />
      </instancedMesh>
    </>
  );
};

const ChristmasStar: React.FC<SceneInnerProps> = ({ gesture }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.y = time * 1.5;
      
      const targetScale = gesture === 'TREE' ? 1.8 : 0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      meshRef.current.position.y = SCENE_CONFIG.TREE_HEIGHT / 2 + 1.2 + Math.sin(time * 2.5) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, SCENE_CONFIG.TREE_HEIGHT / 2 + 1.2, 0]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={0xFFD700} emissive={0xFFD700} emissiveIntensity={10} />
    </mesh>
  );
};

const PostProcessing = () => {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      1.8, // strength
      0.5, // radius
      0.1  // threshold
    );
    const comp = new EffectComposer(gl);
    comp.addPass(renderScene);
    comp.addPass(bloomPass);
    return comp;
  }, [gl, scene, camera, size]);

  useFrame(() => {
    composer.render();
  }, 1);

  return null;
};

const ChristmasScene: React.FC<SceneInnerProps> = ({ gesture }) => {
  return (
    <Canvas 
      camera={{ position: [0, 0, 30], fov: 45 }}
      gl={{ antialias: false, alpha: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={2} color={0xFFD700} />
      <pointLight position={[-10, -10, -10]} intensity={2} color={0xFF0000} />
      <pointLight position={[0, 0, 5]} intensity={1} color={0x50C878} />
      
      <Particles gesture={gesture} />
      <ChristmasStar gesture={gesture} />
      
      <PostProcessing />
    </Canvas>
  );
};

export default ChristmasScene;
