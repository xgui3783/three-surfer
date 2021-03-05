import * as THREE from 'three/build/three.module'

export interface IThreeSurferMouseEvent {
  mouse: MouseEvent
  mesh: {
    geometry: THREE.Geometry
    faceIndex: number
    verticesIdicies: number[]
  } | null
  colormap?: {
    verticesValue: number[] 
  } | null
}

export interface IThreeSurferEventObj {
  mouseover: IThreeSurferMouseEvent
}

type TThreeSurferEventTypes = keyof IThreeSurferEventObj

export type TThreeSurferCustomEvent<K extends TThreeSurferEventTypes> = {
  type: K
  data: IThreeSurferEventObj[K]
}
