const {exec} = require('child_process');

exec('sh momo.sh', (err, stdout, stderr) => {
  if (err) { console.log(err); }
  console.log(stdout);
});

const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://160.16.238.254')

const userName = 'roid1'

client.on('connect', function () {
  client.subscribe(userName, function (err) {
    console.log(err)
  })

  client.subscribe(`${userName}-restart-momo`, function (err) {
    console.log(err)
  })

  client.subscribe(`${userName}/command`, function (err) {
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
  const targetDevice = ports.find(p => p.manufacturer && p.manufacturer.indexOf('Arduino') > -1);
  if (targetDevice) {
    console.log(targetDevice)
    const serialPort = new serialport(targetDevice.path, {
      baudRate: 9600,
      dataBits: 8,
      parity: "none",
      stopBits: 1,
      flowControl: false
    });

    client.on('message', function (topic, message) {
      if(topic === `${userName}/command`) {
        console.log("mqtt message : ", message);
        commandForSerial = message;
        // commandForSerial = `${message.toString()}\r\n`
        serialPort.write(message)
      }
    })

    serialPort.on("data", data => {
      console.log("serial data : ", data);
    })
  }
});