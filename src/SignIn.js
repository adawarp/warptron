const fetch = require('node-fetch')

const constantsData = require('../constants')
const {key} = constantsData

module.exports = async () => {
  const {email, password, apiUrl} = key
  const url = `${apiUrl}/roid/sign_in`
  const params = {
    email,
    password
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
  if (res.status === 200) {
    const {headers} =res
    const cred = {
      token: headers.get('access-token'),
      client: headers.get('client'),
      uid: headers.get('uid')
    }
    return Promise.resolve(cred)
  }
  return Promise.reject(new Error('failed to sign in'));
}
