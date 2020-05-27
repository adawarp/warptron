const {exec} = require('child_process');

exec('sh momo.sh', (err, stdout, stderr) => {
  if (err) { console.log(err); }
  console.log(stdout);
});

const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://160.16.238.254')

const userName = 'roid1'

const ARDUINO_PRO_MICRO_VENDOR_ID = '2341';
const ARDUINO_PRO_MICRO_PRODUCT_ID = '8036';
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
      exec('sh momo.sh', (err, stdout, stderr) => {
        if (err) { console.log(err); }
        console.log(stdout);
      });
    }, 3000)
  }
})

const serialport = require("serialport");

let commandForSerial = ''

serialport.list().then(ports => {
  // console.log(ports);
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
        // console.log({commandForSerial});
        serialPort.write(commandForSerial)
      }
    }, 50)

    serialPort.on("data", data => {
      // console.log("serial data : ", data);
    })
  } else {
    console.warn("can not find arduino")
  }
});
