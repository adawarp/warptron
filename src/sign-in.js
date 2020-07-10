const fetch = require('node-fetch')
const actionCable = require('actioncable')
actionCable.WebSocket = WebSocket
const { exec } = require('child_process')

module.exports = function () {
  this.cable = {}
  this.loginRoid = async (key) => {
    const { email, password, apiUrl, wsUrl } = key
    const execMomoCommand = `./momo --log-level 2 sora wss://devwarp.work/signaling ${email} --auto --role sendrecv --multistream`
    const API_URL = apiUrl
    const WS_URL = wsUrl
    const url = `${API_URL}/roid/sign_in`
    const params = {
      email,
      password
    }
    const signInRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    }).catch((err) => {
      console.warn('ERROR : POST /user')
      console.warn(err)
    })

    if (signInRes.status === 200) {
      const { headers } = signInRes

      const cred = {
        token: headers.get('access-token'),
        client: headers.get('client'),
        uid: headers.get('uid')
      }
      const url = `${WS_URL}/cable?uid=${cred.uid}&client=${cred.client}&token=${cred.token}`
      this.cable = actionCable.createConsumer(url)
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
      this.cable.subscriptions.create(
        { channel: 'LineChannel', roidId: email },
        {
          connected () {
            console.warn('Connected LineChannel')
          },
          received (data) {
            console.warn(data, 'received data from line channel')
            if (data.message === 'restart-momo') {
              exec('killall momo', (err, stdout, stderr) => {
                if (err) {
                  alert(err)
                }
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
          }
        }
      )
    } else {
      console.warn('Failed sign in')
    }
  }
}
