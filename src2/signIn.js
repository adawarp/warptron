const fetch = require('node-fetch')

// const channelConnections = require('./channels')
const constantsData = require('../constants')
const { key, setCred, } = constantsData


var exports = {}

exports.loginRoid = async () => {
  const { email, password, apiUrl, wsUrl } = key
  const API_URL = apiUrl
  const url = `${API_URL}/roid/sign_in`
  const params = {
    email,
    password
  }
  const signInRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  }).catch((err) => {
    console.warn('ERROR : POST /user')
    console.warn(err)
  })

  if (signInRes.status === 200) {
    const { headers } = signInRes
    const cred = {
      token: headers.get('access-token'),
      client: headers.get('client'),
      uid: headers.get('uid')
    }
    setCred(cred)
    
    // channelConnections.connectToChannel(cred, wsUrl)
  } else {
    console.warn('Failed sign in')
  }
}

module.exports = exports
