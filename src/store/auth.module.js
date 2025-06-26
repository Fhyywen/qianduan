import AuthService from '@/services/AuthService'
import { jwtDecode } from 'jwt-decode'

const state = {
  user: null,
  token: localStorage.getItem('access_token') || localStorage.getItem('token') || null,
  isAuthenticated: false,
  loading: false,
  error: null
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
    state.isAuthenticated = !!token
    if (token) {
      localStorage.setItem('access_token', token)
      localStorage.setItem('token', token) // 保持向后兼容
    } else {
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')
    }
  },
  SET_USER(state, user) {
    state.user = user
  },
  SET_LOADING(state, isLoading) {
    state.loading = isLoading
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  LOGOUT(state) {
    state.user = null
    state.token = null
    state.isAuthenticated = false
    localStorage.removeItem('access_token')
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
  }
}

const actions = {
  async refreshToken({ commit, state }) {
    console.log("开始刷新token")
    try {
      const newToken = await AuthService.refreshToken()
      console.log("auth.module获得新token", newToken)
      commit('SET_TOKEN', newToken)
      
      // 刷新token后重新加载用户信息
      await this.dispatch('auth/loadUser')
      
      return newToken
    } catch (error) {
      console.error('刷新token失败:', error)
      commit('LOGOUT')
      throw error
    }
  },
  
  async login({ commit }, { usernameOrEmail, password }) {
    commit('SET_LOADING', true)
    try {
      const response = await AuthService.login(usernameOrEmail, password)
      console.log('登录响应:', response)
      
      // 设置token
      commit('SET_TOKEN', response.access_token)
      
      // 解码token获取用户信息
      if (response.access_token) {
        try {
          const user = jwtDecode(response.access_token)
          commit('SET_USER', user)
        } catch (error) {
          console.error('Token解码失败:', error)
        }
      }
      
      return response
    } catch (error) {
      commit('SET_ERROR', error.message || 'Login failed')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async register({ commit }, userData) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    try {
      const response = await AuthService.register(userData);
      commit('SET_TOKEN', response.access_token || response.token);
      
      if (response.access_token || response.token) {
        try {
          const user = jwtDecode(response.access_token || response.token)
          commit('SET_USER', user)
        } catch (error) {
          console.error('Token解码失败:', error)
        }
      }
      
      return response;
    } catch (error) {
      let errorMsg = 'Registration failed';
      if (error.response) {
        if (error.response.data?.errors) {
          errorMsg = Object.values(error.response.data.errors).join(', ');
        } else if (error.response.data?.message) {
          errorMsg = error.response.data.message;
        }
      }
      commit('SET_ERROR', errorMsg);
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async loadUser({ commit, state }) {
    const token = state.token || localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) {
      console.log('没有找到token，用户未登录')
      return null;
    }

    try {
      console.log('开始加载用户信息，token:', token.substring(0, 20) + '...')
      const user = jwtDecode(token);
      console.log('解码的用户信息:', user)
      
      // 检查token是否过期
      if (user.exp && Date.now() >= user.exp * 1000) {
        console.log('Token已过期，尝试刷新')
        throw new Error('Token expired')
      }
      
      commit('SET_USER', user);
      commit('SET_TOKEN', token); // 确保token状态同步
      return user;
    } catch (error) {
      console.error('加载用户信息失败:', error)
      if (error.message === 'Token expired') {
        // 尝试刷新token
        try {
          await this.dispatch('auth/refreshToken')
          return await this.dispatch('auth/loadUser')
        } catch (refreshError) {
          console.error('刷新token失败:', refreshError)
          commit('LOGOUT')
          return null
        }
      } else {
        commit('SET_ERROR', 'Invalid token');
        commit('SET_TOKEN', null);
        return null;
      }
    }
  },

  logout({ commit }) {
    commit('LOGOUT')
  },

  clearError({ commit }) {
    commit('SET_ERROR', null)
  }
}

const getters = {
  currentUser: state => state.user,
  isAuthenticated: state => state.isAuthenticated,
  isAdmin: state => state.user?.is_admin || false,
  authError: state => state.error,
  isLoading: state => state.loading
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}