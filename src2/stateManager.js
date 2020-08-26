const signRoid = require('./signIn')
const constantsData = require('../constants')
const { key, cred } = constantsData

const render = (state) => {
  console.log(state)
}

const machine = {
  state: 'init',
  dispatch(actionName, ...payload) {
    console.log('****', actionName, ...payload)
    const actions = this.transitions[this.state];
    const action = actions[actionName]
    console.log('***', actions)
    if (action) {
      render(`action dispatched: ${ actionName }`);
      action.apply(machine, payload);
    }
  },
  changeState(newState) {
    render(`state changed: ${newState}`)
    this.state = newState
  },
  transitions: {
    'init': {
      signIn: function () {
        signRoid.loginRoid()
        this.changeState('signOut')
        
      }
    },
    'failedSignIn': {
      retry: function () {
        this.changeState('init')
      }
    },
    
    'signOut': {
      logOut: function () {
        console.log('__cred', cred)
        this.changeState('init')
      }
    }
  }
}

render(`initial state: ${machine.state}`)
machine.dispatch('signIn')

setTimeout(() => {
  machine.dispatch('logOut')
  console.log('Log out')
}, 4000)
