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

export interface IThreeSurferCameraEvent {
  position: {
    x: number
    y: number
    z: number
  }
  zoom: number
}

export interface IThreeSurferEventObj {
  mouseover: IThreeSurferMouseEvent
  camera: IThreeSurferCameraEvent
}

export type TThreeSurferCustomEvent<K extends keyof IThreeSurferEventObj> = {
  type: K
  data: IThreeSurferEventObj[K]
}
