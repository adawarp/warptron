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

const rawData = fs.readFileSync('warp-key.json')
const { exec } = require('child_process')

const signIn = require('./src/sign-in.js')
const signInRoid = new signIn()

const key = JSON.parse(rawData)
const { email } = key

const execMomoCommand = `./momo --log-level 2 sora wss://devwarp.work/signaling ${email} --auto --role sendrecv --multistream`

exec(execMomoCommand, (err, stdout, stderr) => {
  if (err) {
    console.warn('error 1', err)
  }
  console.warn('stdout', stdout)
})

// const ARDUINO_PATH = '/dev/ttyS0'
// const ARDUINO_PATH = '/dev/ttyAMA0';
// const ARDUINO_PATH = '/dev/ttyACM0';
const ARDUINO_PATH = '/dev/tty.usbmodem144101'

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

const { Board, Fn } = require('johnny-five')
const board = new Board({ port: ARDUINO_PATH })

const servoType = require('./src/servoType')
const bodyServo = new servoType()
const cal = (x) => Fn.map(x, 0, 320, 0, 288)

board.on('ready', () => {
  client.on('message', function (topic, message) {
    if (topic === `${email}/command`) {
      bodyServo.neckPitch.to(cal(message[3]))
      bodyServo.neckYaw.to(cal(message[4]))
      bodyServo.leftArmPitch.to(cal(message[5]))
      bodyServo.leftArmYaw.to(cal(message[6]))
      bodyServo.rightArmPitch.to(cal(message[7]))
      bodyServo.rightArmYaw.to(cal(message[8]))
    }
  })
})
