import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Auth/Login.vue'
import Register from '../views/Auth/Register.vue'
import AgentList from '../views/Agents/AgentList.vue'
import CreateAgent from '../views/Agents/CreateAgent.vue'
import AgentDetail from '../views/Agents/AgentDetail.vue'
import Chat from '../views/Chat.vue'
import store from '../store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { guestOnly: true }
  },
  {
    path: '/agents',
    name: 'AgentList',
    component: AgentList,
    meta: { requiresAuth: true }
  },
  {
    path: '/agents/create',
    name: 'CreateAgent',
    component: CreateAgent,
    meta: { requiresAuth: true }
  },
  {
    path: '/agents/:id',
    name: 'AgentDetail',
    component: AgentDetail,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/chat/:agentId',
    name: 'Chat',
    component: Chat,
    meta: { requiresAuth: true },
    props: true
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']
  
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next('/login')
  } else if (to.matched.some(record => record.meta.guestOnly) && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router