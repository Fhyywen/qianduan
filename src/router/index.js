import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

// 路由懒加载
const Home = () => import('@/views/Home.vue')
const Login = () => import('@/views/Auth/Login.vue')
const Register = () => import('@/views/Auth/Register.vue')
const AgentList = () => import('@/views/Agents/AgentList.vue')
const CreateAgent = () => import('@/views/Agents/CreateAgent.vue')
const AgentDetail = () => import('@/views/Agents/AgentDetail.vue')
const EditAgent = () => import('@/views/Agents/EditAgent.vue')
const Chat = () => import('@/views/Chat.vue')

const Center = () => import('@/views/Auth/Center.vue')

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
    meta: {
      guestOnly: true,
      title: 'Login'
    }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: true,
      title: 'Dashboard'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { 
      guestOnly: true,
      title: 'Register'
    }
  },
  {
    path: '/agents',
    name: 'AgentList',
    component: AgentList,
    meta: { 
      requiresAuth: true,
      title: 'My Agents'
    }
  },
  {
    path: '/center',
    name: 'Center',
    component: Center,
    meta: {
      requiresAuth: true,
      title: 'Center'
    }
  },
  {
    path: '/agents/create',
    name: 'CreateAgent',
    component: CreateAgent,
    meta: { 
      requiresAuth: true,
      title: 'Create Agent'
    }
  },
  {
    path: '/agents/:id',
    name: 'AgentDetail',
    component: AgentDetail,
    meta: { 
      requiresAuth: true,
      title: 'Agent Details'
    },
    props: true
  },
  {
    path: '/agents/:id/edit',
    name: 'EditAgent',
    component: EditAgent,
    meta: { 
      requiresAuth: true,
      title: 'Edit Agent'
    },
    props: true
  },
  {
    path: '/chat/:agentId',
    name: 'Chat',
    component: Chat,
    meta: { 
      requiresAuth: true,
      title: 'Chat with Agent'
    },
    props: true
  },

  // 404 页面处理
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置，则返回该位置
    if (savedPosition) {
      return savedPosition
    }
    // 否则滚动到顶部
    return { top: 0 }
  }
})

// 路由守卫
// router/index.js
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} | Agent Platform` : 'Agent Platform'

  // 从store获取认证状态（不要直接从localStorage读取）
  const isAuthenticated = store.getters['auth/isAuthenticated']
  
  // 检查需要认证的路由
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // 如果token存在但store未更新，尝试加载用户
      if (localStorage.getItem('token')) {
        try {
          await store.dispatch('auth/loadUser')
          next()
          return
        } catch (error) {
          // 如果加载用户失败，跳转到登录页
          next({
            path: '/login',
            query: { redirect: to.fullPath }
          })
          return
        }
      }
      
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }
  
  // 检查仅允许未登录用户访问的路由
  if (to.matched.some(record => record.meta.guestOnly)) {
    if (isAuthenticated) {
      next('/')
      return
    }
  }
  
  next()
})

export default router