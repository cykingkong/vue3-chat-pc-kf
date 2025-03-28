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
}
