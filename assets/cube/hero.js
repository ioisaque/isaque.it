/* Six-face CSS photo cube for the hero (no cubelets). Drag to rotate. */
window.IsaqueCube = window.IsaqueCube || {}

window.IsaqueCube.mountHero = function (container, options) {
  if (!container || container.dataset.heroCubeMounted === '1') return

  options = options || {}
  var photo = options.photo || 'assets/img/profile.avif'
  // Brand cube.svg: top coral, viewer-left green, viewer-right yellow.
  // Idle pose (~rotateY -38) shows up + front + right.
  var faces = options.faces || {
    up: '#FF5356',
    down: '#FFFFFF',
    front: '#33CC66',
    back: '#FFD000',
    left: '#FFD000',
    right: '#FFD000',
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
    // Photo on green (front); loading label on yellow (right) during boot.
    if (name === 'front') {
      var img = document.createElement('img')
      img.className = 'hero__cube-face-photo'
      img.src = photo
      img.alt = ''
      img.draggable = false
      face.appendChild(img)
    }
    if (name === 'right') {
      var label = document.createElement('span')
      label.className = 'hero__cube-face-loading'
      label.textContent = 'Loading'
      label.setAttribute('aria-hidden', 'true')
      face.appendChild(label)
    }
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

  // Logo-like isometric (top / green / yellow) — barely alive, never full spin.
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var HOME_X = -22
  var HOME_Y = -38
  var AMP_X = 2.4
  var AMP_Y = 4.5
  var BREATHE_MS = 7200
  var RETURN_SPEED = 3.2
  var DRAG_MAX_X = 12
  var DRAG_MAX_Y = 14
  var rotX = HOME_X
  var rotY = HOME_Y
  var dragging = false
  var lastX = 0
  var lastY = 0
  var DRAG_FACTOR = 0.28
  var startTime = null
  var lastTime = null

  function render() {
    inner.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)'
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v
  }

  function tick(now) {
    if (startTime === null) startTime = now
    if (lastTime === null) lastTime = now
    var dt = Math.min(0.05, (now - lastTime) / 1000)
    lastTime = now
    var t = (now - startTime) / BREATHE_MS

    if (!dragging) {
      var targetX = HOME_X
      var targetY = HOME_Y
      if (!reduceMotion) {
        var wave = Math.sin(t * Math.PI * 2)
        var wave2 = Math.sin(t * Math.PI * 2 * 0.73 + 1.1)
        targetX = HOME_X + wave2 * AMP_X
        targetY = HOME_Y + wave * AMP_Y
      }
      var ease = Math.min(1, RETURN_SPEED * dt)
      rotX += (targetX - rotX) * ease
      rotY += (targetY - rotY) * ease
      render()
    }

    requestAnimationFrame(tick)
  }

  container.addEventListener('pointerdown', function (e) {
    dragging = true
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
    rotY = clamp(rotY + dx * DRAG_FACTOR, HOME_Y - DRAG_MAX_Y, HOME_Y + DRAG_MAX_Y)
    rotX = clamp(rotX - dy * DRAG_FACTOR, HOME_X - DRAG_MAX_X, HOME_X + DRAG_MAX_X)
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
