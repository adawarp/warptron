const fs = require('fs')
const rawData = fs.readFileSync('../../warp-key.json')

const key = JSON.parse(rawData)
const { email } = key

const execMomoCommand = `./momo --log-level 2 --resolution 1640x1080 --priority RESOLUTION sora --video-codec VP8 wss://devwarp.work/signaling ${email} --auto --role sendrecv --multistream`

module.exports = {
  key,
  execMomoCommand
}
