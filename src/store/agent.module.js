import TongyiService from '@/services/TongyiService'
import AgentService from '@/services/agentService';

console.log('AgentService 导入成功:', AgentService);



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
  error: null,
  notification: null
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
    console.log('DELETE_AGENT mutation 执行，删除ID:', agentId)
    console.log('删除前代理数量:', state.agents.length)
    
    // 确保ID比较的一致性
    const stringId = agentId.toString()
    state.agents = state.agents.filter(agent => agent.id.toString() !== stringId)
    
    console.log('删除后代理数量:', state.agents.length)
  },
  SET_AVAILABLE_MODELS(state, models) {
    state.availableModels = models
  }
}

const actions = {
  async fetchAgents({ commit }, showPublic) {
  console.log('开始获取agents，showPublic:', showPublic);
  try {
    const rawResponse = await AgentService.listAgents(showPublic);
    console.log('Vuex接收到的原始响应:', rawResponse);
    
    if (!rawResponse || !Array.isArray(rawResponse)) {
      console.error('响应不是数组:', rawResponse);
      return [];
    }
    
    const formattedAgents = rawResponse.map(agent => ({
      ...agent,
      public: agent.is_public,
      id: agent.id.toString(),
    }));
    
    console.log('格式化后的数据:', formattedAgents);
    return formattedAgents;
  } catch (error) {
    console.error('完整错误:', error);
    throw error;
  }
},

  async fetchAgent({ commit }, agentId) {
    commit('SET_LOADING', true);
    try {
      const agent = await AgentService.getAgent(agentId);
      console.log("获取的agent为:",agent)
      // 转换单个智能体的字段名
      const formattedAgent = {
        ...agent,
        public: agent.is_public,
        id: agent.id.toString(),
      };
      
      commit('SET_CURRENT_AGENT', formattedAgent);
      return formattedAgent;
    } catch (error) {
      commit('SET_ERROR', error.message);
      throw error;
    } finally {
      commit('SET_LOADING', false);
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
      console.log('Vuex deleteAgent 开始，ID:', agentId)
      
      await AgentService.deleteAgent(agentId)
      
      console.log('Vuex deleteAgent 成功，从状态中移除代理')
      commit('DELETE_AGENT', agentId)
      
      // 如果当前代理是被删除的代理，清空当前代理
      if (state.currentAgent?.id === agentId) {
        commit('SET_CURRENT_AGENT', null)
      }
      
      console.log('代理删除完成')
    } catch (error) {
      console.error('Vuex deleteAgent 错误:', error)
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

  async executeAgent({ commit, state }, { agentId, userInput, parentExecutionId }) {
  commit('SET_LOADING', true);
  
  try {
    // 验证参数
    if (!agentId || !userInput?.trim()) {
      throw new Error('Missing required parameters: agentId or userInput');
    }
    
    // 确保 agent 存在
    const agent = state.agents.find(a => a.id === agentId) || state.currentAgent;
    if (!agent) {
      throw new Error('Agent not found');
    }

    const { response_text, execution } = await TongyiService.executeAgent({
      agent: agent, // 传递完整 agent 对象
      userInput: userInput.trim(),
      parentExecutionId
    });
    
    return { responseText:response_text, execution };
  } catch (error) {
    commit('SET_ERROR', error.message);
    throw new Error(`Failed to execute agent: ${error.message}`);
  } finally {
    commit('SET_LOADING', false);
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