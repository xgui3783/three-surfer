import * as THREE from 'three/build/three.module'
import IAnimatable from './Animatable'

export default class Ambience implements IAnimatable{
  
  private direction1: THREE.DirectionalLight
  private direction2: THREE.DirectionalLight
  private ambience: THREE.AmbientLight
  private origin: THREE.Object3D

  constructor(_origin: THREE.Object3D){
    this.origin = _origin
    this.setupLight()
  }

  setupLight(){
    this.direction1 = new THREE.DirectionalLight(0xffffff, 0.7)
    this.direction1.position.set(0, 0, 1)
    this.direction1.lookAt(0, 0, 0)
    this.origin.add(this.direction1)

    this.direction2 = new THREE.DirectionalLight(0xffffff, 0.3)
    this.direction2.position.set(0, 0, -1)
    this.direction2.lookAt(0, 0, 0)
    this.origin.add(this.direction2)

    this.ambience = new THREE.AmbientLight(0xffffff, 0.5)
    this.origin.add(this.ambience)
  }

  animate() {

  }
}