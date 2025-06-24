// store/index.js
import { createStore } from 'vuex'  // 从 'vuex' 导入 createStore
import auth from './auth.module'
import agent from './agent.module'

export default createStore({      // 使用 createStore 创建 store
  modules: {
    auth,
    agent
  }
})