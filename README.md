# Three-Surfer

Three wrapper for freesurfer gifti files

## Usage

```js

  (async () => {

    const el = document.getElementById('container')
    const ts = new ThreeSurfer(el, {highlightHovered: true})
    const m1 = await ts.loadMesh('http://localhost:2222/lh.gii')
    const m2 = await ts.loadMesh('http://localhost:2222/rh.gii')
    const c1 = await ts.loadColormap('http://localhost:2222/lh_colormap.gii')
    const c2 = await ts.loadColormap('http://localhost:2222/rh_colormap.gii')
    
    // all DataArray with Intent="NIFTI_INTENT_SHAPE" will be extracted.
    // use the first one
    // in principle, one should check if the length > 0
    const colorIdx1 = c1[0].getData()
    const colorIdx2 = c2[0].getData()
    ts.applyColorMap(m1, colorIdx1)
    ts.applyColorMap(m2, colorIdx2)
    
    el.addEventListener(ThreeSurfer.CUSTOM_EVENTNAME, (ev) => {
      console.log('ev listener', ev.detail.colormap?.verticesValue)
    })
  })()
```

## License

MIT