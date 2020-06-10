const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://160.16.238.254')
const fs = require('fs');
const fetch = require('node-fetch');
const WebSocket = require('ws');
if (typeof window === "undefined") {
  global.window = {};
}
const rawData = fs.readFileSync('warp-key.json');
const {exec} = require('child_process');

const key = JSON.parse(rawData);
const userName = key.roidId;
console.log(userName);

const execMomoCommand = `./momo --log-level 2 sora wss://devwarp.work/signaling ${key.roidId} --auto --role sendrecv --multistream`;

exec(execMomoCommand, (err, stdout, stderr) => {
  if (err) { console.log('error 1', err); }
  console.log('stdout',stdout);
});

// const ARDUINO_PATH = '/dev/ttyS0';
const ARDUINO_PATH = '/dev/ttyAMA0';
// const ARDUINO_PATH = '/dev/ttyACM0';


const signInRoid = async () => {
  const url = `http://localhost:3000/api/roid/sign_in`;
  console.log(url)
  const params = {
    email: key.email,
    password: key.password,
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
  
    const actionCable = require('actioncable')
    const url = `ws://localhost:3000/cable?uid=${cred.uid}&client=${cred.client}&token=${cred.token}`;
    const cable = actionCable.createConsumer(url);
    cable.subscriptions.create("AppearanceChannel", {
      connected() {
        this.perform("appear");
      },
      disconnected() {
        // cable.unsubscribe()
      },
    });
  
    // localStorage.setItem("__cred", JSON.stringify(cred));
  } else {
    console.warn("Failed sign in");
  }
}

client.on('connect', function () {
  
  signInRoid()
  client.subscribe(userName, function (err) {
    console.log('error 2',err)
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
