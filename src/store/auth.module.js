import AuthService from '@/services/AuthService'
import { jwtDecode } from 'jwt-decode'

const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
    state.isAuthenticated = !!token
    if (token) {
      localStorage.setItem('token', token)
    } else {
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
    localStorage.removeItem('token')
  }
}

const actions = {
  async login({ commit }, { usernameOrEmail, password }) {
    commit('SET_LOADING', true)
    try {
      const { token, user } = await AuthService.login(usernameOrEmail, password)
      commit('SET_TOKEN', token)
      commit('SET_USER', user)
      return user
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Login failed')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async register({ commit }, userData) {
    commit('SET_LOADING', true)
    try {
      const { token, user } = await AuthService.register(userData)
      commit('SET_TOKEN', token)
      commit('SET_USER', user)
      return user
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.errors || 'Registration failed')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async loadUser({ commit }) {
    const token = state.token
    if (!token) return null
    
    try {
      const user = jwtDecode(token)
      commit('SET_USER', user)
      return user
    } catch (error) {
      commit('SET_ERROR', 'Invalid token')
      commit('SET_TOKEN', null)
      return null
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