import * as THREE from 'three/build/three.module'

export interface IThreeSurferMouseEvent {
  mouse: MouseEvent
  mesh: {
    geometry: THREE.Geometry
    faceIndex: number
    vertexIndex: number
    verticesIndicies: number[]
  } | null
  colormap?: {
    verticesValue: number[] 
  } | null
}

export interface IThreeSurferCameraEvent {
  position: {
    x: number
    y: number
    z: number
  }
  zoom: number|null
}

export interface IThreeSurferEventObj {
  mouseover: IThreeSurferMouseEvent
  camera: IThreeSurferCameraEvent
}

export type TThreeSurferCustomEvent<K extends keyof IThreeSurferEventObj> = {
  type: K
  data: IThreeSurferEventObj[K]
}
