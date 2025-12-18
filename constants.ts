
import * as THREE from 'three';

export const PARTICLE_COUNT = 3500;
export const COLORS = {
  GOLD: 0xFFD700,
  RED: 0xFF0000,
  EMERALD: 0x50C878,
};

export const COLOR_ARRAY = [
  new THREE.Color(COLORS.GOLD),
  new THREE.Color(COLORS.RED),
  new THREE.Color(COLORS.EMERALD)
];

export const SCENE_CONFIG = {
  NEBULA_RADIUS: 15,
  TREE_HEIGHT: 12,
  TREE_RADIUS: 5,
};
