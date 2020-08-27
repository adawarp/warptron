const actionCable = require('actioncable')
actionCable.WebSocket = WebSocket

const runExecCommand = require('./execCommand')

const constantsData = require('../constants')
const { key, cred, } = constantsData
const {WS_URL} = key
console.warn('credential is : ', cred)
// var exports = {}

const execMomoCommand = `./momo --log-level 2 sora wss://devwarp.work/signaling ${cred.uid} --auto --role sendrecv --multistream`

// exports.connectToChannel = (cred, WS_URL) => {
//   const execMomoCommand = `./momo --log-level 2 sora wss://devwarp.work/signaling ${cred.uid} --auto --role sendrecv --multistream`
//   const url = `${WS_URL}/cable?uid=${cred.uid}&client=${cred.client}&token=${cred.token}`
//   const cable = actionCable.createConsumer(url)
//   exports.cable = cable
//   cable.subscriptions.create(
//     { channel: 'AppearanceChannel' },
//     {
//       connected () {
//         this.perform('appear')
//         console.warn('connected appearance channel')
//       },
//       disconnected () {
//         console.warn('Disconnected appearance channel')
//       },
//       received (data) {
//         console.warn(data)
//       }
//     }
//   )
//   const cs = cable.subscriptions.create(
//     { channel: 'LineChannel', roidId: cred.uid },
//     {
//       connected () {
//         console.warn('Connected LineChannel')
//       },
//       received (data) {
//         console.warn(data, 'received data from line channel')
//         if (data.eventName === 'restart-momo') {
//           runExecCommand(data.eventName, 'killall momo')
//
//           setTimeout(() => {
//             runExecCommand(data.eventName, execMomoCommand)
//           }, 3000)
//         }
//         if (data.eventName === 'set-volume') {
//           const setVolumeCommand =
//             '/usr/bin/amixer -c1 sset Speaker ' + data.body.volume + '% unmute'
//           runExecCommand(data.eventName, setVolumeCommand)
//         }
//       }
//     }
//   )
//
//   exports.lineChannelSubscription = cs
// }

const logger = (state) => {
  console.warn(state)
}

const actionCableState = {
  state: 'init',
  cable: null,
  
  dispatch(actionName, ...payload) {
    console.warn('****', actionName, ...payload)
    const actions = this.transitions[this.state];
    const action = actions[actionName]
    if (action) {
      logger(`action dispatched: ${ actionName }`);
      action.apply(actionCableState, payload);
    }
  },
  changeState(newState) {
    logger(`state changed: ${newState}`)
    this.state = newState
  },
  transitions: {
    'init': {
      createConsumer: function () {
        const url = `${WS_URL}/cable?uid=${cred.uid}&client=${cred.client}&token=${cred.token}`
        this.cable = actionCable.createConsumer(url)
        this.changeState('connectAppearance')
        this.dispatch('connectedAppearanceChannel')
        this.dispatch('connectedLineChannel')
      }
    },
    'connectAppearance': {
      connectedAppearanceChannel: function () {
        this.cable.subscriptions.create(
          { channel: 'AppearanceChannel' },
          {
            connected () {
              this.perform('appear')
              console.warn('connected appearance channel')
            },
            disconnected () {
              console.warn('Disconnected appearance channel')
            },
            received (data) {
              console.warn(data)
            }
          }
        )
      },
      connectedLineChannel: function () {
        this.cable.subscriptions.create(
          { channel: 'LineChannel', roidId: cred.uid },
          {
            connected () {
              console.warn('Connected LineChannel')
            },
            received (data) {
              console.warn(data, 'received data from line channel')
              if (data.eventName === 'restart-momo') {
                runExecCommand(data.eventName, 'killall momo')
          
                setTimeout(() => {
                  runExecCommand(data.eventName, execMomoCommand)
                }, 3000)
              }
              if (data.eventName === 'set-volume') {
                const setVolumeCommand =
                  '/usr/bin/amixer -c1 sset Speaker ' + data.body.volume + '% unmute'
                runExecCommand(data.eventName, setVolumeCommand)
              }
            }
          }
        )
        this.changeState('init')
      },
    }
  }
}


module.exports = actionCableState
