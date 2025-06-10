<template>
  <div class="chat-container">

    <!--文件传输-->
    <file-transfer v-model:visible="fileInfo.fileVisible" :target-info="fileInfo.fileTargetInfo"
      :is-send="fileInfo.fileIsSend" :file="fileInfo.file" />
    <!--语音接听-->
    <video-chat v-model:visible="videoInfo.videoVisible" :target-info="videoInfo.videoTargetInfo"
      :is-send="videoInfo.videoIsSend" :is-only-audio="videoInfo.videoIsOnlyAudio" />
    <!--用户信息修改-->
    <modify-user-info v-model:is-open="modifyUserInfoIsOpen" />
    <!--表情弹窗-->
    <linyu-popup v-model:visible="isEmojiVisible" :position="emojiPosition">
      <linyu-emoji-box @on-emoji="handlerOnEmoji" />
    </linyu-popup>
    <div class="chat-bg">
      <div class="chat-box">
        <!-- 左侧菜单 -->
        <div class="box-left" :class="{ 'show-left': showLeft }">
          <div class="chat-list-title">
            <div class="relative flex">
              列表
              <!-- <linyu-label class="absolute">v{{ version }}</linyu-label> -->
            </div>
            <div class="close-btn" @click="showLeft = false">×</div>
          </div>


          <div class="chat-list-content">
            <div class="tab-box">
              <div class="tab-item" :class="{ active: listType == e.value }" v-for="(e, k) in tabList" :key="k"
                @click="handleClickType(e)">
                {{ e.label }}
              </div>
            </div>
            <div v-for="(item, index) in privateChatList" :key="index"
              :class="['chat-list-item', targetId === item.user.uuId ? 'blue' : 'white']"
              @click="handleClickListItem(item)">
              <!-- <linyu-avatar :info="item.targetInfo" size="40px" class="mr-[10px]" /> -->
              <div class="chat-item-content">
                <div class="flex items-center justify-between mb-[5px]">
                  <div class="chat-content-name">{{ item.user.nickname }}</div>
                  <LinyuDotHint v-if="item.unreadCount" :text="item.unreadCount" />
                  <!-- <div class="set-remake" @click.stop="handleClickSetRemake(index)">+备注</div> -->
                </div>
                <div class="chat-content-msg">
                  <linyu-chat-list-content :is-group="false" :msg="item?.lastMessage" />
                </div>
              </div>
              <linyu-text-button v-if="targetId === item.targetId" text="移除" class="ml-[10px]"
                @click="() => onDeleteChatList(item.id)" />
            </div>
            <div class="list-empty" v-if="listStatus == 1 || listStatus == 3">
              {{ listStatus == 1 ? '加载中...' : '暂无用户~' }}
            </div>

          </div>
          <div class="mb-[10px]">

          </div>
        </div>
        <!-- 遮罩层 -->
        <div class="mask" v-if="showLeft || showRight" @click="closeMask"></div>
        <!-- 中间部分 -->
        <div class="box-middle">
          <div class="middle-top">
            <div class="menu-btn" @click="showLeft = true">
              <i class="iconfont icon-liebiao text-[24px]" />
            </div>
            <template v-if="targetId === '1'">
              {{ groupChat?.targetInfo.name }}（{{ msgStore.userListMap.size }}）
            </template>
            <template v-else>
              {{ currentSelectTarget?.user?.nickname }}
            </template>
            <div class="menu-btn" @click="showRight = true">
              <i class="iconfont icon-shezhi text-[24px]" />
            </div>
          </div>
          <div class="middle-content">
            <div class="chat-show-area" ref="chatShowAreaRef">
              <div v-for="(item, index) in msgRecord" class="msg-item" :key="index"
                :class="{ right: item.kfUser.uuId === userInfoStore.uuid }">
                <linyu-msg :msg="item" :user="item.user" />
              </div>
              <!-- <chat-skeleton v-if="isChatRecordLoading && msgRecord?.length <= 0 && !isComplete" /> -->
              <div v-if="isSendLoading" class="flex w-full justify-center items-center">
                <linyu-loading label="发送中" />
              </div>
              <div v-if="currentNewMsgCount > 0" class="new-msg-count" @click="scrollToBottom">
                <img alt="" class="h-[18px] mr-[5px]" src="/down.png" />
                {{ currentNewMsgCount }} 条新消息
              </div>
            </div>
            <div class="chat-input-area">
              <div class="chat-input">
                <div v-if="msgStore.referenceMsg" class="reference-msg">
                  <div class="reference-msg-content" v-if="msgStore.referenceMsg.type === MessageType.Text">
                    {{ msgStore.referenceMsg.fromInfo.name }} :
                    <text-msg :msg="msgStore.referenceMsg" />
                  </div>
                  <div v-if="msgStore.referenceMsg.type === MessageType.Emoji" class="flex items-center">
                    <div>{{ msgStore.referenceMsg.fromInfo.name }} :</div>
                    <emoji-msg height="40px" width="40px" :src="msgStore.referenceMsg.message" />
                  </div>
                  <call-msg v-if="msgStore.referenceMsg.type === MessageType.Call" :msg="msgStore.referenceMsg" />
                  <div class="ml-[10px]">
                    <linyu-icon-button @click="msgStore.referenceMsg = null" size="20px" font-size="12px"
                      icon="icon-shanchu" />
                  </div>
                </div>
                <div class="flex items-center">
                  <div class="emoji-button mr-[10px]" @click="handlerSetEmojiBoxPosition">
                    <div class="iconfont icon-biaoqing text-[28px]" />
                  </div>
                  <div class="chat-msg-input">
                    <linyu-msg-input v-model:value="msgContent" ref="msgInputRef" @send="handlerSubmitMsg"
                      :user="userListAll" :is-at-popup="targetId === '1'" />
                  </div>
                  <div v-if="targetId !== '1'" class="flex gap-[2px]">
                    <div class="emoji-button" @click="fileInput.click()">
                      <input type="file" accept="image/*" ref="fileInput" @change="handlerSendFile"
                        style="display: none" />
                      <div class="iconfont icon-wenjian text-[22px]" />
                    </div>
                    <!-- <div
                      class="emoji-button"
                      @click="() => handlerVideoCall(currentSelectTarget?.targetInfo, true, true)"
                    >
                      <div class="iconfont icon-yuyintonghua text-[22px]" />
                    </div>
                    <div
                      class="emoji-button"
                      @click="() => handlerVideoCall(currentSelectTarget?.targetInfo, true, false)"
                    >
                      <div class="iconfont icon-shipingtonghua text-[22px]" />
                    </div> -->
                  </div>
                </div>
              </div>
              <div class="publish-button" @click="handlerSubmitMsg">
                <i class="iconfont icon-fasong2 text-[28px]" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧菜单 -->
        <div class="box-right" :class="{ 'show-right': showRight }">
          <div class="right-top">
            <div class="flex items-center">
              <linyu-avatar :info="{ avatar: userInfoStore.avatar }" size="40px" class="mr-[5px] cursor-pointer"
                @click="modifyUserInfoIsOpen = true" v-if="userInfoStore && userInfoStore.avatar" />
              <div class="user-name">{{ userInfoStore.nickname }}({{ userInfoStore.account }})</div>
            </div>
            <div class="flex">
              <linyu-icon-button v-if="themeStore.theme === 'light'" @click="(e) => toggleDark(e, 'dark')"
                icon="icon-taiyang" />
              <linyu-icon-button v-if="themeStore.theme === 'dark'" @click="(e) => toggleDark(e, 'light')"
                icon="icon-yueliang" />
              <linyu-icon-button @click="handlerLogout" icon="icon-tuichu" />
            </div>
          </div>
          <div class="right-content">
            <div class="btn-box" v-if="privateChatList && privateChatList.length">
              <div class="btn" @click="overChat">结束该聊天</div>
              <div class="btn" @click="handleClickChangeKf">转接客服</div>
              <div class="btn" @click="handleClickShield">拉黑此用户</div>
            </div>
            <div class="divider" v-if="privateChatList && privateChatList.length"></div>
            <div class="reply-content" v-if="privateChatList && privateChatList.length">
              <div class="reply-title">快捷回复
                <div class="icon-box">
                  <img src="@/assets/add.svg" class="add" alt=""
                    @click=" replyForm.type = 1; replyForm.reply = ''; replyForm.remark = '';isReplyOpen = true; replyTitle = '添加快捷语'">
                </div>
              </div>
              <div class="reply-content-box">
                <linyu-tooltip v-for="(item, index) in replyContentList" :key="index"
                  @click="handleClickQuickReply(item)" :content="item.remark">
                  <div class="reply-content-item">
                    <div class="reply-content-item-left">
                      <div class="reply-content-item-left-content">{{ item.reply }}</div>
                    </div>
                    <div class="icon-box">
                      <img src="@/assets/edit.svg" alt="" v-if="item.kfId != 0"
                        @click="replyForm.reply = item.reply; replyForm.id = item.id; replyTitle = '编辑快捷语'; replyForm.type = 2; isReplyOpen = true">
                      <img src="@/assets/close.svg" v-if="item.kfId != 0" alt="" class="del-icon"
                        @click="replyForm.type = 3; replyForm.id = item.id; onReplyOk()">
                    </div>
                  </div>
                </linyu-tooltip>
              </div>
            </div>
            <div class="divider" v-if="privateChatList && privateChatList.length"></div>
            <!-- 翻译部分 -->

            <div class="translate-content">
              <div class="translate-title flex ">翻译
                <div class="pick-lang" @click="langVisible = true">{{ langActive == -1 ? '选择语言' :
                  `${languageList[langActive].label}` }}</div>
              </div>
              <div class="translate-input">
                <textarea name="" id="" v-model="translateText" placeholder="请输入需要翻译的内容" class="translate-textarea"
                  rows="5"></textarea>
              </div>
              <div class="translate-text-content">
                <LoadingDots v-if="translateStatus == '1'"></LoadingDots>
                {{ translatedText }}
                <linyu-tooltip @click="handlerCopy" content="复制" v-if="translatedText">
                  <linyu-icon-button size="24px" font-size="16px" icon="icon-fuzhi" />
                </linyu-tooltip>
              </div>
              <div class="translate-btn" @click="handleClickTranslate">翻译</div>
            </div>
            <!-- <div class="flex justify-between items-center mb-[10px]">
              <div class="text-[rgb(var(--text-color))] text-[14px] font-[600]">
                在线人数（{{ onlineCount }}）
              </div>
              <linyu-input
                placeholder="搜索用户"
                height="30px"
                width="140px"
                radius="5px"
                font-size="14px"
                v-model:value="userSearchValue"
              />
            </div>
            <div class="online-list">
              <div
                v-for="(item, index) in userList"
                class="online-list-item"
                :key="item.id"
                :class="{ odd: index % 2 === 0 }"
              >
                <div class="online-item-content">
                  <div class="w-[40px] h-[40px] relative">
                    <linyu-avatar :info="item" size="40px" />
                    <div v-if="item.status?.length" class="online-status" />
                  </div>
                  <div class="online-username">{{ item.name }}</div>
                  <linyu-tooltip
                    v-if="item.status?.includes('web')"
                    content="浏览器在线"
                    class="ml-[2px]"
                  >
                    <img src="/badge/web-online.png" alt="" class="h-[18px]" draggable="false" />
                  </linyu-tooltip>
                  <linyu-tooltip
                    v-if="item.status?.includes('ssh')"
                    content="SSH在线"
                    class="ml-[2px]"
                  >
                    <img src="/badge/ssh-online.png" alt="" class="h-[18px]" />
                  </linyu-tooltip>
                </div>
                <div class="online-item-operation ml-[20px]">
                  <linyu-text-button
                    v-if="item.id !== userInfoStore.userId && item.type !== UserType.Bot"
                    text="私聊"
                    @click="
                      () => {
                        onCreatePrivateChat(item.id)
                        closeMask()
                      }
                    "
                  />
                </div>
              </div>
            </div> -->
          </div>
        </div>
      </div>
      <CustomModal v-model:is-open="isReplyOpen" :position="{ top: 0, left: 0 }">
        <div class="modal-box">
          <div class="title">{{ replyTitle }}</div>
          <div class="content">
            <div class="flex items-start">
              <div class="label">快捷语：</div>
              <!-- <linyu-input  height="30px" width="140px" radius="5px" font-size="14px"
             /> -->
              <textarea class="reply-textarea" name="" id="" placeholder="请输入快捷语" v-model="replyForm.reply"></textarea>
            </div>
            <div class="flex items-start">
              <div class="label">备注：</div>
              <linyu-input height="30px" class="reply-textarea" width="140px" radius="5px" font-size="14px"
                placeholder="请输入快捷语备注" v-model:value="replyForm.remark" />
              <!-- <textarea class="reply-textarea" name="" id=""   placeholder="请输入快捷语"  v-model="replyForm.reply"></textarea> -->
            </div>
          </div>
          <div class="flex justify-end">
            <linyu-button type="minor" style="width: 80px" @click="isReplyOpen = false">取 消</linyu-button>
            <linyu-button style="width: 80px; margin-left: 10px" @click="onReplyOk">确 定</linyu-button>
          </div>
        </div>
      </CustomModal>
      <CustomModal v-model:is-open="isOpen" :position="{ top: 0, left: 0 }">
        <div class="modal-box">
          <div class="title">设置备注</div>
          <div class="content">
            <div class="flex items-center">
              <div class="label">备注：</div>
              <linyu-input placeholder="请输入备注" height="30px" width="140px" radius="5px" font-size="14px"
                v-model:value="remark" />
            </div>
          </div>
          <div class="flex justify-end">
            <linyu-button type="minor" style="width: 80px" @click="isOpen = false">取 消</linyu-button>
            <linyu-button style="width: 80px; margin-left: 10px" @click="onOk">确 定</linyu-button>
          </div>
        </div>
      </CustomModal>
      <CustomModal v-model:is-open="kfChangeOpen" :position="{ top: 0, left: 0 }">
        <div class="modal-box">
          <div class="title">选择要转接的客服</div>
          <div class="content">
            <div class="online-kf-list">
              <div class="online-kf-item" :class="{ 'active-item': otherKfUuid == item.kfId }"
                v-for="(item, index) in onlineKfList" :key="index" @click="handleClickChangeKfItem(index)">{{
                  item.nickname }}
              </div>
            </div>
          </div>
          <div class="flex justify-end">
            <linyu-button type="minor" style="width: 80px" @click="kfChangeOpen = false">取 消</linyu-button>
            <linyu-button style="width: 80px; margin-left: 10px" @click="onchangeOk">确 定</linyu-button>
          </div>
        </div>
      </CustomModal>
      <CustomModal v-model:is-open="langVisible" :position="{ top: 0, left: 0 }">
        <div class="modal-box">
          <div class="title">选择要翻译的语种</div>
          <div class="content">
            <div class="online-kf-list">
              <div class="online-kf-item" :class="{ 'active-item': langActive == index }"
                v-for="(item, index) in languageList" :key="index" @click="handleClickChangeLangItem(index)">{{
                  item.label }}
              </div>
            </div>
          </div>

        </div>
      </CustomModal>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useThemeStore } from '@/stores/useThemeStore.js'
import { toggleDark } from '@/utils/theme.js'
import LinyuInput from '@/components/LinyuInput.vue'
import { useRouter } from 'vue-router'
import LinyuTooltip from '@/components/LinyuTooltip.vue'
import LoadingDots from '@/components/LoadingDots.vue'

import LinyuButton from '@/components/LinyuButton.vue'

import ChatListApi from '@/api/chatList.js'

import MessageApi from '@/api/message.js'
import EventBus from '@/utils/eventBus.js'
import UserApi from '@/api/user.js'
import FileApi from '@/api/file.js'


import ws from '@/utils/ws.js'
import LinyuTextButton from '@/components/LinyuTextButton.vue'
import { useToast } from '@/components/ToastProvider.vue'
import LinyuIconButton from '@/components/LinyuIconButton.vue'
import LinyuMsg from '@/components/Msg/LinyuMsg.vue'
import { useChatMsgStore } from '@/stores/useChatMsgStore.js'
import LinyuPopup from '@/components/LinyuPopup.vue'
import LinyuEmojiBox from '@/components/LinyuEmojiBox.vue'
import EmojiMsg from '@/components/Msg/MsgContent/EmojiMsg.vue'
import LinyuChatListContent from '@/components/Msg/LinyuChatListContent.vue'
import { MessageType } from '@/constant/messageType.js'
import { MessageSource } from '@/constant/messageSource.js'
import LinyuMsgInput from '@/components/LinyuMsgInput.vue'
import { UserType } from '@/constant/userType.js'
import TextMsg from '@/components/Msg/MsgContent/TextMsg.vue'
import VideoChat from '@/components/VideoChat.vue'
import VideoApi from '@/api/video.js'
import CallMsg from '@/components/Msg/MsgContent/CallMsg.vue'
import FileTransfer from '@/components/FileTransfer.vue'
import LinyuLabel from '@/components/LinyuLabel.vue'
import ModifyUserInfo from '@/components/ModifyUserInfo.vue'
import { useUserInfoStore } from '@/stores/useUserInfoStore.js'
import LinyuLoading from '@/components/LinyuLoading.vue'
import ChatSkeleton from '@/components/ChatSkeleton.vue'
import CustomModal from '@/components/LinyuModal.vue'
import LinyuDotHint from '@/components/LinyuDotHint.vue';

const isOpen = ref(false)
const isReplyOpen = ref(false)
const langVisible = ref(false)
const translateStatus = ref('0')

const replyTitle = ref('编辑快捷语')
const translateText = ref('')
const translatedText = ref('')
const languageList = [
  {
    label: '中文',
    value: 'zh',
  },
  {
    label: '巴西语',
    value: 'pt',
  },
  {
    label: '英文',
    value: 'en',
  },

  {
    label: '俄语',
    value: 'ru',
  },
  {
    label: '日语',
    value: 'ja',
  },
  {
    label: '韩语',
    value: 'ko',
  },
  {
    label: '法语',
    value: 'fr',
  },
  {
    label: '德语',
    value: 'de',
  },
  {
    label: '西班牙语',
    value: 'es',
  },
  {
    label: '阿拉伯语',
    value: 'ar',
  },
  {
    label: '葡萄牙语',
    value: 'pt',
  },
];
const replyForm = ref({
  reply: '',
  remark: '',
  id: null,
})
const kfChangeOpen = ref(false)
const listType = ref(1)
const tabList = ref([
  {
    label: '已接入用户',
    value: 1,
  },
  {
    label: '待接入用户',
    value: 2,

  }
])
const uploadImageUrl = ref('')
const themeStore = useThemeStore()
const msgStore = useChatMsgStore()
const userInfoStore = useUserInfoStore()
const router = useRouter()
const showToast = useToast()
const page = ref(1)
let recordIndex = 0
const showLeft = ref(false)
const showRight = ref(false)
const groupChat = ref()
const msgRecord = ref([])
const onlineKfList = ref([])
const replyContentList = ref([])
const replyType = ref(2) // 1编辑 2删除
const targetId = ref() // == 2 私聊 1 群聊
const currentSelectTarget = ref()
const msgContent = ref('')
const chatShowAreaRef = ref()
const isLoading = ref(false)
const isComplete = ref(false)
const onlineCount = ref(0)
const privateChatList = ref([])
const userSearchValue = ref('')
const currentNewMsgCount = ref(0)
const isEmojiVisible = ref(false)
const emojiPosition = ref()
const msgInputRef = ref()
const videoInfo = reactive({
  videoVisible: false,
  videoTargetInfo: null,
  videoIsSend: false,
  videoIsOnlyAudio: false,
})
const fileInfo = reactive({
  fileVisible: false,
  fileTargetInfo: null,
  fileIsSend: false,
  file: null,
})
const fileInput = ref()
const modifyUserInfoIsOpen = ref(false)
const isSendLoading = ref(false)
let chatRecordLoadingTimer = null
const isChatRecordLoading = ref(false)

msgStore.$subscribe(() => {
  const { scrollTop, clientHeight, scrollHeight } = chatShowAreaRef.value
  const isBottom = scrollTop + clientHeight >= scrollHeight - 1
  if (isBottom) {
    scrollToBottom()
  }
})

const handleScroll = () => {

  if (chatShowAreaRef.value) {
    //最底部更新currentNewMsgCount为0
    const { scrollTop, clientHeight, scrollHeight } = chatShowAreaRef.value
    const isBottom = scrollTop + clientHeight >= scrollHeight - 1
    if (isBottom) currentNewMsgCount.value = 0
    if (chatShowAreaRef.value.scrollTop === 0 && !isLoading.value) {
      page.value++
      onGetMsgRecord()
    }
  }
}
const overChat = () => {
  let overChatParams = {
    "action": "KfOverChat",
    "params": {
      "user-uuid": currentSelectTarget.value.user.uuId,
      "uuid": userInfoStore.uuid,
    }
  }

  ws.send(JSON.stringify(overChatParams))
  msgRecord.value = []
  targetId.value = ''
  currentSelectTarget.value = null;
  onGetPrivateChatList()

}
const kfListStatus = ref(0)
const langActive = ref(-1)
const otherKfUuid = ref('')

const handleClickChangeKf = async () => {
  if (kfListStatus.value == 1) {
    return
  }
  kfListStatus.value = 1
  try {
    const { data, code } = await ChatListApi.kfUserList({ page: 1, page_size: 10 })
    if (code == 200) {
      onlineKfList.value = data.rows
      if (data.rows && data.rows.length > 0) {
        kfChangeOpen.value = !kfChangeOpen.value

      } else {
        showToast('暂无其他客服在线~', true)
      }
      kfListStatus.value = 2

    }
  } catch {
    kfListStatus.value = 3

  } finally {
    kfListStatus.value = 2

  }



}
const handleClickChangeLangItem = (index) => {
  langActive.value = index
  langVisible.value = false
}
// 点击对应客服 将用户切换至该客服
const handleClickChangeKfItem = async (index) => {
  let itemKfUuid = onlineKfList.value[index].kfId
  console.log(onlineKfList.value[index], 'onlineKfList.value[index]')
  try {
    otherKfUuid.value = itemKfUuid

  } catch (error) {
    console.log(error)
    otherKfUuid.value = ''
  }

}
// 拉黑用户
const handleClickShield = () => {
  let shieldParams = {
    "action": "KfShieldUser",
    "params": {
      "user-uuid": currentSelectTarget.value.user.uuId,
      "uuid": userInfoStore.uuid,
    }
  }
  ws.send(JSON.stringify(shieldParams))
  setTimeout(() => {
    onGetPrivateChatList()
    showToast('拉黑成功~', false)
  }, 300)
}

const onchangeOk = async () => {
  let changeKfParams = {
    "action": "KfChangeKf",
    "params": {
      "user-uuid": currentSelectTarget.value.user.uuId,
      "uuid": userInfoStore.uuid,
      "changeKfId": otherKfUuid.value,
      "listType": listType.value
    }


  }
  ws.send(JSON.stringify(changeKfParams))
  setTimeout(() => {
    showToast('切换成功~', false)
    onReadChatList()

    kfChangeOpen.value = false
  }, 300)
}
const handlerSendFile = async (event) => {
  const files = event.target.files
  console.log(files)
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append('file', files[0]);
    const { data,code } = await FileApi.invite(formData)
    if(code != 200){
      showToast('文件上传失败~', true)

      return 
    }
    if(!data.url){
      showToast('文件上传失败~', true)
      return
    }
    uploadImageUrl.value = data.url || ''
    let sendParams = {
      "action": "KfSendMsg",
      "params": {
        "user-uuid": currentSelectTarget.value.user.uuId,
        "uuId": userInfoStore.uuid,
        "msg": `<img src=${uploadImageUrl.value} />`
      }
    }
    ws.send(JSON.stringify(sendParams))
    let msgRecordItem = {
      msg: `<img src="${uploadImageUrl.value}"/>`,
      kfUser: {
        uuid: userInfoStore.uuid,
        nickname: userInfoStore.nickname,
      },
      isKf: true,
      user: currentSelectTarget.value,
    }
    msgRecord.value.push(msgRecordItem)

    event.target.value = ''
  } else {
    showToast('文件不正确~', true)
  }
}
const fetchUserKfQuickReplyGrid = async () => {
  try{
const { data, code } = await ChatListApi.userKfQuickReplyGrid({ pageIndex: 1, pageSize: 200 })
  console.log(data)
  if (code == 200) {
    replyContentList.value = data.rows || []
  } else {
    replyContentList.value = []
  }
  }catch (error) {
    console.error('获取快捷回复失败:', error)
    replyContentList.value = []
  }
  
}
const handlerVideoCall = (info, isSend, isOnlyAudio) => {
  if (!info) return
  VideoApi.invite({ userId: info.id, isOnlyAudio: isOnlyAudio })
  videoInfo.videoVisible = true
  videoInfo.videoTargetInfo = info
  videoInfo.videoIsSend = isSend
  videoInfo.videoIsOnlyAudio = isOnlyAudio
}

const userList = computed(() => {
  const values = Array.from(msgStore.userListMap.values())
  if (userSearchValue.value) {
    return values.filter((item) => item.name.includes(userSearchValue.value))
  } else {
    return values
  }
})

const userListAll = computed(() => {
  const values = []
  for (const [, value] of msgStore.userListMap) {
    values.push({ name: value.name, id: value.id, type: value.type })
  }
  return values
})

const handlerSetEmojiBoxPosition = (e) => {
  const rect = e.target.getBoundingClientRect()
  emojiPosition.value = { top: rect.top, left: rect.left }
  isEmojiVisible.value = !isEmojiVisible.value
}
const handlerCopy = () => {
  navigator.clipboard.writeText(translatedText.value)
  showToast('复制成功')
}
const handleClickTranslate = async () => {
  if (langActive.value == -1) {
    showToast('请选择要翻译成的语言~', false)
    return
  }
  if (translateStatus.value == 1) {
    return
  }
  translateStatus.value = '1'
  translatedText.value = ''

  const params = new URLSearchParams({
    type: 2,
    text: `翻译为${languageList[langActive.value].label}：${translateText.value}`

  });

await fetch(`${import.meta.env.VITE_HTTP_URL}kfapi/chat/translate?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('x-token')}`,
      'Accept': 'text/event-stream'
    },

  }).then(async(response) => {
    console.log(response,)
    const reader = response.body.getReader()
  const decoder = new TextDecoder();

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      translateStatus.value = '2'
      break
    }

    buffer += decoder.decode(value, { stream: true });
    
    // 更健壮的SSE数据处理
    let lastIndex = 0;
    while ((lastIndex = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, lastIndex);
      buffer = buffer.slice(lastIndex + 2);
      
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const content = line.slice(6);
          try {
            const parsed = JSON.parse(content);
            // 实时更新DOM
            translatedText.value += parsed.data.choices?.[0]?.delta?.content || '';
          } catch(e) {
            console.error('SSE解析错误:', e);
          }
        }
      }
    }
  }

  // 处理剩余数据
  if (buffer.trim()) {
    translatedText.value += buffer;
  }

  translateStatus.value = '0'
  })
  
}
const handlerOnEmoji = (emoji, type) => {
  isEmojiVisible.value = false
  if (type === 'text') {
    nextTick(() => {
      msgInputRef.value.insertInputText(emoji)
    })
  } else {
    //图片链接
    let msg = {
      content: emoji,
      type: 'emoji',
    }
    onSendMsg(msg)
  }
}

//接收到消息
const handlerReceiveMsg = async (data) => {
  await handlerUpdateChatList(data).then((ty) => {
    console.log(ty, 'ty')
    // 是否为当前聊天对象
    if (ty == 2) {
      const { scrollTop, clientHeight, scrollHeight } = chatShowAreaRef.value
      const isBottom = scrollTop + clientHeight >= scrollHeight - 1
      msgRecord.value.push(data)
      recordIndex++
      //是否在最底部
      if (isBottom) {
        scrollToBottom()
      } else {
        currentNewMsgCount.value = currentNewMsgCount.value + 1
      }
    }
  })
  // if (currentSelectTarget?.value.user?.uuId != data.user.uuid) {
  //   onGetPrivateChatList(true)
  //   return
  // }



}

//更新聊天列表信息
const handlerUpdateChatList = (message) => {
  return new Promise((resolve, reject) => {
    if (message.fromId === '1' || message.toId === '1') {
      groupChat.value.unreadCount = groupChat.value.unreadCount + 1
      groupChat.value.lastMessage = message
      return
    }
    try {
      let i = 0
      let ty = 0
      while (i < privateChatList.value.length) {
        // 获取当前遍历到的聊天对象
        let chat = privateChatList.value[i]
        // 检查传入的消息是否在消息列表里面 是的话就不用刷新列表
        if (chat.user.uuId == message.user.uuId) {
          chat.unreadCount = chat.unreadCount || 0 + 1
          chat.lastMessage = message.msg
          ty = 1
          if (chat.user.uuId == currentSelectTarget.value.user.uuId) {
            ty = 2
          }
          resolve(ty)
          break
        }
        i++
      }
      if (i >= privateChatList.value.length) {
        onGetPrivateChatList(true)
      }
    } catch (e) {
      console.log(e)
      reject(e)
    }
    resolve(0)

  })


}
// 播放提示音
function playAudio() {
  // const sound = new Audio('https://img.adyinqing.com/y1115.mp3');
  const sound = new Audio('@/assets/prompt_sound.MP3')
  sound.play();
  // 播放后销毁
  sound.onended = function () {
    sound.remove();
  };

}
//接收到通知
const handlerReceiveNotify = (data) => {
  console.log(data, 'handlerReceiveNotify')
  // let user = msgStore.userListMap.get(data.content.id)
  // if (!user) {
  //   user = data.content
  //   msgStore.userListMap.set(user.id, user)
  // }
  // switch (data.type) {
  //   case 'web-online':
  //     if (!user.status) {
  //       user.status = ['web']
  //       handlerUserListSort()
  //     } else if (!user.status.includes('web')) {
  //       user.status = [...user.status, 'web']
  //       handlerUserListSort()
  //     }
  //     break
  //   case 'web-offline':
  //     if (user.status) {
  //       user.status = user.status.filter((status) => status !== 'web')
  //       handlerUserListSort()
  //     }
  //     break
  // }
  userInfoStore.setUuid({
    uuid: data.uuId,
    nickname: data.nickname
  })
}

const handlerVideoMsg = async (msg) => {
  if (msg.fromId === userInfoStore.userId) return
  if (msg.type === 'invite') {
    const targetInfo = msgStore.userListMap.get(msg.fromId)
    videoInfo.videoVisible = true
    videoInfo.videoTargetInfo = targetInfo
    videoInfo.videoIsSend = false
    videoInfo.videoIsOnlyAudio = msg.isOnlyAudio
  }
}

const handlerFileMsg = async (msg) => {
  if (msg.fromId === userInfoStore.userId) return
  if (msg.type === 'invite') {
    const targetInfo = msgStore.userListMap.get(msg.fromId)
    fileInfo.fileVisible = true
    fileInfo.fileTargetInfo = targetInfo
    fileInfo.fileIsSend = false
    fileInfo.file = msg.fileInfo
  }
}
const reloadList = () => {
  console.log('正在刷新列表')
  onGetPrivateChatList()

}
const onShowToast = (data)=>{
  console.log(data)
  showToast(data)

}
onMounted(async () => {
  EventBus.on('on-receive-msg', handlerReceiveMsg)
  EventBus.on('on-show-toast', onShowToast)

  EventBus.on('on-reload-list', reloadList)
  EventBus.on('on-receive-video', handlerVideoMsg)
  EventBus.on('on-receive-file', handlerFileMsg)
  ws.connect(sessionStorage.getItem('x-token'))

  if (chatShowAreaRef.value) {
    chatShowAreaRef.value.addEventListener('scroll', handleScroll)
  }
  // onGetGroupChat()
  onGetPrivateChatList()
  // await onGetUserListMap()
  // await onGetOnlineWeb()
  EventBus.on('on-receive-notify', handlerReceiveNotify)
  fetchUserKfQuickReplyGrid()
  handlerUserListSort()
})

onUnmounted(() => {
  EventBus.off('on-receive-msg', handlerReceiveMsg)
  EventBus.off('on-reload-list', onGetPrivateChatList)
  EventBus.off('on-show-toast', onShowToast)

  EventBus.off('on-receive-notify', handlerReceiveNotify)
  EventBus.off('on-receive-file', handlerFileMsg)
  EventBus.off('on-receive-video', handlerVideoMsg)
})

const scrollToBottom = () => {
  if (chatShowAreaRef.value) {
    nextTick(() => (chatShowAreaRef.value.scrollTop = chatShowAreaRef.value.scrollHeight))
  }
}
const remark = ref('')
const setReamrkIndex = ref()
const handleClickSetRemake = (index) => {
  isOpen.value = true;
  setReamrkIndex.value = index;
}
const onOk = () => {
  privateChatList.value[setReamrkIndex.value].remark = remark.value;
  privateChatList.value[setReamrkIndex.value].user.nickname = `${privateChatList.value[setReamrkIndex.value].user.nickname}(${remark.value})`
  remark.value = ''
  isOpen.value = false;
  setReamrkIndex.value = null
}

const onReplyOk = async () => {
  if (replyForm.value.type == 3) {
    replyForm.value.reply = ''
    const { data, code, message } = await ChatListApi.userKfQuickReplyDel(replyForm.value)
    if (code == 200) {
      showToast('删除快捷语成功~', true)
      fetchUserKfQuickReplyGrid();
      return
    } else {
      showToast(message, true)
      return

    }

  }
  if (!replyForm.value.reply) {
    showToast('请输入快捷语~', true)
    return
  }
  if (replyForm.value.type == 1) {
    const { data, code, message } = await ChatListApi.userKfQuickReplyAdd(replyForm.value)
    if (code == 200) {
      showToast('添加快捷语成功~', true)
    } else {
      showToast(message, true)
    }
  } else if (replyForm.value.type == 2) {
    const { data, code, message } = await ChatListApi.userKfQuickReplyUpdate(replyForm.value)
    if (code == 200) {
      showToast('编辑快捷语成功~', true)

    } else {
      showToast(message, true)
    }
  }
  fetchUserKfQuickReplyGrid();
  isReplyOpen.value = false
}

const handleClickQuickReply = (item) => {

  let sendParams = {
    "action": "KfSendMsg",
    "params": {
      "user-uuid": currentSelectTarget.value.user.uuId,
      "uuId": userInfoStore.uuid,
      "msg": item.reply
    }
  }
  console.log(currentSelectTarget.value, 'currentSelectTarget.value', sendParams)
  ws.send(JSON.stringify(sendParams))
  let msgRecordItem = {
    msg: item.reply,
    kfUser: {
      uuid: userInfoStore.uuid,
      nickname: userInfoStore.nickname,
    },
    isKf: true,
    user: currentSelectTarget.value,
  }
  msgRecord.value.push(msgRecordItem)
  scrollToBottom()
}
//获取聊天记录
const onGetMsgRecord = () => {
  if (isLoading.value || isComplete.value || !targetId.value) return
  isLoading.value = true

  const container = chatShowAreaRef.value
  const scrollTopBeforeLoad = container ? container.scrollTop : 0
  const scrollHeightBeforeLoad = container ? container.scrollHeight : 0

  MessageApi.record({ 'channel': currentSelectTarget.value.user.channel, 'user-uuid': currentSelectTarget.value.user.uuId, page: page.value, page_size: 20, })
    .then((res) => {
      if (res.code === 200) {

        if (!res.data.rows) {
          isComplete.value = true;
          showToast('暂无更多聊天记录', true)
          return
        }
        const newMessages = res.data.rows.map((e) => {
          let user = {
            uuid: e.userUuid,
            nickname: e.userNickname,
            channel: e.userChannel,
            avatar: e.userAvatar
          }
          return {
            ...e,
            user: user,
            isKf: e.chatType == 1, //发送类型 1客服发送 2用户发送
            kfUser: {
              uuid: userInfoStore.uuid,
              nickname: userInfoStore.nickname,
              avatar: userInfoStore.avatar

            },
          }
        })
        if (newMessages.length > 0) {
          msgRecord.value = [...newMessages.reverse(), ...msgRecord.value]
          console.log(msgRecord.value, 'msgRecord')
          recordIndex += newMessages.length
          nextTick(() => {
            if (recordIndex === newMessages.length) {
              scrollToBottom()
            } else {
              requestAnimationFrame(() => {
                if (container) {
                  const scrollHeightAfterLoad = container.scrollHeight
                  container.scrollTop =
                    scrollTopBeforeLoad + (scrollHeightAfterLoad - scrollHeightBeforeLoad)
                }
              })
            }
          })
        } else {
          isComplete.value = true
        }
      }
    })
    .finally(() => {
      isLoading.value = false
      if (chatRecordLoadingTimer) {
        clearTimeout(chatRecordLoadingTimer)
        chatRecordLoadingTimer = null
      }
    })
}

//已读会话
const onReadChatList = (id) => {
  console.log(id, 'test')
  if (!id) {
    return
  }
  let readParams = {
    "action": "KfReadMsg",
    "params": {
      "user-uuid": id,
      "uuid": userInfoStore.uuid
    }
  }
  ws.send(JSON.stringify(readParams))


}

watch(
  targetId,
  (newValue, oldValue) => {
    msgContent.value = ''
    recordIndex = 0
    msgRecord.value = []
    isComplete.value = false
    isLoading.value = false
    isChatRecordLoading.value = false
    chatRecordLoadingTimer = setTimeout(() => {
      isChatRecordLoading.value = true
    }, 100)
    onGetMsgRecord()
    onReadChatList(newValue)
  },
  { immediate: true },
)

const closeMask = () => {
  showLeft.value = false
  showRight.value = false
}

//退出登录
const handlerLogout = () => {
  sessionStorage.removeItem('x-token')
  userInfoStore.clearUserInfo()
  ws.disConnect()
  router.push('/login')
}

//获取群聊
const onGetGroupChat = () => {
  ChatListApi.group().then((res) => {
    if (res.code === 0) {
      groupChat.value = res.data
    }
  })
}

const handlerSubmitMsg = () => {
  if (!msgContent.value.toString().trim()) return
  let msg = {
    content: JSON.stringify(msgInputRef.value.getNodeList()),
    type: MessageType.Text,
  }
  console.log(msgContent, msg, msgInputRef.value.getNodeList(), 'ffff')
  onSendMsg(msg)

}


//发送消息
const onSendMsg = (msg) => {
  // const time = setTimeout(() => {
  //   isSendLoading.value = true
  //   scrollToBottom()
  // }, 300)
  let str = msgInputRef.value.getNodeList().map((e) => {
    if (e.type == 'text') {
      return e.content
    }
    return ''
  })
  let sendParams = {
    "action": "KfSendMsg",
    "params": {
      "user-uuid": currentSelectTarget.value.user.uuId,
      "uuId": userInfoStore.uuid,
      "msg": str.join('')
    }
  }
  console.log(currentSelectTarget.value, 'currentSelectTarget.value', sendParams)
  ws.send(JSON.stringify(sendParams))
  let msgRecordItem = {
    msg: str.join(''),
    kfUser: {
      uuid: userInfoStore.uuid,
      nickname: userInfoStore.nickname,
    },
    isKf: true,
    user: currentSelectTarget.value,
  }
  msgRecord.value.push(msgRecordItem)

  // MessageApi.send({
  //   targetId: targetId.value,
  //   source: targetId.value === '1' ? MessageSource.Group : MessageSource.User,
  //   msgContent: msg.content,
  //   referenceMsgId: msgStore.referenceMsg?.id,
  //   type: msg.type,
  // })
  //   .then((res) => {
  //     if (res.code === 0) {
  //       msgRecord.value.push(res.data)
  //       recordIndex++
  //       scrollToBottom()
  //     }
  //   })
  //   .finally(() => {
  //     isSendLoading.value = false
  //     clearTimeout(time)
  //   })
   // 添加置顶逻辑
  if (targetId.value && privateChatList.value.length > 0) {
    const currentIndex = privateChatList.value.findIndex(item => item.user.uuId === targetId.value)
    if (currentIndex > 0) {
      // 如果当前聊天不在第一位，则将其移动到顶部
      const currentChat = privateChatList.value.splice(currentIndex, 1)[0]
      currentChat.lastMessage = str.join('') || {}
      privateChatList.value.unshift(currentChat)
    }
  }
  
  msgContent.value = ''
  msgStore.referenceMsg = null
}

//删除私聊列表内容
const onDeleteChatList = (id) => {
  ChatListApi.delete({ chatListId: id }).then((res) => {
    if (res.code === 0) {
      onGetPrivateChatList()
    }
  })
}

//获取用户列表
const onGetUserListMap = async () => {
  await UserApi.listMap().then((res) => {
    if (res.code === 0) {
      msgStore.setUserListMap(new Map(Object.entries(res.data)))
    }
  })
}

//获取web在线人员
const onGetOnlineWeb = async () => {
  await UserApi.onlineWeb().then((res) => {
    if (res.code === 0) {
      const onlineWeb = res.data
      for (let i = 0; i < onlineWeb?.length; i++) {
        const user = msgStore.userListMap.get(onlineWeb[i])
        user.status = Array.isArray(user.status) ? [...user.status, 'web'] : ['web']
      }
    }
  })
}

//排序
const handlerUserListSort = () => {
  const sortedEntries = [...msgStore.userListMap.entries()].sort(([, a], [, b]) => {
    if (a?.type === UserType.Bot && b?.type !== UserType.Bot) return -1
    if (b?.type === UserType.Bot && a?.type !== UserType.Bot) return 1
    const aStatus = a?.status || []
    const bStatus = b?.status || []
    const aStatusEmpty = aStatus.length === 0
    const bStatusEmpty = bStatus.length === 0
    if (aStatusEmpty && !bStatusEmpty) return 1
    if (!aStatusEmpty && bStatusEmpty) return -1
    return 0
  })
  msgStore.userListMap = new Map(sortedEntries)
  let onlineNum = 0
  for (let [, value] of msgStore.userListMap) {
    if (value.type === UserType.Bot) {
      continue
    }
    if (value?.status?.length > 0) {
      onlineNum++
    } else {
      break
    }
  }
  onlineCount.value = onlineNum
}

//接受到已撤回的消息
const handlerReceiveRecallMsg = (msg) => {
  for (let i = msgRecord.value.length - 1; i >= 0; i--) {
    if (msgRecord.value[i].id === msg.id) {
      msgRecord.value[i].type = msg.type
      msgRecord.value[i].message = msg.message
      break
    }
  }
}
const listStatus = ref(1) // 1加载中 2 成功 3 失败
// tab切换
const handleClickType = (e) => {
  listType.value = e.value
  privateChatList.value = [];
  currentSelectTarget.value = null
  targetId.value = null
  onGetPrivateChatList()
}
const listLoading = ref(false)
const handleClickListItem = (item) => {
  if(isLoading.value) return
  page.value = 1
  listLoading.value = true
  try{
if (item.unreadCount) {
    item.unreadCount = 0
  }
  if (listType.value == 1) {
    targetId.value = item.user.uuId
    currentSelectTarget.value = item
    closeMask()
  } else {
    let cutInParams = {
      "action": "KfCutIn",
      "params": {
        "user-uuid": item.user.uuId,
        "uuid": userInfoStore.uuid
      }
    }
    ws.send(JSON.stringify(cutInParams))
    handleClickType({ value: 1 })
  }
  listLoading.value = false

  }catch(error){
    console.log(error,'error')
  listLoading.value = false

  }finally{
    listLoading.value = false
  }
  
  listLoading.value = false
}

//获取私聊列表
const onGetPrivateChatList = async (onlyReloadList = false) => {
  listStatus.value = 1
  try {
    await ChatListApi.privateList({ type: listType.value }).then((res) => {
      if (res.code == 200) {
        if (onlyReloadList) {
          privateChatList.value = res.data.rows.map((e) => {
            return {
              ...e,
              lastMessage: e.msg
            }
          }) || []
          listStatus.value = 2
          return
        }
        privateChatList.value = res.data.rows.map((e) => {
          return {
            ...e,
            lastMessage: e.msg
          }
        }) || []
        console.log(privateChatList.value)
        if (res.data.rows && res.data.rows.length) {
          targetId.value = privateChatList.value[0]?.user.uuId
          currentSelectTarget.value = privateChatList.value[0]
        } else {
          msgRecord.value = [];
          targetId.value = ''
          currentSelectTarget.value = null
          listStatus.value = 3
          return
        }
        listStatus.value = 2
      }
    })
  } catch {
    listStatus.value = 3
  }

}

//创建私聊
const onCreatePrivateChat = (id) => {
  ChatListApi.create({ targetId: id }).then(async (res) => {
    if (res.code === 0) {
      currentSelectTarget.value = res.data
      await onGetPrivateChatList()
      targetId.value = id
    }
  })
}
</script>

<style lang="less" scoped>
.chat-container {
  width: 100%;
  height: 100%;
  position: absolute;
  background: var(--screen-bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .chat-bg {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-image: var(--scrren-grid-bg-color);
    background-size: 50px 50px;
  }

  .mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    z-index: 10;
  }

  .chat-box {
    width: 80%;
    height: 90%;
    display: flex;
    position: relative;
    min-width: 0;

    @media screen and (max-width: 900px) {
      width: 95%;
      height: 95%;
    }

    .box-left {
      width: 280px;
      min-width: 280px;
      background-color: rgba(var(--background-color), 0.5);
      backdrop-filter: blur(8px);
      margin-right: 5px;
      border-radius: 5px;
      border: rgba(var(--background-color), 0.5) 3px solid;
      display: flex;
      flex-direction: column;
      padding: 0 10px;

      @media screen and (max-width: 900px) {
        position: fixed;
        left: -280px;
        top: 0;
        bottom: 0;
        margin: 0;
        z-index: 11;
        transition: all 0.3s;
        background-color: rgba(var(--background-color), 0.9);

        &.show-left {
          left: 0;
        }
      }

      .vcard {
        cursor: pointer;
        height: 60px;
        border-radius: 5px;
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
      }

      .chat-list-title {
        color: rgb(var(--text-color));
        height: 60px;
        min-height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        line-height: 18px;
        font-weight: 600;
        user-select: none;

        @media screen and (max-width: 900px) {
          justify-content: space-between;
        }
      }

      .chat-list-item {
        height: 60px;
        margin-bottom: 5px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        padding: 10px;
        cursor: pointer;
        user-select: none;

        .chat-item-content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
          overflow: hidden;

          .chat-content-name {
            font-size: 14px;
            color: white;
          }

          .chat-content-msg {
            width: 100%;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        &.blue {
          background-color: rgb(var(--primary-color));

          &:hover {
            background-color: rgba(var(--primary-color), 0.7);
          }
        }

        &.black {
          background-image: url('/group-bg.png');
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center;
        }

        &.white {
          background-color: rgba(var(--background-color), 0.5);

          .chat-item-content {
            .chat-content-name {
              color: rgb(var(--text-color));
            }

            .chat-content-msg {
              color: rgba(var(--text-color), 0.6);
            }
          }

          &:hover {
            background-color: rgba(var(--background-color), 0.8);
          }
        }
      }
    }

    .chat-list-content {
      flex: 1;
      overflow-y: scroll;
      padding-right: 5px;
      margin-right: -10px;
      margin-bottom: 20px;
    }

    .box-middle {
      min-width: 300px;
      flex: 1;
      margin-right: 5px;
      border-radius: 5px;
      display: flex;
      flex-direction: column;

      @media screen and (max-width: 900px) {
        margin: 0;
      }

      .middle-top {
        height: 60px;
        min-height: 60px;
        background-color: rgba(var(--background-color), 0.5);
        backdrop-filter: blur(8px);
        margin-bottom: 5px;
        border-radius: 5px;
        border: rgba(var(--background-color), 0.5) 3px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 15px;
        font-size: 18px;
        font-weight: 600;
        user-select: none;
        color: rgb(var(--text-color));

        .menu-btn {
          cursor: pointer;
          font-size: 24px;
        }

        @media screen and (max-width: 900px) {
          justify-content: space-between;
        }

        @media screen and (min-width: 900px) {
          .menu-btn {
            display: none;
          }
        }
      }

      .middle-content {
        flex: 1;
        min-height: 300px;
        border-radius: 5px;
        background-image: linear-gradient(130deg,
            rgba(var(--background-color), 0.3),
            rgba(var(--background-color), 0.5));
        backdrop-filter: blur(10px);
        border: rgba(var(--background-color), 0.5) 3px solid;
        display: flex;
        flex-direction: column;

        .chat-show-area {
          flex: 1;
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow-y: scroll;

          .msg-item {
            display: flex;
          }

          .new-msg-count {
            position: fixed;
            right: 15px;
            bottom: 80px;
            padding: 4px 15px;
            border-radius: 20px;
            background-color: rgba(var(--background-color), 0.8);
            backdrop-filter: blur(10px);
            color: rgba(var(--primary-color));
            font-size: 14px;
            user-select: none;
            border: rgba(var(--background-color)) 2px solid;
            font-weight: 600;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
          }
        }

        .chat-input-area {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 10px;
          margin: 15px 0;

          .chat-input {
            width: 80%;
            background-color: rgba(var(--background-color));
            border-radius: 10px;
            overflow: hidden;
            padding: 10px;
            display: flex;
            flex-direction: column;

            .chat-msg-input {
              flex: 1;
              width: 0;
            }

            .emoji-button {
              width: 28px;
              height: 28px;
              user-select: none;
              cursor: pointer;
              display: flex;
              justify-content: center;
              align-items: center;
              color: rgba(var(--text-color), 0.5);
              flex-shrink: 1;
            }

            .reference-msg {
              font-size: 14px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              background-color: rgba(var(--text-color), 0.1);
              color: rgba(var(--text-color), 0.9);
              border-radius: 5px;
              padding: 5px 10px;
              margin-bottom: 5px;
              user-select: none;

              .reference-msg-content {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                word-break: break-word;
              }
            }
          }

          .publish-button {
            height: 55px;
            width: 55px;
            border-radius: 50px;
            background-color: rgb(var(--primary-color));
            border: rgba(var(--background-color), 0.5) 2px solid;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #ffffff;
            cursor: pointer;
            margin-left: 10px;
          }
        }
      }
    }

    .box-right {
      width: 280px;
      min-width: 280px;
      border-radius: 5px;
      display: flex;
      flex-direction: column;

      @media screen and (max-width: 900px) {
        position: fixed;
        right: -280px;
        top: 0;
        bottom: 0;
        margin: 0;
        z-index: 11;
        transition: all 0.3s;

        &.show-right {
          right: 0;
        }

        .right-top {
          background-color: rgba(var(--background-color), 0.9) !important;
        }

        .right-content {
          background-color: rgba(var(--background-color), 0.9) !important;
        }
      }

      .right-top {
        height: 60px;
        min-height: 60px;
        background-color: rgba(var(--background-color), 0.5);
        backdrop-filter: blur(8px);
        margin-bottom: 5px;
        border-radius: 5px;
        border: rgba(var(--background-color), 0.5) 3px solid;
        display: flex;
        align-items: center;
        padding: 5px 5px 5px 18px;
        user-select: none;
        justify-content: space-between;

        .user-name {
          font-size: 16px;
          font-weight: 600;
          color: rgb(var(--text-color));
        }

        .user-operate {
          font-size: 14px;
          font-weight: 600;
          color: rgb(var(--primary-color));
          cursor: pointer;
        }
      }

      .right-content {
        flex: 1;
        min-height: 300px;
        background-color: rgba(var(--background-color), 0.5);
        backdrop-filter: blur(8px);
        border-radius: 5px;
        border: rgba(var(--background-color), 0.5) 3px solid;
        padding: 5px;
        display: flex;
        flex-direction: column;

        .btn-box {
          padding: 12px 12px 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 28px;
          margin-bottom: 20px;

          .btn {
            color: rgb(var(--text-color));
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 5px;
            white-space: nowrap;
            border: 1px solid rgba(var(--minor-color), 0.9);
          }
        }

        .reply-content {
          width: 100%;
          min-height: 300px;
          color: rgb(var(--text-color));
          max-height: 300px;

          .reply-title {
            display: flex;
            justify-content: space-between;

            .icon-box {
              display: flex;
              align-items: center;
              gap: 5px;

              img {
                width: 20px;
                height: 20px;
              }

              .add {
                width: 16px;
                height: 16px;
              }
            }

          }

          .reply-content-box {
            color: rgb(var(--text-color));
            display: flex;
            flex-direction: column;
            padding: 12px 12px 0;
            gap: 16px;
            max-height: 265px;
            height: 265px;
            min-height: 265px;
            overflow-y: auto;

            // 隐藏滚动条
            &::-webkit-scrollbar {
              display: none;
            }

            .reply-content-item {
              padding: 6px 12px;
              cursor: pointer;
              border-radius: 5px;
              white-space: nowrap;
              border: 1px solid rgba(var(--minor-color), 0.9);
              display: flex;
              align-items: center;
              justify-content: space-between;
              position: relative;

              .reply-content-item-left {
                .reply-content-item-left-content {
                  white-space: wrap;
                }
              }

              .icon-box {
                img {
                  width: 20px;
                  height: 20px;
                }

                .del-icon {
                  position: absolute;
                  right: -10px;
                  top: -10px;
                  width: 16px;
                  height: 16px;
                  color: #3333
                }
              }
            }
          }
        }

        .translate-content {
          width: 100%;
          min-height: 300px;
          max-height: 300px;
          color: rgb(var(--text-color));
          display: flex;
          gap: 8px;
          flex-direction: column;

          .translate-text-content {
            display: flex;
            gap: 6px;
          }

          .translate-title {
            justify-content: space-between;

            .pick-lang {
              padding: 4px;
              border-radius: 5px;
              border: 1px solid rgb(var(--minor-color))
            }
          }

          .translate-input {
            .translate-textarea {
              width: 100%;
              padding: 8px;
              color: rgb(var(--text-color));
              border: 1px solid rgb(var(--minor-color))
            }
          }

          .translate-btn {
            padding: 6px 12px;
            color: rgb(var(--text-color));
            border-radius: 5px;
            white-space: nowrap;
            border: 1px solid rgba(var(--minor-color), 0.9);
            cursor: pointer;
            text-align: center;
          }
        }

        .online-list {
          overflow-y: scroll;
          padding-right: 5px;
          margin-right: -5px;
          flex: 1;

          .online-list-item {
            height: 50px;
            border-radius: 5px;
            background-image: linear-gradient(to right,
                rgba(var(--minor-color), 0.2),
                rgba(var(--minor-color), 0));
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;

            .online-item-content {
              display: flex;
              align-items: center;

              .online-username {
                max-width: 100px;
                margin-left: 10px;
                font-weight: 600;
                color: rgb(var(--text-color));
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .online-status {
                position: absolute;
                width: 12px;
                height: 12px;
                border-radius: 10px;
                right: 0;
                bottom: 0;
                background-color: rgb(var(--primary-color));
                border: #ffffff 2px solid;
              }
            }

            .online-item-operation {
              align-items: center;
              opacity: 0;
              transition: opacity 0.5s ease;
              pointer-events: none;
            }

            &.odd {
              background-image: linear-gradient(to left,
                  rgba(var(--minor-color), 0.2),
                  rgba(var(--minor-color), 0));
            }

            &:hover {
              .online-item-operation {
                opacity: 1;
                pointer-events: auto;
              }
            }

            @media screen and (max-width: 900px) {
              .online-item-operation {
                opacity: 1;
                pointer-events: auto;
              }
            }
          }
        }
      }
    }
  }

  .close-btn {
    cursor: pointer;
    font-size: 24px;
    padding: 0 10px;

    @media screen and (min-width: 900px) {
      display: none;
    }
  }
}

.modal-box {
  width: 300px;
  // height: 200px;
  padding: 12px;
  background: #fff;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  .title {
    font-weight: bold;
  }

  .content {
    width: 200px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .label {
      width: 60px;
      white-space: nowrap;
    }

    .reply-textarea {
      border: 1px solid #7d7d7d87;
      padding: 8px;
      border-radius: 5px;

    }

    .online-kf-list {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .online-kf-item {
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        cursor: pointer;
        padding: 4px 12px;
        border-radius: 5px;
        //溢出显示...
        overflow: hidden;
        text-overflow: ellipsis;
        gap: 12px;
        width: 100%;
        text-align: center;

        border: 1px solid rgba(var(--minor-color), 0.5);

        &:hover {
          background-color: rgba(var(--primary-color), 0.7);

        }

        .online-kf-name {
          font-weight: bold;
        }
      }

      .active-item {
        background-color: rgba(var(--primary-color), 0.9);
        color: #fff;
      }
    }
  }
}

.tab-box {
  color: rgb(var(--text-color));
  width: 100%;
  display: flex;
  align-items: center;
  padding: 12px 0;
  justify-content: space-between;

  .tab-item {
    padding: 6px 12px;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
      background: rgba(var(--minor-color), 0.5);
    }

    &.active {
      background: rgba(var(--minor-color), 0.5);
    }
  }
}

.list-empty {
  text-align: center;
  margin-top: 12px;
  color: rgba(var(--text-color), .8);
}

.divider {
  margin: 12px 0;
  border-bottom: 1px solid #3333;
}
</style>
