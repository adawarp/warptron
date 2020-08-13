const { exec } = require('child_process')
const actionCable = require('actioncable')
actionCable.WebSocket = WebSocket

var exports = {}

exports.connectToChannel = (cred, WS_URL) => {
  const execMomoCommand = `./momo --log-level 2 sora wss://devwarp.work/signaling ${cred.uid} --auto --role sendrecv --multistream`
  const url = `${WS_URL}/cable?uid=${cred.uid}&client=${cred.client}&token=${cred.token}`
  const cable = actionCable.createConsumer(url)
  exports.cable = cable
  cable.subscriptions.create(
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
  cable.subscriptions.create(
    { channel: 'LineChannel', roidId: cred.uid },
    {
      connected () {
        console.warn('Connected LineChannel')
      },
      received (data) {
        console.warn(data, 'received data from line channel')
        if (data.eventName === 'restart-momo') {
          exec('killall momo', (err, stdout, stderr) => {
            console.warn(err)
            console.warn(stdout, stderr)
          })

          setTimeout(() => {
            exec(execMomoCommand, (err, stdout, stderr) => {
              if (err) {
                console.warn(err)
              }
              console.warn(stdout)
            })
          }, 3000)
        }
        if (data.eventName === 'set-volume') {
          exec(
            '/usr/bin/amixer -c1 sset Speaker ' + data.body.volume + '% unmute',
            (err, stdout, stderr) => {
              console.warn(err)
              console.warn(stdout, stderr)
            }
          )
        }
      }
    }
  )
}

module.exports = exports
