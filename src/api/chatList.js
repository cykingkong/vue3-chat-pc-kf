import Http from '@/utils/axios'

export default {
  group() {
    return Http.get('/api/v1/chat-list/group')
  },
  privateList(params) {
    return Http.get('kfapi/chat/consultList',params)
  },
  kfUserList(params) {
    return Http.get('kfapi/user/kfUserList',params)
  },
  create(param) {
    return Http.post('/api/v1/chat-list/create', param)
  },
  read(param) {
    return Http.post('/api/v1/chat-list/read', param)
  },
  delete(param) {
    return Http.post('/api/v1/chat-list/delete', param)
  },
  userKfQuickReplyGrid(params) {
    return Http.get('kfapi/reply/userKfQuickReplyGrid',params)
  },
  userKfQuickReplyAdd(param) {
    return Http.post('kfapi/reply/userKfQuickReplyAdd', param)
  },
  userKfQuickReplyDel(param) {
    return Http.post('kfapi/reply/userKfQuickReplyDel', param)
  },
  userKfQuickReplyUpdate(param) {
    return Http.post('kfapi/reply/userKfQuickReplyUpdate', param)
  },
  translate(param) {
    return Http.get('kfapi/chat/translate', param)
  },
}
