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
const runExecCommand = require('./src2/execCommand')
const constantsData = require('./constants')
const { execMomoCommand, key } = constantsData
const { email } = key

const actionCableState = require('./src2/channels')

// runExecCommand('start-momo', execMomoCommand)

const ARDUINO_PATH = '/dev/ttyS0'
const ARDUINO_PATH_FOR_DEV = '/dev/tty.usbmodem141101'

const { Board, Servo } = require('johnny-five')
// const servoController = require('./src2/servoController')
const board = new Board({ port: ARDUINO_PATH_FOR_DEV, repl: false })

const TB6612_AIN1 = 0


const bodyServo = new Servo({
  controller: 'PCA9685',
  pin: 0,
  pwmRange: [560, 2480],
  range: [65, 100],
  degreeRange: [-150, 150]
})


const logger = (state) => {
  console.warn(state)
}

const machine = {
  state: 'init',
  dispatch(actionName, ...payload) {
    console.warn('****', actionName, ...payload)
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
        signRoid.loginRoid()
        this.changeState('connectCable')
        this.dispatch('connectedCable')
      }
    },
    'connectCable': {
      connectedCable: function () {
        actionCableState.dispatch('createConsumer')
        this.changeState('connectMqtt')
        this.dispatch('connectedMqtt')
      }
    },
    
    'connectMqtt': {
      connectedMqtt: function() {
        mqttClient.on('connect', () => {
          console.warn('mqtt connected')
          this.changeState('boardOpen')
          this.dispatch('boardReady')
        })
      }
    },
  
    'boardOpen': {
      boardReady: function() {
        board.on('ready', () => {
          console.warn('board is ready')
          this.changeState('subscribeTopic')
          board.pinMode(TB6612_AIN1, board.MODES.OUTPUT)
          bodyServo.to(90)
          this.dispatch('mqttSubscribed')
        })
      }
    },
  
    'subscribeTopic': {
      mqttSubscribed: function() {
        mqttClient.subscribe(email,logger)
      }
    },
    
    'signOut': {
      logOut: function () {
        console.warn('__cred', cred)
        this.changeState('init')
      }
    }
  }
}

logger(`initial state: ${machine.state}`)
machine.dispatch('signIn')


// setTimeout(() => {
//   machine.dispatch('logOut')
//   console.warn('Log out')
// }, 4000)



//
// mqttClient.on('connect', function () {
//
//   mqttClient.subscribe(email, function (err) {
//     console.warn('error 2', err)
//   })
//
//   mqttClient.subscribe(`${email}-restart-momo`, function (err) {
//     console.warn(err)
//   })
//
//   mqttClient.subscribe(`${email}/command`, function (err) {
//     console.warn(err)
//   })
// })
//

//
// const TB6612_AIN1 = 0
// const TB6612_AIN2 = 1
// const TB6612_BIN1 = 2
// const TB6612_BIN2 = 3
// const TB6612_STBY = 8
//
// board.on('ready', () => {
//   board.pinMode(TB6612_AIN1, board.MODES.OUTPUT)
//   board.pinMode(TB6612_AIN2, board.MODES.OUTPUT)
//   board.pinMode(TB6612_BIN1, board.MODES.OUTPUT)
//   board.pinMode(TB6612_BIN2, board.MODES.OUTPUT)
//   board.pinMode(TB6612_STBY, board.MODES.OUTPUT)
//   board.digitalWrite(TB6612_STBY, 1)
//
//   mqttClient.on('message', function (topic, message) {
//     servoController(board, topic, message)
//   })
// })
