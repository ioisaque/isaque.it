/* Mount auto-rotating / shuffling ERNO cube into a portfolio stage. */
window.IsaqueCube = window.IsaqueCube || {}

/* Visual cubelet scale (px). Stage can be larger for easier dragging. */
var CUBELET_SIZE = 93

function applyCubeSize(cube, stage) {
  if (!cube) return
  var w = (stage && stage.clientWidth) || 352
  var h = (stage && stage.clientHeight) || 352
  // Viewport = full stage (bigger drag target / orbit padding)
  cube.setSize(w, h)
  cube.domElement.style.width = w + 'px'
  cube.domElement.style.height = h + 'px'
  // Keep the drawn cube at the old visual size
  cube.cubeletSize = CUBELET_SIZE
  cube.size = CUBELET_SIZE * 3
  cube.domElement.style.fontSize = CUBELET_SIZE + 'px'
  cube.camera.aspect = w / h
  cube.camera.position.z = Math.max(w, h) * 3.4
  cube.camera.fov = 25
  cube.camera.updateProjectionMatrix()
}

function stripLogo(cube) {
  if (!cube || !cube.domElement) return
  cube.domElement.querySelectorAll('.stickerLogo').forEach(function (el) {
    el.classList.remove('stickerLogo')
  })
}

function tuneInteraction(cube) {
  if (!cube) return
  // Face-slice drag — default ~1.3 is sluggish
  if (cube.mouseInteraction) cube.mouseInteraction.dragSpeed = 6.5
  // Whole-cube orbit — default 4 feels stuck (internal * 0.001 scale)
  if (cube.controls) {
    cube.controls.rotationSpeed = 48
    cube.controls.damping = 0.12
  }
}

window.IsaqueCube.mountSolver = function (container, options) {
  if (!container || typeof ERNO === 'undefined') return null
  options = options || {}

  if (window.cube && window.cube.domElement) {
    container.innerHTML = ''
    container.appendChild(window.cube.domElement)
    container.dataset.cubeMounted = '1'
    container._ernoCube = window.cube
    applyCubeSize(window.cube, container)
    stripLogo(window.cube)
    tuneInteraction(window.cube)
    window.cube.autoRotate = true
    window.cube.isShuffling = true
    window.cube.mouseControlsEnabled = true
    return window.cube
  }

  if (container.dataset.cubeMounted === '1') return container._ernoCube || null

  var twistDuration = options.twistDuration || 900

  var cube = new ERNO.Cube({
    textureSize: CUBELET_SIZE,
    twistDuration: twistDuration,
    autoRotate: true,
    mouseControlsEnabled: true,
    keyboardControlsEnabled: false,
  })

  cube.position.y = 0
  cube.rotation.set((20).degreesToRadians(), (-30).degreesToRadians(), 0)
  cube.isReady = true
  cube.autoRotate = true
  cube.isShuffling = true
  cube.twistDuration = twistDuration
  cube.rotationDelta.set(
    (0.02 * Math.PI) / 180,
    (0.035 * Math.PI) / 180,
    0,
  )

  container.innerHTML = ''
  container.appendChild(cube.domElement)
  applyCubeSize(cube, container)
  stripLogo(cube)
  tuneInteraction(cube)

  function onResize() {
    var stage = document.getElementById('rubik-stage')
    if (window.cube) applyCubeSize(window.cube, stage || container)
  }

  window.addEventListener('resize', onResize)

  container.dataset.cubeMounted = '1'
  container._ernoCube = cube
  window.cube = cube
  return cube
}
