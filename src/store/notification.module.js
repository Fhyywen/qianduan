// store/notification.module.js
const state = {
  currentNotification: null
}

const mutations = {
  SET_NOTIFICATION(state, notification) {
    state.currentNotification = notification
  },
  CLEAR_NOTIFICATION(state) {
    state.currentNotification = null
  }
}

const actions = {
  showNotification({ commit }, notification) {
    commit('SET_NOTIFICATION', notification)
    if (notification.timeout) {
      setTimeout(() => {
        commit('CLEAR_NOTIFICATION')
      }, notification.timeout)
    }
  }
}


export default {
  namespaced: true, // 必须启用命名空间1
  state,
  mutations,
  actions
}