const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://160.16.238.254')
const fs = require('fs');
const fetch = require('node-fetch');
const WebSocket = require('ws')
if (typeof window === "undefined") {
  global.window = {};
  global.document = {};
  global.document = { addEventListener: () => null }
  global.WebSocket = WebSocket;
}

const actionCable = require('actioncable')
actionCable.WebSocket = WebSocket;

const rawData = fs.readFileSync('warp-key.json');
const {exec} = require('child_process');

const key = JSON.parse(rawData);
const {email, password, apiUrl, wsUrl} = key
const API_URL = apiUrl;
const WS_URL = wsUrl;

const execMomoCommand = `./momo --log-level 2 sora wss://devwarp.work/signaling ${email} --auto --role sendrecv --multistream`;

exec(execMomoCommand, (err, stdout, stderr) => {
  if (err) { console.log('error 1', err); }
  console.log('stdout',stdout);
});

// const ARDUINO_PATH = '/dev/ttyS0';
const ARDUINO_PATH = '/dev/ttyAMA0';
// const ARDUINO_PATH = '/dev/ttyACM0';

let cable;
let apConsumer
const signInRoid = async () => {
  const url = `${API_URL}/roid/sign_in`;
  console.log(url)
  const params = {
    email,
    password
  };
  const signInRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  }).catch((err) => {
    console.warn("ERROR : POST /user");
    console.warn(err);
  });
  
  if (signInRes.status === 200) {
    const { headers } = signInRes;
    
    const cred = {
      token: headers.get("access-token"),
      client: headers.get("client"),
      uid: headers.get("uid"),
    };
    console.warn("roid Sign in success", cred);
    const url = `${WS_URL}/cable?uid=${cred.uid}&client=${cred.client}&token=${cred.token}`;
    cable = actionCable.createConsumer(url);
    apConsumer = cable.subscriptions.create( {channel: "AppearanceChannel", roidEmail: email }, {
      connected() {
        this.perform('appear')
        console.log('connected appearance channel')
      },
      disconnected() {
        console.log('Disconnected appearance channel')
      },
      received(data) {
        console.warn(data)
      },
    });
    cable.subscriptions.create({ channel: "LineChannel", roidId: email }, {
      connected() {
        console.log('Connected LineChannel')
      },
      received(data) {
        console.warn(data, 'received data from line channel')
        if(data.message === 'restart-momo') {
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
      },
    });
  } else {
    console.warn("Failed sign in");
  }
}


client.on('connect', function () {
  signInRoid()
  
  setInterval(() => {
    const today = new Date()
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
    apConsumer.send({
      roidEmail: email,
      time: time
    })
  }, 3000)
  client.subscribe(email, function (err) {
    console.log('error 2',err)
  })

  client.subscribe(`${email}-restart-momo`, function (err) {
    console.log(err)
  })

  client.subscribe(`${email}/command`, function (err) {
    console.log("connected")
    console.log(err)
  })
  

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
      if(topic === `${email}/command`) {
        commandForSerial = message;
      }
    })

    setInterval(() => {
      if(commandForSerial) {
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
