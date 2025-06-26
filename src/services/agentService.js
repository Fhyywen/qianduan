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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`
        }
      })
      console.log("得到的agent回复为getAgent:", response)
      return response // 现在response已经是data了
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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`
        }
      })
      return response // 现在response已经是data了
    } catch (error) {
      console.error('Update agent error:', error)
      throw this._handleError(error)
    }
  },
  
  async deleteAgent(id) {
    try {
      console.log('删除代理请求，ID:', id)
      
      const response = await api.delete(`/agents/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`
        }
      })
      
      console.log('删除代理响应:', {
        status: response.status,
        data: response
      })
      
      // 检查响应状态 - 由于api拦截器返回data，我们需要检查其他方式
      // 如果删除成功，通常返回空对象或成功消息
      return response || { success: true }
    } catch (error) {
      console.error('删除代理请求失败:', {
        agentId: id,
        error: error.response || error,
        message: error.message
      })
      
      // 处理特定错误状态
      if (error.response) {
        const { status, data } = error.response
        
        if (status === 401) {
          throw new Error('身份验证失败，请重新登录')
        } else if (status === 403) {
          throw new Error('权限不足，无法删除此代理')
        } else if (status === 404) {
          throw new Error('代理不存在或已被删除')
        } else if (status >= 500) {
          throw new Error('服务器内部错误，请稍后重试')
        } else if (data?.message) {
          throw new Error(data.message)
        } else {
          throw new Error(`删除失败 (状态码: ${status})`)
        }
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('请求超时，请稍后重试')
      } else if (!error.response) {
        throw new Error('网络连接失败，请检查网络设置')
      } else {
        throw new Error(error.message || '删除代理失败')
      }
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
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`
        }
      })
      return response // 现在response已经是data了
    } catch (error) {
      console.error('Execute agent error:', error)
      throw this._handleError(error)
    }
  },
  
  async listAgents(publicOnly = false) {
    try {
      console.log('开始获取智能体列表，publicOnly:', publicOnly)
      
      const response = await api.get('/agents', {
        params: { public: publicOnly },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`
        }
      });
      
      console.log("agentService listAgents 原始响应:", response)
      
      // 检查响应结构
      if (!response) {
        console.warn('API返回空响应')
        return []
      }
      
      // 如果response是axios响应对象，获取data
      const agentsData = response.data || response
      
      console.log("agentService listAgents 处理后的数据:", agentsData)
      
      // 确保返回数组
      if (Array.isArray(agentsData)) {
        return agentsData
      } else if (agentsData && Array.isArray(agentsData.agents)) {
        return agentsData.agents
      } else {
        console.warn('响应数据格式异常:', agentsData)
        return []
      }
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
    console.error('AgentService error:', error)
    
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