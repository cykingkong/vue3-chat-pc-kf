<template>
  <div class="msg" :class="{ right: props.right }">
    <div
      class="msg-content"
      :class="{ right: props.right }"
      @mouseenter="showMenu"
      @mouseleave="hideMenu"
    >
      <div>
        <text-msg :msg="props.msg" :right="right" />
      </div>
      <div v-if="props.msg.type === MessageType.Emoji">
        <emoji-msg :src="props.msg.message" />
      </div>
      <div v-if="props.msg.type === MessageType.Call">
        <call-msg :msg="props.msg" :right="right" />
      </div>
      <!-- 翻译部分 -->
      <div class="translate-content" v-if="translatedShow  ">
        <LoadingDots v-if="translateStatus == '1'"></LoadingDots>
        {{ translatedText }}
      </div>  
    </div>

    <!--消息相关操作-->
    <transition name="fade">
      <div
        v-if="isShowMenu"
        class="msg-menu mr-[5px] ml-[5px]"
        @mouseenter="showMenu"
        @mouseleave="hideMenu"
      >
        <!-- <linyu-tooltip content="引用">
          <linyu-icon-button
            @click="handlerSetReference"
            size="24px"
            font-size="16px"
            icon="icon-yinyong"
          />
        </linyu-tooltip>
       -->
        <linyu-tooltip @click="handlerCopy" content="复制">
          <linyu-icon-button size="24px" font-size="16px" icon="icon-fuzhi" />
        </linyu-tooltip> 
        <linyu-tooltip content="翻译" @click="handleClickTranslate">
          <img src="@/assets/fy-icon.svg" class="fy-icon" alt="">
        </linyu-tooltip> 
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LinyuIconButton from '@/components/LinyuIconButton.vue'
import LinyuTooltip from '@/components/LinyuTooltip.vue'
import EmojiMsg from '@/components/Msg/MsgContent/EmojiMsg.vue'
import { MessageType } from '@/constant/messageType.js'
import TextMsg from '@/components/Msg/MsgContent/TextMsg.vue'
import CallMsg from '@/components/Msg/MsgContent/CallMsg.vue'
import LoadingDots from '@/components/LoadingDots.vue'

const translateStatus = ref('0')
const props = defineProps({
  msg: Object,
  right: { type: Boolean, default: false },
})

const isShowMenu = ref(false)
let hideTimeout = null

const showMenu = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  isShowMenu.value = true
}

const hideMenu = () => {
  hideTimeout = setTimeout(() => {
    isShowMenu.value = false
    clearTimeout(hideTimeout)
    hideTimeout = null
  }, 200)
}

const handlerCopy = () => {
  console.log(props.msg)
  // if (props.msg.type === MessageType.Text) {
  //   try {
  //     const texts = JSON.parse(props.msg?.message)
  //     texts.map((item) => {
  //       if (item.type === TextContentType.At) {
  //         msg += '@' + JSON.parse(item.content).name
  //       } else {
  //         msg += item.content
  //       }
  //     })
  //   } catch {
  //     msg = props.msg?.message
  //   }
  // }
  navigator.clipboard.writeText(props.msg.msg)
}
const translatedText = ref('')
const translatedShow =ref(false)
const handleClickTranslate = async () => {
  if (translateStatus.value == 1) {
    return
  }
  translateStatus.value = '1'
  translatedText.value = ''
  translatedShow.value = true
  const params = new URLSearchParams({
    type: 1,
    text: `翻译为中文：${props.msg.msg}`
  });
  const response = await fetch(`${import.meta.env.VITE_HTTP_URL}kfapi/chat/translate?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'text/event-stream'

    },

  })
  const reader = response.body.getReader()
  const decoder = new TextDecoder();

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      translateStatus.value = '2'
      break
    }
    
    buffer += decoder.decode(value, { stream: true })
    
    // 处理 SSE 格式数据
    const lines = buffer.split('\n\n')
    for (const line of lines.slice(0, -1)) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.replace('data: ', ''));
            if (eventData.data.choices?.[0]?.delta?.content) {
              translatedText.value += eventData.data.choices[0].delta.content;
            } else if (typeof eventData.data === 'string') {
              translateStatus.value = '0'; // 流式结束
            }
          } catch (e) {
            console.error('Parse error:', e, 'on data:', line);
          }
      }
    }
    buffer = lines[lines.length - 1]
  }
  
  // 处理剩余数据
  if (buffer) {
    const content = buffer.replace('data: ', '')
    translatedText.value += content
  }
  
  translateStatus.value = '0'
}
</script>

<style lang="less" scoped>
.msg {
  position: relative;
  width: 100%;
  display: flex;

  .msg-content {
    display: inline-block;
    word-break: break-word;
    max-width: 70%;
    background-color: white;
    padding: 8px;
    border-radius: 0 10px 10px 10px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;

    &.right {
      border-radius: 10px 0 10px 10px;
      background-color: rgb(var(--primary-color));
      color: white;
    }
  }

  .msg-menu {
    padding: 0 10px;
    height: 30px;
    border-radius: 10px;
    background-color: rgba(var(--background-color), 0.5);
    user-select: none;
    border: rgba(255, 255, 255, 0.8) 2px solid;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
  }

  &.right {
    justify-content: end;
    flex-direction: row-reverse;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fy-icon{
  width: 24px;
  height: 16px;
}
.translate-content{
  padding-top: 5px;
  margin-top: 5px;
  border-top: 1px solid #333;
}
</style>
