// store/index.js
import { createStore } from 'vuex'  // 从 'vuex' 导入 createStore
import auth from './auth.module.js'
import agent from './agent.module.js'

export default createStore({      // 使用 createStore 创建 store
  modules: {
    auth,
    agent
  }
})