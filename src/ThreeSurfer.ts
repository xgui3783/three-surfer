import GiftiMeshLoader from './meshLoader/GiftiLoader'
import { parseGiiColorIdx, parseGii, parseGiiMesh } from './meshLoader/GiftiBase'
import UrlLoader from './resLoader/UrlLoader'
import * as THREE from 'three/build/three.module'
import IDisposable from './Disposable'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import IAnimatable from './Animatable'
import Ambience from './Ambience'
import { ATTR_IDX, ATTR_INTENSITY, getVertexFrag, EnumColorMapName, IPatchShader, getVertexFragCustom } from './colormap'
import { IThreeSurferMouseEvent } from './events'

function cvtNumToLetters(n){
  let v = n
  let out = []
  const startCap = 65
  const startLow = 97
  while(v>0) {
    const rem = v % 52
    out.push(
      rem >= 26
        ? String.fromCharCode(startCap+rem-26)
        : String.fromCharCode(startLow+rem)
    )
    v = (v - rem) / 52
  }
  return out.join('')
}

function getUuid(){
  let v = crypto.getRandomValues(new Uint32Array(1))[0]
  return cvtNumToLetters(v)
}

let LINE_ZFIGHTING_MULTIPLE: number = 0.005

type TWeakmap = {
  mesh: THREE.Mesh
  shaders?: IPatchShader
  idxMap?: number[]
}

interface IThreeSurferOptions {
  highlightHovered: boolean
  useCache?: boolean
}

interface IThreeColorMapOptions {
  usePreset?: EnumColorMapName
  custom?: Map<number, [number, number, number]>
}


export default class ThreeSurfer implements IDisposable, IAnimatable{
  static CUSTOM_EVENTNAME = 'threeSurferCustomEvent'
  static GiftiMeshLoader = GiftiMeshLoader
  static COLOR_MAPS = EnumColorMapName

  static GiftiBase = {
    parseGiiColorIdx, parseGii, parseGiiMesh,
  }

  private options: IThreeSurferOptions = {
    highlightHovered: false
  }

  private highlightLine: THREE.Line

  private defaultMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    blending: THREE.NormalBlending,
  })

  private control: OrbitControls

  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.Renderer
  private origin: THREE.Object3D
  private el: HTMLElement

  private gridHelper: THREE.GridHelper
  private animateHook: (() => void) [] = []

  private customColormap: WeakMap<THREE.Geometry, TWeakmap> = new WeakMap()
  private giftiLoader = new GiftiMeshLoader()

  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  async loadMesh(url: string) {
    // check input type, use url loader or file loader
    const l = new UrlLoader({ useCache: this.options?.useCache })
    const str = await l.load(url)

    // check mesh type?
    const geom = await this.giftiLoader.load(str)

    const mesh = new THREE.Mesh( geom, this.defaultMaterial )
    this.customColormap.set(geom, {
      mesh
    })
    this.origin.add(
      mesh
    )
    return geom
  }

  unloadMesh(geom: THREE.Geometry) {
    const obj = this.customColormap.get(geom)
    if (obj && obj.mesh) {
      this.origin.remove(obj.mesh)
    }
  }

  redraw(geometry: THREE.Geometry) {
    this.unloadMesh(geometry)
    const colormap = this.customColormap.get(geometry)
    if (!colormap) {
      throw new Error(`mesh no longer exist`)
    }
    
    const { mesh, shaders } = colormap
    const { updateVertex, updateFrag, getUniforms } = shaders || {}
    
    const material = this.defaultMaterial.clone()
    
    material.onBeforeCompile = function(shader) {
      if (getUniforms) {
        shader.uniforms = {
          ...shader.uniforms,
          ...getUniforms()
        }
      }
      shader.vertexShader = updateVertex(shader.vertexShader)
      shader.fragmentShader = updateFrag(shader.fragmentShader)
      material.userData.shader = shader
    }
    const newMesh = new THREE.Mesh( geometry, material )
    this.origin.add(
      newMesh
    )
    this.customColormap.set(geometry, {
      ...colormap,
      mesh: newMesh
    })
  }

  applyColorMap(geometry: THREE.Geometry, idxMap?: number[], colormapOption?: IThreeColorMapOptions) {
    if (!geometry) {
      throw new Error(`geometry needs to be defined to apply color map`)
    }
    const colormap = this.customColormap.get(geometry)

    const { shaders, ...rest } = colormap || { mesh: null } as TWeakmap
    if (!idxMap) {
      this.customColormap.set(geometry, { ...rest })
    } else {

      const { custom, usePreset } = colormapOption || {}
      if (custom) {
        const shaders = getVertexFragCustom(custom)
        geometry.setAttribute(ATTR_IDX, new THREE.Float32BufferAttribute(idxMap, 1))
        this.customColormap.set(geometry, {
          ...rest,
          shaders,
          idxMap
        })
      } else {
        const { min, max } = idxMap.reduce<{ min: number, max: number}>((acc, curr) => {
          const returnObj = { ...acc }
          if (acc.min === null || curr < acc.min) returnObj.min = curr
          if (acc.max === null || curr > acc.max) returnObj.max = curr
          return returnObj
        }, { min: null, max: null })
        
        const uuid = getUuid()
        const shaders = getVertexFrag({
          type: usePreset || EnumColorMapName.MAGMA,
          id: uuid
        })
        geometry.setAttribute(`${ATTR_INTENSITY}`, new THREE.Float32BufferAttribute(idxMap.map(v => v / max), 1))
        this.customColormap.set(geometry, {
          ...rest,
          shaders,
          idxMap
        })
      }
    }
    
    this.redraw(geometry)
  }

  async loadColormap(url: string) {
    
    const l = new UrlLoader({ useCache: this.options?.useCache })
    const str = await l.load(url)
    const arr = parseGiiColorIdx(str)
    
    return arr
  }

  private aniRef: number
  private animatable: IAnimatable[] = []

  private ambience: Ambience

  constructor(el: HTMLElement, options?: IThreeSurferOptions){
    this.el = el
    if (options) this.options = options

    this.setup()
    this.setSize()
    this.animatable.push(this)

    this.ambience = new Ambience(this.origin)
    this.animatable.push(this.ambience)

    // setup highlight face lines
    if (this.options.highlightHovered) {
      const lineBufferGeom = new THREE.BufferGeometry()
      lineBufferGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3*4), 3))
      const lineBufferMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true
      })
      this.highlightLine = new THREE.Line(lineBufferGeom, lineBufferMaterial)
      this.origin.add(this.highlightLine)
    }

    this.setupAnimation()
  }

  setupAnimation() {
    this.aniRef = requestAnimationFrame(() => {
      this.setupAnimation()
    })
    for (const a of this.animatable) {
      a.animate()
    }
  }

  animate() {
    this.control.update()
    this.renderer.render(this.scene, this.camera)
    for (const h of this.animateHook) {
      h()
    }
    
  }

  setup() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1e3)
    
    this.camera.position.set(200, 0, 20)
    // by default, camera.up is to positive x axis ... I think
    this.camera.up = new THREE.Vector3(0, 0, 1)
    this.renderer = new THREE.WebGLRenderer()

    // add origin
    this.origin = new THREE.Object3D()
    this.scene.add(this.origin)

    // add wire
    this.gridHelper = new THREE.GridHelper(512, 16)
    this.gridHelper.rotateX(Math.PI / 2)
    this.gridHelper.position.z = -100
    this.origin.add(this.gridHelper)

    // ray caster
    this.raycaster = new THREE.Raycaster()
    const mousemoveListener = ((ev: MouseEvent) => {
      this.mouse ||= new THREE.Vector2()
      this.mouse.x = ( ev.clientX / window.innerWidth ) * 2 - 1
      this.mouse.y = - ( ev.clientY / window.innerHeight ) * 2 + 1
      this.raycaster.setFromCamera( this.mouse, this.camera );
      const intersects = this.raycaster.intersectObjects(this.scene.children, true)
      let firstIntersect = intersects &&
        intersects.filter(intersect => 
          intersect.object !== this.gridHelper &&
          intersect.object !== this.highlightLine
        )[0]
      
      // dispatch event
      let detail: IThreeSurferMouseEvent
      if (firstIntersect) {
        const faceIndex = firstIntersect.faceIndex
        const bufferGeomVertexIndices = firstIntersect.object.geometry.index.array.slice(faceIndex * 3, (faceIndex +1) * 3)
        
        detail = {
          mesh: {
            faceIndex,
            verticesIdicies: Array.from(bufferGeomVertexIndices) as number[],
            geometry: firstIntersect.object?.geometry
          },
          mouse: ev,
        }
        if (this.customColormap) {
          const obj = this.customColormap.get(firstIntersect.object?.geometry)
          if (!!(obj?.idxMap)) {
            detail.colormap = {
              verticesValue: (Array.from(bufferGeomVertexIndices) as number[]).map(idx => obj.idxMap[idx])
            }
          }
        }
      } else {
        detail = {
          mesh: null,
          mouse: ev
        }
      }
      this.el.dispatchEvent(new CustomEvent(ThreeSurfer.CUSTOM_EVENTNAME, {
        detail
      }))

      // setup highlight, if set
      if (this.options.highlightHovered) {
        if (firstIntersect) {
          const meshInteracted = firstIntersect.object

          const faceIndex = firstIntersect.faceIndex

					const linePosition = this.highlightLine.geometry.attributes.position
					const meshPosition = meshInteracted.geometry.attributes.position
          
          const bufferGeomVertexIndices = firstIntersect.object.geometry.index.array.slice(faceIndex * 3, (faceIndex +1) * 3)
          
          linePosition.copyAt( 0, meshPosition, bufferGeomVertexIndices[0] )
					linePosition.copyAt( 1, meshPosition, bufferGeomVertexIndices[1] )
					linePosition.copyAt( 2, meshPosition, bufferGeomVertexIndices[2] )
					linePosition.copyAt( 3, meshPosition, bufferGeomVertexIndices[0] )
          
          // debugger
          // console.log([
          //   face.a,
          //   face.b,
          //   face.c,
          //   linePosition.array.slice(0,3),
          //   linePosition.array.slice(3,6),
          //   linePosition.array.slice(6,9),
          //   linePosition.array.slice(9),
          // ].join('\n')
          // )
          
          if (LINE_ZFIGHTING_MULTIPLE !== 0) {
            const face = firstIntersect.face
            const normalM = new THREE.Matrix4()
            normalM.setPosition(
              face.normal.multiplyScalar(LINE_ZFIGHTING_MULTIPLE)
            )
            linePosition.applyMatrix4(normalM)
          }
          meshInteracted.updateMatrix()
					this.highlightLine.geometry.applyMatrix4( meshInteracted.matrix )
          this.highlightLine.visible = true
        } else {
          this.highlightLine.visible = false
        }
      }
    }).bind(this)
    this.el.addEventListener('mousemove', mousemoveListener)
    this.disposeCb.push(
      () => this.el.removeEventListener('mousemove', mousemoveListener)
    )

    // on window resize
    const resizeListener = (this.setSize).bind(this)
    window.addEventListener('resize', resizeListener)
    this.disposeCb.push(
      () => window.removeEventListener('resize', resizeListener)
    )

    this.control = new OrbitControls(this.camera, this.renderer.domElement)
    this.el.appendChild(this.renderer.domElement)
  }

  setSize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize( window.innerWidth, window.innerHeight )
  }

  private disposeCb: (() => void)[] = []

  dispose(){
    if (this.aniRef) {
      cancelAnimationFrame(this.aniRef)
    }
    while (this.disposeCb.length > 0) this.disposeCb.pop()()
    this.el.removeChild(this.renderer.domElement)
  }
}
