const { Servo } = require('johnny-five')

module.exports = function () {
  this.neckPitch = new Servo({
    controller: 'PCA9685',
    pin: 0,
    pwmRange: [560, 2480],
    range: [80, 100]
  })

  this.neckYaw = new Servo({
    controller: 'PCA9685',
    pin: 1,
    pwmRange: [560, 2480],
    range: [70, 100],
    degreeRange: [-150, 150]
  })

  this.leftArmPitch = new Servo({
    controller: 'PCA9685',
    pin: 2,
    pwmRange: [560, 2480],
    range: [0, 300]
  })

  this.leftArmYaw = new Servo({
    controller: 'PCA9685',
    pin: 3,
    pwmRange: [560, 2480],
    range: [-150, 150],
    degreeRange: [-150, 150]
  })

  this.rightArmPitch = new Servo({
    controller: 'PCA9685',
    pin: 4,
    pwmRange: [560, 2480],
    range: [0, 300]
  })

  this.rightArmYaw = new Servo({
    controller: 'PCA9685',
    pin: 5,
    pwmRange: [560, 2480],
    range: [-150, 150],
    degreeRange: [-150, 150]
  })
}
