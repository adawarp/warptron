const mqtt = require('mqtt')
const mqttClient = mqtt.connect('mqtt://160.16.238.254')

const WebSocket = require('ws')
if (typeof window === 'undefined') {
  global.window = {}
  global.document = {}
  global.document = { addEventListener: () => null }
  global.WebSocket = WebSocket
}

const signIn = require('./src2/signIn.js')
const runExecCommand = require('./src2/execCommand')
const constantsData = require('./src2/constants')
const { execMomoCommand, key } = constantsData
const { email } = key

runExecCommand('start-momo', execMomoCommand)

const ARDUINO_PATH = '/dev/ttyS0'

mqttClient.on('connect', function () {
  signIn.loginRoid(key)

  mqttClient.subscribe(email, function (err) {
    console.warn('error 2', err)
  })

  mqttClient.subscribe(`${email}-restart-momo`, function (err) {
    console.warn(err)
  })

  mqttClient.subscribe(`${email}/command`, function (err) {
    console.warn(err)
  })
})

const { Board, Fn } = require('johnny-five')
const servoType = require('./src/servoType')

const board = new Board({ port: ARDUINO_PATH, repl: false })

const bodyServo = new servoType()
const cal = (x) => Fn.map(x, 0, 320, 0, 288)

const TB6612_AIN1 = 0
const TB6612_AIN2 = 1
const TB6612_BIN1 = 2
const TB6612_BIN2 = 3
const TB6612_STBY = 8

board.on('ready', () => {
  board.pinMode(TB6612_AIN1, board.MODES.OUTPUT)
  board.pinMode(TB6612_AIN2, board.MODES.OUTPUT)
  board.pinMode(TB6612_BIN1, board.MODES.OUTPUT)
  board.pinMode(TB6612_BIN2, board.MODES.OUTPUT)
  board.pinMode(TB6612_STBY, board.MODES.OUTPUT)
  board.digitalWrite(TB6612_STBY, 1)

  mqttClient.on('message', function (topic, message) {
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

      if (message[9] === 100 && message[10] === 0) {
        board.digitalWrite(TB6612_AIN1, 0)
        board.digitalWrite(TB6612_AIN2, 1)
        bodyServo.leftMotor.speed(150)

        board.digitalWrite(TB6612_BIN1, 0)
        board.digitalWrite(TB6612_BIN2, 1)
        bodyServo.rightMotor.speed(150)
      }

      if (message[9] === 0 && message[10] === 100) {
        board.digitalWrite(TB6612_AIN1, 1)
        board.digitalWrite(TB6612_AIN2, 0)
        bodyServo.leftMotor.speed(150)

        board.digitalWrite(TB6612_BIN1, 1)
        board.digitalWrite(TB6612_BIN2, 0)
        bodyServo.rightMotor.speed(150)
      }
    }
  })
})
