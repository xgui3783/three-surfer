import { parseAnnotColorIdx } from "./Annot"
import { parseGiiColorIdx } from "./GiftiBase"

export const MeshParser = {
  ".gii": parseGiiColorIdx,
  ".annot": parseAnnotColorIdx
} as const
