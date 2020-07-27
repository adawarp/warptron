const { Servo, Motor } = require('johnny-five')

module.exports = function () {
  this.neckPitch = new Servo({
    controller: 'PCA9685',
    pin: 0,
    pwmRange: [560, 2480],
    range: [65, 100],
    degreeRange: [-150, 150]
  })

  this.neckYaw = new Servo({
    controller: 'PCA9685',
    pin: 1,
    pwmRange: [560, 2480],
    range: [15, 120],
    degreeRange: [-150, 150]
  })

  this.leftArmPitch = new Servo({
    controller: 'PCA9685',
    pin: 2,
    pwmRange: [560, 2480],
    range: [20, 100],
    degreeRange: [-150, 150]
  })

  this.leftArmYaw = new Servo({
    controller: 'PCA9685',
    pin: 3,
    pwmRange: [560, 2480],
    range: [30, 80],
    degreeRange: [-150, 150]
  })

  this.rightArmPitch = new Servo({
    controller: 'PCA9685',
    pin: 4,
    pwmRange: [560, 2480],
    range: [60, 140],
    degreeRange: [-150, 150]
  })

  this.rightArmYaw = new Servo({
    controller: 'PCA9685',
    pin: 5,
    pwmRange: [560, 2480],
    range: [80, 130],
    degreeRange: [-150, 150]
  })

  this.leftMotor = new Motor({
    pin: 6,
    controller: 'PCA9685'
  })
  this.rightMotor = new Motor({
    pin: 7,
    controller: 'PCA9685'
  })
}
