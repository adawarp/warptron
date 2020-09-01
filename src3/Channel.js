const actionCable = require('actioncable')
const WebSocket = require('ws')
actionCable.WebSocket = WebSocket

const runExecCommand = require('./execCommand')
const constantsData = require('../constants')

const { key, execMomoCommand } = constantsData
const {wsUrl} = key

class ChannelsConnection {
  constructor() {
    this.cable = null;
    this.lineChannel = null
  }
  
  createConsumer(cred) {
    const url = `${wsUrl}/cable?uid=${cred.uid}&client=${cred.client}&token=${cred.token}`
    this.cable = actionCable.createConsumer(url);
    this.connectedAppearanceChannel()
    this.connectedLineChannel()
    return Promise.resolve('created consumer')
  }
  connectedAppearanceChannel() {
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
  };
  
  connectedLineChannel() {
    this.lineChannel = this.cable.subscriptions.create(
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
              '/usr/bin/amixer -c1 sset Speaker ' + data.body.volume + '% unmute'
            runExecCommand(data.eventName, setVolumeCommand)
          }
        }
      }
    )
    setInterval(() => {
      this.lineChannel.send({
        roidId: key.email,
        message: 'pong'
      })
    }, 4000)
  }
}

module.exports = ChannelsConnection
