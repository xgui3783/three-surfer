/**
 * annot spec:
 * https://surfer.nmr.mgh.harvard.edu/fswiki/LabelsClutsAnnotationFiles
 */

import { VertexColorMap } from "../colormap/util";

const LE_FLAG = false
const dec = new TextDecoder()

function getText(ab: ArrayBuffer, start: number, end: number): string {
  const returnStr = new Uint8Array(ab.slice(start, end))
  if (returnStr[returnStr.length -1 ] !== 0) {
    throw new Error(`fname terminal byte must be0, but is ${returnStr[returnStr.length -1 ]} instead!`)
  }
  
  return dec.decode(returnStr.slice(0, returnStr.length - 1))
}

export async function parseAnnotColorIdx(ab: ArrayBuffer): Promise<VertexColorMap> {
  
  const vertex: number[] = []

  const buf = new DataView(ab)
  const numVertex = buf.getUint32(0, LE_FLAG)
  const mapping: Record<number, VertexColorMap['labels'][number]> = {}
  
  for (let vtxIdx = 0; vtxIdx < numVertex; vtxIdx ++){
    const offset = vtxIdx * 8 + 4
    const vtxIdxVal = buf.getInt32(offset, LE_FLAG)
    const vtxLabelVal = buf.getInt32(offset + 4, LE_FLAG)

    if (!(vtxLabelVal in mapping)) {
      mapping[vtxLabelVal] = {
        index: -1,
        name: 'Untitled',
        color: [128, 128, 128],
        vertices: []
      }
    }
    mapping[vtxLabelVal].vertices.push(vtxIdxVal)

    vertex.push(vtxLabelVal)
  }

  let offset = numVertex * 8 + 4
  const tag = buf.getInt32(offset, LE_FLAG)
  offset += 4

  // >0 means "old format", <0 means "new format" (new shown below)
  const ctabversion = buf.getInt32(offset, LE_FLAG)
  offset += 4
  const maxstruc = buf.getInt32(offset, LE_FLAG)
  offset += 4
  const len = buf.getInt32(offset, LE_FLAG)
  offset += 4

  const decodedFname = getText(ab, offset, offset + len)

  offset += len
  const num_entries = buf.getInt32(offset, LE_FLAG)
  offset += 4

  for (let strucIdx = 0; strucIdx < num_entries; strucIdx ++){
    const Label = buf.getInt32(offset, LE_FLAG)
    offset += 4
    const len = buf.getInt32(offset, LE_FLAG)
    offset += 4
    const labelname = getText(ab, offset, offset + len)
    offset += len
    const red = buf.getInt32(offset, LE_FLAG)
    offset += 4
    const green = buf.getInt32(offset, LE_FLAG)
    offset += 4
    const blue = buf.getInt32(offset, LE_FLAG)
    offset += 4
    const transp = buf.getInt32(offset, LE_FLAG)
    offset += 4

    const key = blue * 256 * 256 + green * 256 + red

    if (key in mapping) {
      mapping[key].color = [red, green, blue]
      mapping[key].name = labelname
      mapping[key].index = Label
    }
  }

  const labels = Array.from(Object.values(mapping))

  const vertexLabels = new Uint16Array(
    vertex.map((vertexLabel: number) => {
      if (vertexLabel in mapping) {
        if (mapping[vertexLabel].index >= 0) {
          return mapping[vertexLabel].index
        }
      }
      return vertexLabel
    })
  )

  const colormap = new Map<number, number[]>()
  for (const label of labels) {
    colormap.set(label.index, label.color.every(v => v === 0)
      ? [1, 1, 1]
      : label.color.map(v => v / 256))
  }
  return {
    vertex,
    labels,
    vertexLabels,
    colormap,
  }
}
