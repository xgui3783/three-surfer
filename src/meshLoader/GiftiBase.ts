import * as gifti from 'gifti-reader-js/release/current/gifti-reader-min.js'

export function parseGii(giiString: string){
  return gifti.parse(giiString)
}

type TSupportedTypedArray = Uint8Array | Int32Array | Float32Array

function populate(indexOrder: string, typedArray: TSupportedTypedArray, dim: number[]): TSupportedTypedArray {
  if (indexOrder !== 'ColumnMajorOrder') {
    return typedArray
  }

  const clone = typedArray.slice(0)
  
  for (const idx in clone) {
    const index = Number(idx)
    const col = index % 3
    const row = (index - col) / dim[1]
    clone[index] = typedArray[ col * dim[0] + row ]
  }
  return clone
}

export function parseGiiMesh(giiString: string) {
  const gii = parseGii(giiString)
  let points: any,
    indices: any,
    normals: any
  const ptDA = gii.getPointsDataArray()
  if (ptDA) {
    const indexOrder = ptDA['attributes']['ArrayIndexingOrder']
    const data = ptDA.getData()
    const dim = [
      Number(ptDA['attributes']['Dim0']),
      Number(ptDA['attributes']['Dim1'])
    ]
    points = populate(
      indexOrder,
      data,
      dim
    )
  }

  const triDa = gii.getTrianglesDataArray()
  if (triDa) {
    const indexOrder = triDa['attributes']['ArrayIndexingOrder']
    const data = triDa.getData()
    const dim = [
      triDa['attributes']['Dim0'],
      triDa['attributes']['Dim1']
    ]
    indices = populate(
      indexOrder,
      data,
      dim
    )
  }

  const normalDa = gii.getNormalsDataArray()
  if (normalDa) {
    const indexOrder = normalDa['attributes']['ArrayIndexingOrder']
    const data = normalDa.getData()
    const dim = [
      normalDa['attributes']['Dim0'],
      normalDa['attributes']['Dim1']
    ]
    normals = populate(
      indexOrder,
      data,
      dim
    )
  }
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
