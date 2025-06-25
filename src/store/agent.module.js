import TongyiService from '@/services/TongyiService'
import AgentService from '@/services/AgentService'

const state = {
  agents: [],
  currentAgent: null,
  executions: [],
  availableModels: [
    { id: 'qwen-turbo', name: '通义千问Turbo' },
    { id: 'qwen-plus', name: '通义千问Plus' },
    { id: 'qwen-max', name: '通义千问Max' }
  ],
  loading: false,
  error: null
}

const mutations = {
  SET_AGENTS(state, agents) {
    state.agents = agents
  },
  SET_CURRENT_AGENT(state, agent) {
    state.currentAgent = agent
  },
  SET_EXECUTIONS(state, executions) {
    state.executions = executions
  },
  SET_LOADING(state, isLoading) {
    state.loading = isLoading
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  ADD_AGENT(state, agent) {
    state.agents.push(agent)
  },
  UPDATE_AGENT(state, updatedAgent) {
    const index = state.agents.findIndex(a => a.id === updatedAgent.id)
    if (index !== -1) {
      state.agents.splice(index, 1, updatedAgent)
    }
  },
  DELETE_AGENT(state, agentId) {
    state.agents = state.agents.filter(agent => agent.id !== agentId)
  },
  SET_AVAILABLE_MODELS(state, models) {
    state.availableModels = models
  }
}

const actions = {
  async fetchAgents({ commit }, publicOnly = false) {
    commit('SET_LOADING', true)
    try {
      const agents = await AgentService.listAgents(publicOnly)
      commit('SET_AGENTS', agents)
      return agents
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchAgent({ commit }, agentId) {
    commit('SET_LOADING', true)
    try {
      const agent = await AgentService.getAgent(agentId)
      commit('SET_CURRENT_AGENT', agent)
      return agent
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createAgent({ commit }, agentData) {
    commit('SET_LOADING', true)
    try {
      const newAgent = await AgentService.createAgent(agentData)
      commit('ADD_AGENT', newAgent)
      return newAgent
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateAgent({ commit }, { id, updateData }) {
    commit('SET_LOADING', true)
    try {
      const updatedAgent = await AgentService.updateAgent(id, updateData)
      commit('UPDATE_AGENT', updatedAgent)
      if (state.currentAgent?.id === id) {
        commit('SET_CURRENT_AGENT', updatedAgent)
      }
      return updatedAgent
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async deleteAgent({ commit }, agentId) {
    commit('SET_LOADING', true)
    try {
      await AgentService.deleteAgent(agentId)
      commit('DELETE_AGENT', agentId)
      if (state.currentAgent?.id === agentId) {
        commit('SET_CURRENT_AGENT', null)
      }
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchAgentExecutions({ commit }, agentId) {
    commit('SET_LOADING', true)
    try {
      const executions = await AgentService.listAgentExecutions(agentId)
      commit('SET_EXECUTIONS', executions)
      return executions
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async executeAgent({ commit }, { agentId, userInput, parentExecutionId }) {
    commit('SET_LOADING', true)
    try {
      const { response_text, execution } = await TongyiService.executeAgent(
        agentId, 
        userInput, 
        parentExecutionId
      )
      return { response_text, execution }
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  async fetchAvailableModels({ commit, state }) {
    try {
      // 如果已经有模型数据，直接返回
      if (state.availableModels.length > 0) {
        return state.availableModels
      }
      
      // 这里可以添加从API获取模型的逻辑
      // const models = await AgentService.getAvailableModels()
      // commit('SET_AVAILABLE_MODELS', models)
      // return models
      
      // 如果没有API，直接返回预设模型
      return state.availableModels
    } catch (error) {
      console.error('Failed to fetch models:', error)
      // 返回预设模型作为fallback
      return state.availableModels
    }
  }
}

const getters = {
  getAgentById: state => id => state.agents.find(agent => agent.id === id),
  getModelById: state => id => state.availableModels.find(model => model.id === id),
  publicAgents: state => state.agents.filter(agent => agent.is_public),
  userAgents: (state, getters, rootState) => 
    state.agents.filter(agent => agent.user_id === rootState.auth.user.id),
  availableModels: state => state.availableModels
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}