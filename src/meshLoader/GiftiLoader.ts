import * as THREE from 'three/build/three.module'
import { parseGiiMesh } from './GiftiBase'
import { IMeshLoader } from './LoaderBase'
type TGiftiMeshLoaderInput = string

export default class GiftiMeshLoader implements IMeshLoader<TGiftiMeshLoaderInput>{
  async load(giftiString: string) {

    const { indices, normals, points } = parseGiiMesh(giftiString)

    const geom = new THREE.BufferGeometry()
    indices && geom.setIndex(Array.from(indices))
    points && geom.setAttribute(
      'position',
      new THREE.BufferAttribute( points, 3 )
    )

    normals
      ? geom.setAttribute(
          'normal',
          new THREE.BufferAttribute( normals, 3 )
        )
      : geom.computeVertexNormals()
    
    return geom
  }
}