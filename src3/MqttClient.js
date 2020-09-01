const Debug = require("debug");
const debug = new Debug("mqtt");
const mqtt = require('mqtt');
const MQTT_URL = 'mqtt://160.16.238.254';

const constantsData = require('../constants')
const { key } = constantsData
const {email} = key

class MqttClient {
  constructor() {
    this.client = null;
  }
  
  connect( ) {
    this.client = mqtt.connect(MQTT_URL);
    debug("connecting...");
    return new Promise((resolve, reject) => {
      debug("connected");
      this.client.once('connect', resolve);
    })
  }
  
  subscribe() {
    this.client.subscribe(email,debug)
    this.client.subscribe(`${email}/command`,debug)
  }
  
}

module.exports = MqttClient;
