import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'  // 确保这行存在

const app = createApp(App)
app.use(router)
app.use(store)  // 必须要在 mount 之前调用

// 初始化认证状态
async function initializeAuth() {
  try {
    console.log('应用启动，初始化认证状态')
    const hasToken = localStorage.getItem('access_token') || localStorage.getItem('token')
    
    if (hasToken) {
      console.log('检测到token，尝试恢复用户会话')
      await store.dispatch('auth/loadUser')
      console.log('用户会话恢复成功')
    } else {
      console.log('未检测到token，用户未登录')
    }
  } catch (error) {
    console.error('初始化认证状态失败:', error)
    // 清除无效的认证信息
    store.dispatch('auth/logout')
  }
}

// 在挂载应用之前初始化认证状态
initializeAuth().then(() => {
  app.mount('#app')
})