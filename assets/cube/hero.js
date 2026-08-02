/* Six-face CSS photo cube for the hero (no cubelets). Drag to rotate. */
window.IsaqueCube = window.IsaqueCube || {}

window.IsaqueCube.mountHero = function (container, options) {
  if (!container || container.dataset.heroCubeMounted === '1') return

  options = options || {}
  var photo = options.photo || 'assets/img/profile/profile-alpha.png'
  // One transparent photo over the brand colors (cdn.isaque.it/id)
  var faces = options.faces || {
    up: '#FFD22B',
    down: '#FFFFFF',
    front: '#F72529',
    back: '#33CC66',
    left: '#0E34C7',
    right: '#EB681A',
  }

  var order = ['up', 'down', 'front', 'back', 'left', 'right']
  var scene = document.createElement('div')
  scene.className = 'hero__cube-scene'
  var inner = document.createElement('div')
  inner.className = 'hero__cube-inner'

  order.forEach(function (name) {
    var face = document.createElement('div')
    face.className = 'hero__cube-face hero__cube-face--' + name
    face.style.backgroundColor = faces[name]
    face.style.backgroundImage = 'url("' + photo + '")'
    inner.appendChild(face)
  })

  scene.appendChild(inner)
  container.appendChild(scene)

  function syncHalf() {
    var half = Math.round(inner.clientWidth / 2) + 'px'
    container.style.setProperty('--hero-cube-half', half)
  }

  syncHalf()
  window.addEventListener('resize', syncHalf)

  // Rotation is JS-driven so drag and auto-spin share one transform.
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var rotX = -18
  var rotY = -32
  var dragging = false
  var lastX = 0
  var lastY = 0
  var velocityY = 0
  var AUTO_SPIN = 12 // deg per second
  var DRAG_FACTOR = 0.45
  var lastTime = null

  function render() {
    inner.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)'
  }

  function tick(now) {
    if (lastTime === null) lastTime = now
    var dt = (now - lastTime) / 1000
    lastTime = now

    if (!dragging) {
      if (Math.abs(velocityY) > 1) {
        // Inertia from the last drag, easing back into the idle spin
        rotY += velocityY * dt
        velocityY *= 0.94
      } else if (!reduceMotion) {
        rotY += AUTO_SPIN * dt
      }
      render()
    }

    requestAnimationFrame(tick)
  }

  container.addEventListener('pointerdown', function (e) {
    dragging = true
    velocityY = 0
    lastX = e.clientX
    lastY = e.clientY
    container.classList.add('is-dragging')
    container.setPointerCapture(e.pointerId)
  })

  container.addEventListener('pointermove', function (e) {
    if (!dragging) return
    var dx = e.clientX - lastX
    var dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    rotY += dx * DRAG_FACTOR
    rotX -= dy * DRAG_FACTOR
    if (rotX > 80) rotX = 80
    if (rotX < -80) rotX = -80
    velocityY = dx * DRAG_FACTOR * 60
    render()
  })

  function endDrag() {
    dragging = false
    container.classList.remove('is-dragging')
  }

  container.addEventListener('pointerup', endDrag)
  container.addEventListener('pointercancel', endDrag)

  render()
  requestAnimationFrame(tick)

  container.dataset.heroCubeMounted = '1'
}
