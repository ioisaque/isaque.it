/* Slim ERNO patches for portfolio embed (from cubo/assets/scripts/patches.js) */
;(function () {
  if (typeof ERNO === 'undefined') return

  ERNO.Cube.prototype.opacityTweenDuration = 200
  ERNO.Cube.prototype.radiusTweenDuration = 100
  ERNO.Cube.prototype.twistDuration = 900

  // Disable robot gateway POSTs from the customized cuber build.
  ERNO.Cube.prototype.magicTwist = function () {}

  // Avoid stacking onTwistComplete listeners / robot state sync from customized twist().
  ERNO.Cube.prototype.twist = function (command) {
    if (this.undoing) this.twistQueue.empty()
    this.historyQueue.empty()
    this.undoing = false
    this.twistQueue.add(command)
  }

  ERNO.Cube.prototype.shuffle = function () {
    var possibleMoves = this.shuffleMethod
    if (this.twistQueue.history.length) {
      possibleMoves = possibleMoves.replace(
        this.twistQueue.history[this.twistQueue.history.length - 1].getInverse().command,
        '',
      )
    }
    this.twist(possibleMoves.split('').rand())
  }

  ERNO.Cube.prototype.showLogo = function () {
    var center = this.centers.hasColor(ERNO.RED).cubelets[0]
    if (!center) return this
    center.faces.forEach(function (face) {
      if (face.color === ERNO.RED) {
        var sticker = face.element.querySelector('.sticker')
        if (sticker) sticker.classList.add('stickerLogo')
      }
    })
    return this
  }

  ERNO.Cube.prototype.hideLogo = function () {
    var e = this.domElement.querySelector('.stickerLogo')
    if (e) e.classList.remove('stickerLogo')
    return this
  }

  // Undo history until solved (portfolio "Solve" — no robot / cubejs worker).
  ERNO.Cube.prototype.solve = function () {
    var that = this
    this.isShuffling = false
    this.autoRotate = false
    this.taskQueue.add(function () {
      that.twistQueue.future = []
      that.twistDuration = 80
    })
    var n = that.twistQueue.history.length
    while (n--) {
      ;(function () {
        var wasOk = false
        that.taskQueue.add(
          function () {
            if (that.twistQueue.history.length) {
              var move = that.twistQueue.history.pop()
              that.twistQueue.future = []
              that.twistQueue.add(move.getInverse())
              wasOk = true
            }
          },
          function () {
            if (wasOk) that.twistQueue.history.pop()
          },
        )
      })()
    }
    that.taskQueue.add(function () {
      that.twistDuration = 250
    })
    return this
  }

  ERNO.Cube.prototype.loop = (function () {
    var time = 0
    return function () {
      requestAnimationFrame(this.loop)

      var localTime =
        typeof window !== 'undefined' &&
        window.performance !== undefined &&
        window.performance.now !== undefined
          ? window.performance.now()
          : Date.now()
      var frameDelta = localTime - (time || localTime)

      time = localTime
      if (!this.paused) {
        this.time += frameDelta
        TWEEN.update(this.time)

        if (this.autoRotate) {
          this.rotation.x += this.rotationDelta.x * 3
          this.rotation.y += this.rotationDelta.y * 2
          this.rotation.z += this.rotationDelta.z * 1.5
        }

        if (this.isReady && this.isTweening() === 0) {
          var queue = this.undoing ? this.historyQueue : this.twistQueue

          if (queue.future.length === 0) {
            if (this.isShuffling) this.shuffle()

            if (this.isSolving && window.solver) {
              this.isSolving = window.solver.consider(this)
            } else if (this.taskQueue.isReady === true) {
              var task = this.taskQueue.do()
              if (task instanceof Function) task()
            }
          } else {
            var twist = queue.do()
            if (
              twist.command.toLowerCase() !== 'x' &&
              twist.command.toLowerCase() !== 'y' &&
              twist.command.toLowerCase() !== 'z' &&
              twist.degrees !== 0
            ) {
              this.moveCounter += this.undoing ? -1 : 1
            }
            if (twist.degrees === 0 || twist.isShuffle) queue.purge(twist)
            this.immediateTwist(twist)
          }
        }

        this.mouseInteraction.enabled = this.mouseControlsEnabled && !this.finalShuffle
        this.mouseInteraction.update()
        this.controls.enabled = this.mouseControlsEnabled && !this.mouseInteraction.active
        this.controls.update()
      }
    }
  })()
})()
