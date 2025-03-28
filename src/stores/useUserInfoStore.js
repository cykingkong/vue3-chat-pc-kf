import { defineStore } from 'pinia'

export const useUserInfoStore = defineStore('user-info', {
  state: () => ({
    kfId: '',
    mainUserId: '',
    userId: '',
    account: '',
    password: '',
    nickname: '',
    avatar: '',
    wckIdArr: '',
    uuid: '',
    onlineStatus: '',
    status: '',
    loginTime: '',
    loginIpAddress: '',
    maxConnections: '',
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
  }),
  actions: {
    async setUserInfo(userInfo) {
      this.kfId = userInfo.kfId
      this.mainUserId = userInfo.mainUserId
      this.userId = userInfo.userId
      this.account = userInfo.account
      this.password = userInfo.password
      this.nickname = userInfo.nickname
      this.avatar = userInfo.avatar
      this.wckIdArr = userInfo.wckIdArr
      this.uuid = userInfo.uuid
      this.onlineStatus = userInfo.onlineStatus
      this.status = userInfo.status
      this.loginTime = userInfo.loginTime
      this.loginIpAddress = userInfo.loginIpAddress
      this.maxConnections = userInfo.maxConnections
      this.createdAt = userInfo.createdAt
      this.updatedAt = userInfo.updatedAt
      this.deletedAt = userInfo.deletedAt
    },
    async setUuid (userInfo){
      this.uuid = userInfo.uuid
      this.nickname = userInfo.nickname

    },
    async clearUserInfo() {
      this.uuid = ''
      this.kfId = ''
      this.mainUserId = ''
      this.userId = ''
      this.account = ''
      this.password = ''
      this.nickname = ''
      this.avatar = ''
      this.wckIdArr = ''
      this.onlineStatus = ''
      this.status = ''
      this.loginTime = ''
      this.loginIpAddress = ''
      this.maxConnections = ''
      this.createdAt = ''
      this.updatedAt = ''
      this.deletedAt = null
    },
    async setUserAvatar(avatar) {
      this.avatar = avatar
    },
  },
  persist: true,
})
