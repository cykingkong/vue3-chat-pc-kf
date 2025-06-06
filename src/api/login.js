import Http from '@/utils/axios'

export default {
  verify(param) {
    return Http.post('/api/v1/login/verify', param)
  },
  publicKey() {
    return Http.get('/api/v1/login/public-key')
  },
  login(param) {
    return Http.post('kfapi/user/kfLogin', param)
  },
  getUserInfo(param) {
    return Http.get('/kfapi/user/info', param)
  },
}
