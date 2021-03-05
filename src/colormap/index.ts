import { IColormapConfig } from './base'
import { EnumColorMapName, mapKeyColorMap } from './util'

const ATTR_INTENSITY = `intensity`

const VARY_FLOAT_INTENSITY = `vInts`

export interface IPatchShader {
  updateVertex: (vertexShader: string) => string
  updateFrag: (fragmentShader: string) => string
}

function getVertexFrag(option: IColormapConfig & { type: EnumColorMapName } ): IPatchShader {
  const { type, ...rest } = option
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

  const vertex = `
attribute float ${ATTR_INTENSITY};
varying float ${VARY_FLOAT_INTENSITY};

void main() {
  ${VARY_FLOAT_INTENSITY} = ${ATTR_INTENSITY};
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
}
`
  
  const frag = `
${header}
varying float ${VARY_FLOAT_INTENSITY};
${premain}
void main(){
  
  vec3 rgb;
  float raw_x = ${VARY_FLOAT_INTENSITY} * ${multiplier.toFixed(8)};
  float x = (raw_x - ${min.toFixed(10)}) / (${(max - min).toFixed(8)}) ${ brightness > 0 ? '+' : '-' } ${Math.abs(brightness).toFixed(10)};
  ${main}
  vec3 rgb_contrast=${contrast === 1 ? 'rgb' : 'rgb*exp(' + contrast.toFixed(10) + ')'};
  

	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
}
`
  const updateVertex = (vertexShader: string) => vertexShader
    .replace('#include', s => [
      `attribute float ${ATTR_INTENSITY};`,
      `varying float ${VARY_FLOAT_INTENSITY};`,
      `${s}`,
    ].join('\n'))
    .replace(/void\ main.+$/m, s => [
      `${s}`,
      `${VARY_FLOAT_INTENSITY} = ${ATTR_INTENSITY};`,
    ].join('\n'))

  const updateFrag = (fragShader: string) => fragShader
    .replace('#include', s => 
      `varying float ${VARY_FLOAT_INTENSITY};\n${s}`)
    .replace('void main()', s => 
      `${premain}\n${s}`)
    .replace(/gl_FragColor.+$/m, s => {
      return [
        
        s,
        `vec3 rgb;`,
        `float x = ${VARY_FLOAT_INTENSITY} * ${multiplier.toFixed(8)};`,
        // line below somehow doesn't work
        // `float x = (raw_x - ${min.toFixed(10)}) / (${(max - min).toFixed(8)}) ${ brightness > 0 ? '+' : '-' } ${Math.abs(brightness).toFixed(10)};`,
        main,
        // `vec3 rgb_contrast=${contrast === 1 ? 'rgb' : 'rgb*exp(' + contrast.toFixed(10) + ')'};`,
        `gl_FragColor *=  vec4(rgb, 1.);`,
      ].join('\n')
    })
    
  return {
    updateVertex,
    updateFrag,
  }
}

export {
  EnumColorMapName,
  getVertexFrag,
  ATTR_INTENSITY,
}