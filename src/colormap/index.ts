import { IColormapConfig } from './base'
import { EnumColorMapName, mapKeyColorMap } from './util'
import * as THREE from 'three/build/three.module'
const ATTR_IDX = `vertexIdx`
const V_CUSTOM_COLOR = `vCustomColor`
const ATTR_INTENSITY = `intensity`
const V_CM_COLOR = `vCMColor`
const UNIFORM_COLORMAP = `uColorMap`

export interface IPatchShader {
  updateVertex: (vertexShader: string) => string
  updateFrag: (fragmentShader: string) => string
  getUniforms?: () => any
}

let GLOBAL_MAX = - Infinity

function getVertexFragCustom(colorMap: Map<number, [number, number, number]>):IPatchShader {
  const keys = Array.from(colorMap.keys())
  const { min, max } = keys.reduce<{ min: number, max: number}>((acc, curr) => {
    const returnObj = { ...acc }
    if (curr < acc.min) returnObj.min = curr
    if (curr > acc.max) returnObj.max = curr
    return returnObj
  }, { min: Infinity, max: -Infinity })

  if (GLOBAL_MAX < max) {
    GLOBAL_MAX = max
  }

  const updateVertex = (vertexShader: string) => {
    return vertexShader
      .replace('#include', s => [
        `attribute float ${ATTR_IDX};`,
        `uniform vec3 ${UNIFORM_COLORMAP}[${max + 1}];`,
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
      const uniformColorMap = new Array(GLOBAL_MAX + 1).fill(
        new THREE.Vector3(1, 1, 1)
      )

      for (const key of keys) {
        const color = colorMap.get(key)
        uniformColorMap[key] = new THREE.Vector3(...color)
      }

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
        `attribute float ${ATTR_INTENSITY};`,
        `varying vec3 ${V_CM_COLOR};`,
        `${s}`,
      ].join('\n'))
      .replace(/void\ main.+$/m, s => [
        premain,
        `${s}`,
        `vec3 rgb;`,
        `float x = ${ATTR_INTENSITY};`,
        // line below somehow doesn't work
        // `float x = (raw_x - ${min.toFixed(10)}) / (${(max - min).toFixed(8)}) ${ brightness > 0 ? '+' : '-' } ${Math.abs(brightness).toFixed(10)};`,
        // `vec3 rgb_contrast=${contrast === 1 ? 'rgb' : 'rgb*exp(' + contrast.toFixed(10) + ')'};`,
        main,
        `${V_CM_COLOR} = rgb;`,
      ].join('\n'))
  }

  const updateFrag = (fragShader: string) => {
    return fragShader
      .replace('#include', s => [
        `varying vec3 ${V_CM_COLOR};`,
        s,
      ].join('\n'))
      .replace('void main()', s => 
        `${premain}\n${s}`)
      .replace(/gl_FragColor.+$/m, s => {
        return [
          s,
          `gl_FragColor *=  vec4(${V_CM_COLOR}, 1.);`,
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