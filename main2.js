const mqtt = require('mqtt')
const mqttClient = mqtt.connect('mqtt://160.16.238.254')

const WebSocket = require('ws')
if (typeof window === 'undefined') {
  global.window = {}
  global.document = {}
  global.document = { addEventListener: () => null }
  global.WebSocket = WebSocket
}

const signRoid = require('./src2/signIn.js')
const constantsData = require('./constants')
const { key } = constantsData
const { email } = key

const actionCableState = require('./src2/channels')

const ARDUINO_PATH = '/dev/ttyS0'
const ARDUINO_PATH_FOR_DEV = '/dev/tty.usbmodem141101'

const { Board } = require('johnny-five')
const board = new Board({ port: ARDUINO_PATH_FOR_DEV, repl: false })

const servoController = require('./src2/servoController')

const TB6612_AIN1 = 0
const TB6612_AIN2 = 1
const TB6612_BIN1 = 2
const TB6612_BIN2 = 3
const TB6612_STBY = 8

const pinMode = () => {
  board.pinMode(TB6612_AIN1, board.MODES.OUTPUT)
  board.pinMode(TB6612_AIN2, board.MODES.OUTPUT)
  board.pinMode(TB6612_BIN1, board.MODES.OUTPUT)
  board.pinMode(TB6612_BIN2, board.MODES.OUTPUT)
  board.pinMode(TB6612_STBY, board.MODES.OUTPUT)
  board.digitalWrite(TB6612_STBY, 1)
}


const logger = (state) => {
  console.warn(state)
}

const machine = {
  state: 'init',
  dispatch(actionName, ...payload) {
    logger('****', actionName, ...payload)
    const actions = this.transitions[this.state];
    const action = actions[actionName]
    logger(`actions: ${actions}`)
    if (action) {
      logger(`action dispatched: ${ actionName }`);
      action.apply(machine, payload);
    }
  },
  changeState(newState) {
    logger(`state changed: ${newState}`)
    this.state = newState
  },
  transitions: {
    'init': {
      signIn: function () {

  
        signRoid.loginRoid().then(res => {
          // this.changeState('connectChannel')
          // this.dispatch('connectedChannel', res)
          this.changeState('connectMqtt')
          this.dispatch('connectedMqtt')
        }).catch(err => {
          logger(err)
          this.changeState('error')
          this.dispatch('failed')
        })
      },
    },
    'connectChannel': {
      connectedChannel: function(data) {
        logger(data)
        actionCableState.dispatch('createConsumer', data)
        this.dispatch('connectedMqtt')
      }
    },
    'connectMqtt': {
      connectedMqtt: function() {
        mqttClient.on('connect', () => {
          logger('mqtt connected ++')
          this.changeState('boardOpen')
          this.dispatch('boardReady')
        })
      }
    },
  
    'boardOpen': {
      boardReady: function() {
        board.on('ready', () => {
          logger('board is ready')
          this.changeState('subscribeTopic')
          pinMode()
          this.dispatch('mqttSubscribed')
        })
      }
    },
  
    'subscribeTopic': {
      mqttSubscribed: function() {
        this.changeState('receiveMqttMessage')
        mqttClient.subscribe(email,logger)
        mqttClient.subscribe(`${email}/command`,logger)
        this.dispatch('mqttMessage')
      }
    },
  
    'receiveMqttMessage': {
      mqttMessage: function() {
        logger('message ++++=   _')
  
        // this.changeState('init')
        mqttClient.on('message', function (topic, message) {
          logger(message)
  
          servoController(board, topic, message)
        })
      }
    },
    'error': {
      failed: function () {
        this.changeState('init')
      }
    }
  }
}

logger(`initial state: ${machine.state}`)
machine.dispatch('signIn')

