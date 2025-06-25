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
  async refreshToken({ commit, state }) {
    try {
      const { token } = await AuthService.refreshToken()
      commit('SET_TOKEN', token)
      return token
    } catch (error) {
      commit('LOGOUT')
      throw error
    }
  },
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
  commit('SET_LOADING', true);
  commit('SET_ERROR', null);
  try {
    const response = await AuthService.register(userData);
    commit('SET_TOKEN', response.token);
    commit('SET_USER', response.user);
    return response.user;
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

  async loadUser({ commit }) {
    const token = state.token;
    if (!token) return null;

    try {
        const user = jwtDecode(token);
        commit('SET_USER', user);
        return user;
    } catch (error) {
        commit('SET_ERROR', 'Invalid token');
        commit('SET_TOKEN', null);
        return null;
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