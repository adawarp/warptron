const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://160.16.238.254')
const fs = require('fs')
const WebSocket = require('ws')
if (typeof window === 'undefined') {
  global.window = {}
  global.document = {}
  global.document = { addEventListener: () => null }
  global.WebSocket = WebSocket
}

const rawData = fs.readFileSync('./warp-key.json')
const { exec } = require('child_process')

const signIn = require('./src/sign-in.js')
const signInRoid = new signIn()

const key = JSON.parse(rawData)
const { email } = key

const execMomoCommand = `./momo --video-device 0 --log-level 2 sora --video-codec VP8 wss://devwarp.work/signaling ${email} --auto --role sendrecv --multistream`

exec(execMomoCommand, (err, stdout, stderr) => {
  if (err) {
    console.warn('error 1', err)
  }
  console.warn('stdout', stdout)
})

client.on('connect', function () {
  signInRoid.loginRoid(key)

  client.subscribe(email, function (err) {
    console.warn('error 2', err)
  })

  client.subscribe(`${email}-restart-momo`, function (err) {
    console.warn(err)
  })

  client.subscribe(`${email}/command`, function (err) {
    console.warn(err)
  })
})

client.on('message', function (topic, message) {
  if (topic === `${email}-restart-momo`) {
    exec('killall momo', (err, stdout, stderr) => {
      if (err) {
        console.warn(err)
      }
      console.warn(stdout)
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
})

const { Board, Servo } = require('johnny-five')
const board = new Board()

board.on('ready', () => {
  const yawServo = new Servo({
    pin: 3,
    center: true,
    range: [60, 120]
  })

  const pitchServo = new Servo({
    pin: 5,
    center: true,
    invert: true,
    range: [80, 100]
  })

  client.on('message', function (topic, message) {
    if (topic === `${email}/command`) {
      const commandForSerial = message
      const neckPitch = commandForSerial[3]
      const neckYaw = commandForSerial[4]

      yawServo.to(neckYaw)
      pitchServo.to(neckPitch)
    }
  })
})
