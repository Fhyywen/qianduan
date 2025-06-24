import api from './api'

export default {
  async createAgent(agentData) {
    const response = await api.post('/agents', agentData)
    return response.data
  },
  
  async listAgents(publicOnly = false) {
    const response = await api.get('/agents', {
      params: { public: publicOnly }
    })
    return response.data
  },
  
  async getAgent(id) {
    const response = await api.get(`/agents/${id}`)
    return response.data
  },
  
  async updateAgent(id, updateData) {
    const response = await api.put(`/agents/${id}`, updateData)
    return response.data
  },
  
  async deleteAgent(id) {
    const response = await api.delete(`/agents/${id}`)
    return response.data
  },
  
  async executeAgent(agentId, input, parentExecutionId = null) {
    const response = await api.post(`/agents/${agentId}/execute`, {
      input,
      parent_execution_id: parentExecutionId
    })
    return response.data
  },
  
  async listAgentExecutions(agentId) {
    const response = await api.get(`/agents/${agentId}/executions`)
    return response.data
  },
  
  async getAvailableModels() {
    const response = await api.get('/agents/models')
    return response.data.models
  }
}