const constantsData = require('../constants')
const { key } = constantsData
const { email } = key

const { Fn } = require('johnny-five')
const servoType = require('./servoType')

const bodyServo = new servoType()
const cal = (x) => Fn.map(x, 0, 320, 0, 288)

const TB6612_AIN1 = 0
const TB6612_AIN2 = 1
const TB6612_BIN1 = 2
const TB6612_BIN2 = 3
const TB6612_STBY = 8

module.exports = {
  readyBoard: function (board) {
    board.on('ready', () => {
      board.pinMode(TB6612_AIN1, board.MODES.OUTPUT)
      board.pinMode(TB6612_AIN2, board.MODES.OUTPUT)
      board.pinMode(TB6612_BIN1, board.MODES.OUTPUT)
      board.pinMode(TB6612_BIN2, board.MODES.OUTPUT)
      board.pinMode(TB6612_STBY, board.MODES.OUTPUT)
      board.digitalWrite(TB6612_STBY, 1)

      bodyServo.neckPitch.to(cal(90))
      bodyServo.neckYaw.to(cal(90))
      bodyServo.leftArmPitch.to(cal(90))
      bodyServo.leftArmYaw.to(cal(90))
      bodyServo.rightArmPitch.to(cal(90))
      bodyServo.rightArmYaw.to(cal(90))
    })
  },

  controlServo: function (board, topic, message) {
    if (topic === `${email}/command`) {
      bodyServo.neckPitch.to(cal(message[3]))
      bodyServo.neckYaw.to(cal(message[4]))
      bodyServo.leftArmPitch.to(cal(message[5]))
      bodyServo.leftArmYaw.to(cal(message[6]))
      bodyServo.rightArmPitch.to(cal(message[7]))
      bodyServo.rightArmYaw.to(cal(message[8]))

      if (message[9] === 50 && message[10] === 50) {
        bodyServo.leftMotor.stop()
        bodyServo.rightMotor.stop()
      }
      if (message[9] === 100 && message[10] === 100) {
        board.digitalWrite(TB6612_AIN1, 1)
        board.digitalWrite(TB6612_AIN2, 0)
        bodyServo.leftMotor.speed(150)

        board.digitalWrite(TB6612_BIN1, 0)
        board.digitalWrite(TB6612_BIN2, 1)
        bodyServo.rightMotor.speed(150)
      }
      if (message[9] === 0 && message[10] === 0) {
        board.digitalWrite(TB6612_AIN1, 0)
        board.digitalWrite(TB6612_AIN2, 1)
        bodyServo.leftMotor.speed(150)

        board.digitalWrite(TB6612_BIN1, 1)
        board.digitalWrite(TB6612_BIN2, 0)
        bodyServo.rightMotor.speed(150)
      }

      if (message[9] === 0 && message[10] === 100) {
        board.digitalWrite(TB6612_AIN1, 0)
        board.digitalWrite(TB6612_AIN2, 1)
        bodyServo.leftMotor.speed(150)

        board.digitalWrite(TB6612_BIN1, 0)
        board.digitalWrite(TB6612_BIN2, 1)
        bodyServo.rightMotor.speed(150)
      }

      if (message[9] === 100 && message[10] === 0) {
        board.digitalWrite(TB6612_AIN1, 1)
        board.digitalWrite(TB6612_AIN2, 0)
        bodyServo.leftMotor.speed(150)

        board.digitalWrite(TB6612_BIN1, 1)
        board.digitalWrite(TB6612_BIN2, 0)
        bodyServo.rightMotor.speed(150)
      }
    }
  }
}
