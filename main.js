const {exec} = require('child_process');

exec('sh momo.sh', (err, stdout, stderr) => {
  if (err) { console.log(err); }
  console.log(stdout);
});


const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://160.16.238.254')

client.on('connect', function () {
  client.subscribe('zigen1', function (err) {
    console.log(err)
  })

  client.subscribe('zigen1-restart-momo', function (err) {
    console.log(err)
  })

  client.subscribe('zigen1/command', function (err) {
    console.log(err)
  })
})

client.on('message', function (topic, message) {
  if(topic === 'zigen1-restart-momo') {
    exec('killall momo', (err, stdout, stderr) => {
    if (err) { console.log(err); }
    console.log(stdout);
  });

  exec('sh momo.sh', (err, stdout, stderr) => {
    if (err) { console.log(err); }
    console.log(stdout);
  });
  }
})

const serialport = require("serialport");

let commandForSerial = ''

serialport.list().then(ports => {
  const targetDevice = ports.find(p => p.manufacturer === 'FTDI');
  if (targetDevice) {
    const serialPort = new serialport(targetDevice.path, {
      baudRate: 9600,
      dataBits: 8,
      parity: "none",
      stopBits: 1,
      flowControl: false
    });

    client.on('message', function (topic, message) {
      if(topic === 'zigen1/command') {
        commandForSerial = `${message.toString()}\r\n`
        serialPort.write(commandForSerial)
      }
    })
  }
});