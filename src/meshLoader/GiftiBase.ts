import * as gifti from 'gifti-reader-js/release/current/gifti-reader-min.js'

export function parseGii(giiString: string){
  return gifti.parse(giiString)
}

export function parseGiiMesh(giiString: string) {
  const gii = parseGii(giiString)
  const points = gii.getPointsDataArray()?.getData()
  const indices = gii.getTrianglesDataArray()?.getData()
  const normals = gii.getNormalsDataArray()?.getData()
  const labels = gii.labelTable
  if (!points) {
    throw new Error(`points not defined`)
  }

  if (!indices) {
    throw new Error(`trianges not defined`)
  }
  return {
    points, indices, normals, labels
  }
}

export function parseGiiColorIdx(giiString: string) {
  const gii = parseGii(giiString)
  if (!Array.isArray(gii?.dataArrays)) {
    throw new Error(`gii.dataArrays is not an array!`)
  }
  return gii.dataArrays.filter(item => {
    return item?.attributes?.Intent === 'NIFTI_INTENT_SHAPE'
  })
}

export interface ITypedArray {
  UINT32: Uint32Array
}

export function castF32UInt16(data: Float32Array){
  return new Uint16Array(data.buffer)
}
