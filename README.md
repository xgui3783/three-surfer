# Three-Surfer

Three wrapper for freesurfer gifti files

## Usage

```js

  (async () => {

    const el = document.getElementById('container')
    const ts = new ThreeSurfer(el, {highlightHovered: true})
    const m1 = await ts.loadMesh('http://localhost:10001/res/fsaverage/fsaverage6/lh.pial.gii')
    const m2 = await ts.loadMesh('http://localhost:10001/res/fsaverage/fsaverage6/rh.pial.gii')
    const c1 = await ts.loadColormap('http://localhost:10001/res/julichbrain_labels/lh.JulichBrain_MPMAtlas_l_N10_nlin2Stdicbm152asym2009c_publicDOI_83fb39b2811305777db0eb80a0fc8b53.BV_MNI152_orig_to_fsaverage6.gii')
    const c2 = await ts.loadColormap('http://localhost:10001/res/julichbrain_labels/rh.JulichBrain_MPMAtlas_r_N10_nlin2Stdicbm152asym2009c_publicDOI_172e93a5bec140c111ac862268f0d046.BV_MNI152_orig_to_fsaverage6.gii')
    const colorIdx1 = c1[0].getData()
    const colorIdx2 = c2[0].getData()

    const leftarr = await (async () => {
      const res = await fetch(`http://localhost:10001/leftarr.json`)
      return res.json()
    })()

    const lhCM = new Map()
    // console.log(leftarr)
    for (const entry of leftarr) {
      const { name, grayvalue, iav } = entry
      const { rgb } = iav || { rgb: [200, 200, 200] }
      // filter out aux mesh
      lhCM.set(
        Number(grayvalue),
        rgb.map(v => v/255)
      )
    }

    ts.applyColorMap(m1, colorIdx1, { custom: lhCM })

    const rightarr = await (async () => {
      const res = await fetch(`http://localhost:10001/rightarr.json`)
      return res.json()
    })()

    const rhCM = new Map()
    // console.log(rhColorMap)
    for (const entry of rightarr) {
      const { name, grayvalue, iav } = entry
      const { rgb } = iav || { rgb: [200, 200, 200] }
      // filter out aux mesh
      rhCM.set(
        Number(grayvalue),
        rgb.map(v => v/255)
      )
    }

    ts.applyColorMap(m2, colorIdx2, { custom: rhCM })
    
    el.addEventListener(ThreeSurfer.CUSTOM_EVENTNAME, (ev) => {
      const detail = ev.detail
      if (detail.mesh) {
        // console.log('ev listener', ev.detail.colormap?.verticesValue)
      }
    })
    window.obj = {
      ts,
      m1,
      m2,
    }
  })()
```

## Known bug

- `applyColorMap` will apply vertex indices correctly, but will overwrite colormaps

## License

MIT