const { exec } = require('child_process')

const Mediator = function (action) {
  this.action = action
  this.member = null

  this.runCommand = function (command) {
    console.log('____++', action)
    this.member.runCommand(command, this)
  }
}

const Member = function () {
  const actions = {}
  return {
    register: function (mediator) {
      actions[mediator.action] = mediator
      mediator.member = this
    },

    runCommand: function (command, action) {
      console.log('***', action)
      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.warn(err)
        }
        console.warn(stdout)
      })
    }
  }
}

module.exports = function (topic, command) {
  const mediator = new Mediator(topic)
  const member = new Member()
  member.register(mediator)
  mediator.runCommand(command)
}
