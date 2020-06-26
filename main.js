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

const ARDUINO_PATH = '/dev/ttyS0'
// const ARDUINO_PATH = '/dev/ttyAMA0';
// const ARDUINO_PATH = '/dev/ttyACM0';

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

const serialport = require('serialport')

let commandForSerial = ''

serialport.list().then((ports) => {
  const targetDevice = ports.find((p) => p.path === ARDUINO_PATH)
  if (targetDevice) {
    console.warn(targetDevice)
    const serialPort = new serialport(targetDevice.path, {
      baudRate: 115200,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      flowControl: false
    })

    client.on('message', function (topic, message) {
      if (topic === `${email}/command`) {
        commandForSerial = message
      }
    })

    setInterval(() => {
      if (commandForSerial) {
        serialPort.write(commandForSerial)
      }
    }, 50)

    serialPort.on('data', (data) => {
      console.warn('serial data : ', data)
    })
  } else {
    console.warn('can not find arduino')
  }
})
