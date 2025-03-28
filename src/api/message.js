import Http from '@/utils/axios'

export default {
  send(param) {
    return Http.post('/api/v1/message/send', param)
  },
  record(param) {
    return Http.get('kfapi/chat/userChatLog', param)
  },
  recall(param) {
    return Http.post('/api/v1/message/recall', param)
  },
}
