const Debug = require("debug");
const debug = new Debug("state:base");
const EventEmitter = require('events');
class StateMachine {
  constructor() {
    this.events = new EventEmitter();
    this.states = {};
    this.current = null;
  }
  
  run(initialState) {
    if (this.states[initialState] == null) {
      return new Error(`unknown initial state: ${initialState}`)
    }
    debug(`run state: ${initialState}`);
    this.current = initialState;
    this.events.emit("stateChanged", initialState);
  }
  
  registerState(stateName, nextStateNames, beforeHook = null, afterHook = null) {
    debug(`state registered: ${stateName}`);
    this.states[stateName] = {
      availableStates: nextStateNames,
       beforeHook, afterHook
    }
  }
  
  transition(stateName) {
    debug(`attempt to state transition: ${this.current} => ${stateName}`);
    if (this.states[stateName] == null) {
      debug(`unknown state: ${stateName}`);
      return new Error(`unknown state: ${stateName}`)
    }
    if (this.states[this.current].availableStates.indexOf(stateName) === -1) {
      debug(`cannot transition : ${this.current} => ${stateName}`);
      return new Error(`cannot transition into the state: "${stateName}" from "${this.current}"`);
    }
    const afterHook = this.states[this.current].afterHook;
    if (typeof afterHook === "function") {
      afterHook();
    }
    const beforeHook = this.states[stateName].beforeHook;
    if (typeof beforeHook === "function") {
      beforeHook();
    }
    debug(`state transited: ${this.current} => ${stateName}`);
    this.current = stateName;
    this.events.emit("stateChanged", stateName);
  }
  
  addEventListener( fn) {
    this.events.on("stateChanged", fn);
  }
  
  removeStateChangedEventListener( fn) {
    this.events.off("stateChanged", fn);
  }
}

module.exports = StateMachine;
