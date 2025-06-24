import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'  // 确保这行存在

const app = createApp(App)
app.use(router)
app.use(store)  // 必须要在 mount 之前调用
app.mount('#app')