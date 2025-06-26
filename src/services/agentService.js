import api from './api'

export default {

// agentService.js
async createAgent(agentData) {
  try {
    const response = await api.post('/agents', agentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    console.log('创建代理API响应:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    })

    // 处理可能的空响应
    if (!response.data) {
      console.warn('服务器返回空响应，但请求可能已成功')
      return { name: agentData.name }
    }

    // 如果没有ID但创建成功，返回部分数据
    if (!response.data.id) {
      console.warn('服务器未返回代理ID，但创建可能已成功')
      return { name: agentData.name, ...response.data }
    }

    return response.data
  } catch (error) {
    console.error('创建代理请求失败:', {
      requestData: agentData,
      error: error.response || error
    })

    // 特殊处理：如果服务器返回400但实际创建成功
    if (error.response && error.response.status === 400) {
      console.warn('服务器返回400错误，但代理可能已创建')
      // 尝试从错误信息中获取有用信息
      const errorData = error.response.data || {}
      return { name: agentData.name, error: errorData }
    }

    throw this._handleError(error)
  }
},

  
  async getAgent(id) {
    try {
      const response = await api.get(`/agents/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      console.log("得到的agent回复为getAgent:",response)
      return response
    } catch (error) {
      console.error('Get agent error:', error)
      throw this._handleError(error)
    }
  },
  
  async updateAgent(id, updateData) {
    try {
      const response = await api.put(`/agents/${id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Update agent error:', error)
      throw this._handleError(error)
    }
  },
  
  async deleteAgent(id) {
    try {
      const response = await api.delete(`/agents/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Delete agent error:', error)
      throw this._handleError(error)
    }
  },
  
  async executeAgent(agentId, input, parentExecutionId = null) {
    try {
      const response = await api.post(`/agents/${agentId}/execute`, {
        input,
        parent_execution_id: parentExecutionId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Execute agent error:', error)
      throw this._handleError(error)
    }
  },
  
  async listAgents(publicOnly = false) {
  try {
    const response = await api.get('/agents', {
      params: { public: publicOnly },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    console.log("agentService返回",response)
    // 直接返回响应数据（根据Postman结果，响应是数组）
    return response || [];
    } catch (error) {
    console.error('List agents error:', error);
    throw this._handleError(error);
    }
  },
  
  async getAvailableModels() {
    try {
      // 首先尝试从API获取
      const response = await api.get('/agents/models', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      
      // 如果API返回有效数据则使用，否则使用默认值
      return response.data?.models || this._getDefaultModels()
    } catch (error) {
      console.error('Get models error:', error)
      // API失败时返回默认模型
      return this._getDefaultModels()
    }
  },
  
  // 错误处理统一方法
  _handleError(error) {
    if (error.response) {
      // 服务器返回了错误响应
      const { status, data } = error.response
      const message = data?.message || `Request failed with status code ${status}`
      return { 
        message,
        status,
        data: data || null
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      return { 
        message: 'Network error - no response received',
        status: null,
        data: null
      }
    } else {
      // 请求设置出错
      return { 
        message: error.message || 'Unknown request error',
        status: null,
        data: null
      }
    }
  },
  
  // 默认模型列表
  _getDefaultModels() {
    return [
      { id: 'qwen-turbo', name: '通义千问Turbo' },
      { id: 'qwen-plus', name: '通义千问Plus' },
      { id: 'qwen-max', name: '通义千问Max' }
    ]
  }
}