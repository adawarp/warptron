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
const constantsData = require('./constants')
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

const { Board } = require('johnny-five')
const servoController = require('./src2/servoController')
const board = new Board({ port: ARDUINO_PATH, repl: false })

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
    servoController(board, topic, message)
  })
})
