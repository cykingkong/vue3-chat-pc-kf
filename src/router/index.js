import { createRouter, createWebHistory } from 'vue-router'
import Chat from '@/views/ChatPage.vue'
import Login from '@/views/LoginPage.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/',
      name: 'chat',
      component: Chat,
    },
  ],
})

router.beforeEach(async(to, from, next) => {
  let token = window.localStorage.getItem('x-token')
 console.log(token,'asdlkajs')
  // if (!token) {
  //   next({ path: '/login' })
  //   return
  // }
  if ((token && to.path === '/login') || !to.matched.length) {
    next({ path: '/' })
    return
  }
  next()
})

export default router
