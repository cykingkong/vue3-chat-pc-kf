import Http from '@/utils/axios'

export default {
  offer(param) {
    return Http.post(`/api/v1/file/offer`, param)
  },
  answer(param) {
    return Http.post(`/api/v1/file/answer`, param)
  },
  candidate(param) {
    return Http.post(`/api/v1/file/candidate`, param)
  },
  cancel(param) {
    return Http.post(`/api/v1/file/cancel`, param)
  },
  invite(data) {
    return Http.put(`/kfapi/tool/upload`, data)
  },
  accept(param) {
    return Http.post(`/api/v1/file/accept`, param)
  },
}
