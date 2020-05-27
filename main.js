const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://160.16.238.254')

const fs = require('fs');
const rawData = fs.readFileSync('warp-key.json');
const key = JSON.parse(rawData);

const userName = key.roidId;
console.log(userName);

const {exec} = require('child_process');
const execMomoCommand = `./momo --log-level 2 --no-audio-device sora wss://devwarp.work/signaling ${key.roidId} --auto --role sendrecv --multistream`;

exec(execMomoCommand, (err, stdout, stderr) => {
  if (err) { console.log(err); }
  console.log(stdout);
});

// const ARDUINO_PATH = '/dev/ttyS0';
const ARDUINO_PATH = '/dev/ttyAMA0';
// const ARDUINO_PATH = '/dev/ttyACM0';

client.on('connect', function () {
  client.subscribe(userName, function (err) {
    console.log(err)
  })

  client.subscribe(`${userName}-restart-momo`, function (err) {
    console.log(err)
  })

  client.subscribe(`${userName}/command`, function (err) {
    console.log("connected")
    console.log(err)
  })
})


client.on('message', function (topic, message) {
  if(topic === `${userName}-restart-momo`) {
    exec('killall momo', (err, stdout, stderr) => {
      if (err) { console.log(err); }
      console.log(stdout);
    });

    setTimeout(() => {
      exec(execMomoCommand, (err, stdout, stderr) => {
        if (err) { console.log(err); }
        console.log(stdout);
      });
    }, 3000)
  }
})

const serialport = require("serialport");

let commandForSerial = ''

serialport.list().then(ports => {
  const targetDevice = ports.find(p => p.path === ARDUINO_PATH);
  if (targetDevice) {
    console.log(targetDevice)
    const serialPort = new serialport(targetDevice.path, {
      baudRate: 115200,
      dataBits: 8,
      parity: "none",
      stopBits: 1,
      flowControl: false
    });

    client.on('message', function (topic, message) {
      if(topic === `${userName}/command`) {
        commandForSerial = message;
      }
    })

    setInterval(() => {
      if(commandForSerial) {
        console.log({commandForSerial});
        serialPort.write(commandForSerial)
      }
    }, 50)

    serialPort.on("data", data => {
      console.log("serial data : ", data);
    })
  } else {
    console.warn("can not find arduino")
  }
});
