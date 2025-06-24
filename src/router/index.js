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

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { 
      requiresAuth: true,
      title: 'Dashboard'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      guestOnly: true,
      title: 'Login'
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
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} | Agent Platform` : 'Agent Platform'

  const isAuthenticated = store.getters['auth/isAuthenticated']
  
  // 检查需要认证的路由
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
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