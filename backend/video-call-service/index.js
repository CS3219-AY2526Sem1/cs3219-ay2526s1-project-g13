const express = require('express');
const {RtcTokenBuilder, RtcRole} = require('agora-access-token');
const app = express()

const PORT = process.env.PORT
const APP_ID = process.env.APP_ID
const APP_CERTIFICATE = process.env.APP_CERTIFICATE

const nocache = (_, resp, next) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
}

const generateRTCToken = (req, resp) => {
  resp.header('Access-Control-Allow-Origin', '*');
  const roomId = req.params.roomid;
  // channel - room id 
  if (!roomId) {
    return resp.status(500).json({ 'error': 'roomId is required' });
  }

  // user id
  let uid = req.params.uid;
  if(!uid || uid === '') {
    return resp.status(500).json({ 'error': 'uid is required' });
  }

  // get role
  let role = RtcRole.PUBLISHER
  console.log(">>> Role is always PUBLISHER")

  // set expire time for token
  let expireTime = 3600

  // calculate expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  // build token
  let token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, roomId, uid, role, privilegeExpireTime)
  console.log(">>> Build Token with Account")
  console.log(roomId)
  console.log(uid)
  console.log(role)
  
  // return token
  return resp.json({ 'rtcToken': token });
}

app.get('/v1/video/:roomid/:uid', nocache , generateRTCToken)

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
