import EventBus from '@/utils/eventBus.js'
import { useToast } from '@/components/ToastProvider.vue'

let ws = null
let heartTimer = null
let timer = null
let lockReconnect = false
let token = null
const reconnectCountMax = 200
let reconnectCount = 0
let isConnect = false
const showToast = useToast()

function response(event) {
  // if (event.type !== 'message') {
  //   onCloseHandler()
  //   return
  // }
  let wsContent
  try {
    wsContent = JSON.parse(event.data)
  } catch {
    onCloseHandler()
    return
  }
  if (wsContent) {
    if (wsContent.code !== 200) {
      EventBus.emit('on-show-toast', wsContent.message)
      onCloseHandler()
    } else {
      switch (wsContent.action) {
        case 'userMsg': {
          EventBus.emit('on-receive-msg', wsContent.content)
          break
        }
        case 'KfLogin': {
          sessionStorage.setItem('kfUuid',wsContent.data.uuId)
          EventBus.emit('on-receive-notify', wsContent.data)
          break
        }
        case 'video': {
          EventBus.emit('on-receive-video', wsContent.content)
          break
        }
        case 'file': {
          EventBus.emit('on-receive-file', wsContent.content)
          break
        }
      }
      // 回复消息
      switch(wsContent.msgType){
        case 'message.userMsg':{
          console.log(wsContent.data.msg,'msg')
          EventBus.emit('on-receive-msg', wsContent.data)
          break;
        }
        case 'message.consultList':{
          console.log(wsContent.data,'message.consultList')
          EventBus.emit('on-reload-list', wsContent.data)
          break;
        }
      }
    }
  } else {
    onCloseHandler()
  }
}

function connect(tokenStr) {
  if (isConnect || ws) return
  isConnect = true
  token = tokenStr
  try {
    console.log(import.meta,'import.meta')
    const wsIp = import.meta.env.VITE_WS_URL
    ws = new WebSocket(wsIp )

    ws.onopen = () => {
      console.log('Connected to server',ws)
      let kfLogingParams = {
        action: 'KfLogin',
        params: {
          token: `${sessionStorage.getItem('x-token')}`,
        }
      }
      if(ws){
        ws.send(JSON.stringify(kfLogingParams))
      }

      clearTimer()
      sendHeartPack()
    }

    ws.onmessage = response
    ws.onclose = onCloseHandler
    ws.onerror = onCloseHandler
  } catch {
    onCloseHandler()
  }
}

function send(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(msg)
}

const sendHeartPack = () => {
  heartTimer = setInterval(() => {
    send(JSON.stringify({
      "action": "Ping",
      "params": {
          "uuId": sessionStorage.getItem('kfUuid')||''
      }
  }))
  },5000)
}

const onCloseHandler = () => {
  console.log('onCloseHandler' )
  clearHeartPackTimer()
  if (ws) {
    ws.close()
    ws = null
  }
  isConnect = false
  if (lockReconnect) return
  lockReconnect = true
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (reconnectCount >= reconnectCountMax) {
    reconnectCount = 0
    return
  }
  if (token) {
    timer = setTimeout(() => {
      connect(token)
      reconnectCount++
      lockReconnect = false
    }, 5000)
  }
}

const clearHeartPackTimer = () => {
  console.log('Closing connection')
  if (heartTimer) {
    clearInterval(heartTimer)
    heartTimer = null
  }
}

const clearTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const disConnect = () => {
  console.log('disConnect')
  clearHeartPackTimer()
  token = null
  if (ws) {
    ws.close()
    ws = null
  }
  isConnect = false
}

export default { connect, disConnect,send }
