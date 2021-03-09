import { IColormapConfig } from './base'
import { EnumColorMapName, mapKeyColorMap } from './util'
import * as THREE from 'three/build/three.module'
const ATTR_IDX = `vertexIdx`
const V_CUSTOM_COLOR = `vCustomColor`
const ATTR_INTENSITY = `intensity`
const VARY_FLOAT_INTENSITY = `vInts`
const UNIFORM_COLORMAP = `uColorMap`

export interface IPatchShader {
  updateVertex: (vertexShader: string) => string
  updateFrag: (fragmentShader: string) => string
  getUniforms?: () => any
}

function getVertexFragCustom(colorMap: Map<number, [number, number, number]>):IPatchShader {
  const keys = Array.from(colorMap.keys())
  const { min, max } = keys.reduce<{ min: number, max: number}>((acc, curr) => {
    const returnObj = { ...acc }
    if (acc.min === null || curr < acc.min) returnObj.min = curr
    if (acc.max === null || curr > acc.max) returnObj.max = curr
    return returnObj
  }, { min: null, max: null })

  const uniformColorMap = new Array(max).fill(
    new THREE.Vector3(1, 1, 1)
  )

  for (const key of keys) {
    const color = colorMap.get(key)
    uniformColorMap[key] = new THREE.Vector3(...color)
  }

  const updateVertex = (vertexShader: string) => {
    return vertexShader
      .replace('#include', s => [
        `attribute float ${ATTR_IDX};`,
        `uniform vec3 ${UNIFORM_COLORMAP}[${max}];`,
        `varying vec3 ${V_CUSTOM_COLOR};`,
        `${s}`,
      ].join('\n'))
      .replace(/void\ main.+$/m, s => [
        s,
        `${V_CUSTOM_COLOR} = ${UNIFORM_COLORMAP}[int(${ATTR_IDX})];`
      ].join('\n'))
  }

  const updateFrag = (fragShader: string) => {
    return fragShader
      .replace('#include', s => [
        `varying vec3 ${V_CUSTOM_COLOR};`,
        s,
      ].join('\n'))
      .replace(/gl_FragColor.+$/m, s => {
        return [
          s,
          `gl_FragColor *=  vec4(${V_CUSTOM_COLOR}, 1.);`,
        ].join('\n')
      })
  }
  return {
    updateFrag,
    updateVertex,
    getUniforms: () => {
      return {
        [UNIFORM_COLORMAP]: {
          value: uniformColorMap
        }
      }
    }
  }
}

function getVertexFrag(option: IColormapConfig & { type: EnumColorMapName, id: string } ): IPatchShader {
  const { type, id, ...rest } = option
  
  const attrInt = `${ATTR_INTENSITY}`
  const varInt = `${VARY_FLOAT_INTENSITY}`

  const colorMap = mapKeyColorMap.get(type)
  if (!colorMap) {
    throw new Error(`colormap ${type} not found!`)
  }
  const {
    clamp,
    brightness=1,
    multiplier=1,
    contrast=1,
  } = rest
  const {
    max=1,
    min=0,
  } = clamp || {}
  const {
    header,
    main,
    premain
  } = colorMap

  const updateVertex = (vertexShader: string) => {
    return vertexShader
      .replace('#include', s => [
        `attribute float ${attrInt};`,
        `varying float ${varInt};`,
        `${s}`,
      ].join('\n'))
      .replace(/void\ main.+$/m, s => [
        `${s}`,
        `${varInt} = ${attrInt};`,
      ].join('\n'))
  }

  const updateFrag = (fragShader: string) => {
    return fragShader
      .replace('#include', s => 
        `varying float ${varInt};\n${s}`)
      .replace('void main()', s => 
        `${premain}\n${s}`)
      .replace(/gl_FragColor.+$/m, s => {
        return [
          s,
          `vec3 rgb;`,
          `float x = ${varInt} * ${multiplier.toFixed(8)};`,
          // line below somehow doesn't work
          // `float x = (raw_x - ${min.toFixed(10)}) / (${(max - min).toFixed(8)}) ${ brightness > 0 ? '+' : '-' } ${Math.abs(brightness).toFixed(10)};`,
          main,
          // `vec3 rgb_contrast=${contrast === 1 ? 'rgb' : 'rgb*exp(' + contrast.toFixed(10) + ')'};`,
          `gl_FragColor *=  vec4(rgb, 1.);`,
        ].join('\n')
      })
  }
    
  return {
    updateVertex,
    updateFrag,
  }
}

export {
  EnumColorMapName,
  getVertexFrag,
  getVertexFragCustom,
  ATTR_INTENSITY,
  ATTR_IDX,
}