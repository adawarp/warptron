const StateMachine = require('./StateMachine')
const singInRoid = require('./SignIn')
const MqttClient = require('./MqttClient')
const ChannelsConnection = require('./Channel')
const runExecCommand = require('./execCommand')

const constantsData = require('../constants')
const { execMomoCommand } = constantsData

const { Board } = require('johnny-five')

// /dev/ttyS0     rahroid board
// /dev/tty.usbmodem141101    for test
const ARDUINO_PATH = '/dev/ttyS0'
const board = new Board({ port: ARDUINO_PATH, repl: false })

const openBoard = require('./openBoard')
// open board in here
// because of signin setTimeout
// board.digitalWrite(TB6612_STBY, 1) not work correctly
openBoard.readyBoard(board)

const Events = {
  INIT: 'INIT',
  SIGNED_IN: 'SIGNED_IN',
  PREPARING: 'PREPARING',
  WAITING_OPERATOR: 'WAITING_OPERATOR',
  UNDER_CONTROL: 'UNDER_CONTROL',
  FAILED: 'FAILED'
}

class RoidStateMachine {
  constructor () {
    this.data = {
      cred: null,
      mqtt: null
    }

    this.machine = new StateMachine()
    this.machine.registerState(Events.INIT, [Events.SIGNED_IN, Events.FAILED])
    this.machine.registerState(Events.SIGNED_IN, [
      Events.PREPARING,
      Events.FAILED
    ])
    this.machine.registerState(Events.PREPARING, [
      Events.WAITING_OPERATOR,
      Events.FAILED
    ])
    this.machine.registerState(Events.WAITING_OPERATOR, [
      Events.UNDER_CONTROL,
      Events.FAILED
    ])
    this.machine.registerState(Events.UNDER_CONTROL, [
      Events.WAITING_OPERATOR,
      Events.FAILED
    ])
    this.machine.registerState(Events.FAILED, [Events.INIT])
    this.machine.addEventListener((s) => {
      switch (s) {
        case Events.INIT:
          this.signIn.bind(this)()
          break
        case Events.SIGNED_IN:
          this.prepare.bind(this)()
          break
        case Events.WAITING_OPERATOR:
          this.waitingOperator.bind(this)()
          break
        case Events.UNDER_CONTROL:
          this.underControl.bind(this)()
          break
        default:
          break
      }
    })
  }

  underControl () {
    this.data.mqtt.client.on('message', function (topic, message) {
      openBoard.controlServo(board, topic, message)
    })
  }

  waitingOperator () {
    this.data.mqtt.subscribe()
    this.machine.transition(Events.UNDER_CONTROL)
  }

  /**
   * prepare board, mqtt client, actioncable for waiting operator.
   */
  prepare () {
    this.machine.transition(Events.PREPARING)
    this.data.mqtt = new MqttClient()
    const mqttPromise = this.data.mqtt.connect()
    const channelsConnection = new ChannelsConnection()
    const createConsumerPromise = channelsConnection.createConsumer(
      this.data.cred
    )
    runExecCommand('start-momo', execMomoCommand)
    Promise.all([mqttPromise, createConsumerPromise])
      .then(() => {
        this.machine.transition(Events.WAITING_OPERATOR)
      })
      .catch((e) => {
        console.log('***', e)
        this.machine.transition(Events.FAILED)
      })
  }

  signIn () {
    // WARN: add this timeout to wait wlan0 when Rpi turns on.
    // but not good solution for this network problem
    // issue #35
    setTimeout(() => {
      singInRoid()
        .then((cred) => {
          this.data.cred = cred
          this.machine.transition(Events.SIGNED_IN)
        })
        .catch((e) => {
          this.machine.transition(Events.FAILED)
        })
    }, 10000)
  }

  start () {
    this.machine.run(Events.INIT)
  }
}

module.exports = RoidStateMachine
