
export type GestureState = 'IDLE' | 'EXPLODE' | 'TREE';

export interface ParticleData {
  id: number;
  color: string;
  shape: 'sphere' | 'box';
}
