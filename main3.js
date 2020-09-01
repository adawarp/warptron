const WebSocket = require('ws')
if (typeof window === 'undefined') {
  global.window = {}
  global.document = {}
  global.document = { addEventListener: () => null }
  global.WebSocket = WebSocket
}
const RoidStateMachine = require('./src3/RoidStateMachine')
const state = new RoidStateMachine();
state.start()
