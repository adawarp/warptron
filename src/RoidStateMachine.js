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
      console.log(message, topic)
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
    openBoard.readyBoard(board)
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
    singInRoid()
      .then((cred) => {
        this.data.cred = cred
        this.machine.transition(Events.SIGNED_IN)
      })
      .catch((e) => {
        this.machine.transition(Events.FAILED)
      })
  }

  start () {
    this.machine.run(Events.INIT)
  }
}

module.exports = RoidStateMachine