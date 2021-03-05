import { BufferGeometry } from 'three/build/three.module'

export interface IMeshLoader<T> {
  load(arg: T): Promise<BufferGeometry>
}