const actionCable = require('actioncable')
const WebSocket = require('ws')
actionCable.WebSocket = WebSocket

const runExecCommand = require('./execCommand')
const constantsData = require('../constants')

const { key, execMomoCommand } = constantsData
const { wsUrl } = key

class ChannelsConnection {
  constructor () {
    this.cable = null
    this.lineChannel = null
  }

  createConsumer (cred) {
    const url = `${wsUrl}/cable?uid=${cred.uid}&client=${cred.client}&token=${cred.token}&type=roid`
    this.cable = actionCable.createConsumer(url)
    this.connectedAppearanceChannel()
    this.connectedLineChannel()
    return Promise.resolve('created consumer')
  }

  connectedAppearanceChannel () {
    const appearanceChannel = this.cable.subscriptions.create(
      { channel: 'AppearanceChannel', email: key.email },
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
    setInterval(() => {
      appearanceChannel.send({
        roidId: key.email,
        message: 'ping',
        pingAt: new Date()
      })
    }, 6000)
  }

  connectedLineChannel () {
    this.cable.subscriptions.create(
      { channel: 'LineChannel', roidId: key.email },
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
              '/usr/bin/amixer -c1 sset Speaker ' +
              data.body.volume +
              '% unmute'
            runExecCommand(data.eventName, setVolumeCommand)
          }
        }
      }
    )
  }
}

module.exports = ChannelsConnection
