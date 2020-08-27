const fetch = require('node-fetch')

const constantsData = require('../constants')
// const actionCableState = require('./channels')
const { key } = constantsData

var exports = {}

exports.loginRoid = async () => {
  const { email, password, apiUrl } = key
  const url = `${apiUrl}/roid/sign_in`
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
  })
  if (signInRes.status === 200 ) {
    const {headers} = signInRes
    const cred = {
      token: headers.get('access-token'),
      client: headers.get('client'),
      uid: headers.get('uid')
    }
    return Promise.resolve(cred)
  } else {
    return Promise.reject(new Error('404'))
  }
}

module.exports = exports
