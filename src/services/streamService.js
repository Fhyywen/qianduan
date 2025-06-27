import api from './api'

/**
 * 流式响应服务
 * 处理智能体的流式回复功能
 */
class StreamService {
  /**
   * 执行智能体的流式响应
   * @param {Object} params 参数对象
   * @param {string|number} params.agentId 智能体ID
   * @param {string} params.userInput 用户输入
   * @param {string|null} params.parentExecutionId 父执行ID
   * @param {Function} params.onChunk 接收到数据块时的回调函数
   * @param {Function} params.onComplete 完成时的回调函数
   * @param {Function} params.onError 错误时的回调函数
   * @returns {Promise<Object>} 返回执行结果
   */
  static async executeAgentStream({
    agentId,
    userInput,
    parentExecutionId = null,
    onChunk,
    onComplete,
    onError
  }) {
    try {
      // 构建请求体
      const payload = {
        input: userInput.trim(),
        parent_execution_id: parentExecutionId
      }

      console.log('开始流式请求:', { agentId, userInput, parentExecutionId })

      // 首先尝试流式请求
      try {
        const response = await fetch(`${api.defaults.baseURL}/agents/${agentId}/execute/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // 检查响应头，确保是流式响应
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('text/event-stream')) {
          console.warn('响应不是流式的，回退到普通响应')
          return this.handleNonStreamResponse(response, onComplete)
        }

        // 获取响应流
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let executionId = null
        let fullResponse = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              console.log('流式响应完成')
              break
            }

            // 解码数据块
            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            // 处理数据块
            const lines = buffer.split('\n')
            buffer = lines.pop() // 保留不完整的行

            for (const line of lines) {
              if (line.trim() === '') continue

              // 解析SSE格式的数据
              if (line.startsWith('data: ')) {
                const data = line.slice(6) // 移除 'data: ' 前缀
                
                if (data === '[DONE]') {
                  console.log('流式响应结束标记')
                  break
                }

                try {
                  const parsed = JSON.parse(data)
                  
                  // 处理不同类型的消息
                  if (parsed.type === 'execution_id') {
                    executionId = parsed.execution_id
                    console.log('获取到执行ID:', executionId)
                  } else if (parsed.type === 'content') {
                    const content = parsed.content || ''
                    fullResponse += content
                    
                    // 调用回调函数处理内容块
                    if (onChunk && typeof onChunk === 'function') {
                      onChunk(content, fullResponse, executionId)
                    }
                  } else if (parsed.type === 'error') {
                    throw new Error(parsed.error || '流式响应错误')
                  }
                } catch (parseError) {
                  console.warn('解析SSE数据失败:', parseError, '原始数据:', data)
                }
              }
            }
          }

          // 完成回调
          if (onComplete && typeof onComplete === 'function') {
            onComplete(fullResponse, executionId)
          }

          return {
            responseText: fullResponse,
            ex_id: executionId
          }

        } finally {
          reader.releaseLock()
        }

      } catch (streamError) {
        console.warn('流式请求失败，回退到普通响应:', streamError)
        
        // 回退到普通响应
        return this.fallbackToNormalResponse(agentId, payload, onChunk, onComplete)
      }

    } catch (error) {
      console.error('流式请求失败:', error)
      
      if (onError && typeof onError === 'function') {
        onError(error)
      }
      
      throw error
    }
  }

  /**
   * 回退到普通响应
   * @param {string|number} agentId 智能体ID
   * @param {Object} payload 请求体
   * @param {Function} onChunk 数据块回调
   * @param {Function} onComplete 完成回调
   * @returns {Promise<Object>} 响应结果
   */
  static async fallbackToNormalResponse(agentId, payload, onChunk, onComplete) {
    try {
      console.log('使用普通响应作为回退方案')
      
      // 使用现有的API调用普通端点
      const response = await api.post(`/agents/${agentId}/execute`, payload)
      
      const responseText = response.response_text || response.response || ''
      const executionId = response.execution_id
      
      // 模拟流式效果
      if (onChunk && typeof onChunk === 'function') {
        let currentText = ''
        const words = responseText.split('')
        
        for (let i = 0; i < words.length; i++) {
          currentText += words[i]
          // 调用onChunk回调，模拟流式数据块
          onChunk(words[i], currentText, executionId)
          // 使用setTimeout模拟流式效果
          await new Promise(resolve => setTimeout(resolve, 30))
        }
      }
      
      // 完成回调
      if (onComplete && typeof onComplete === 'function') {
        onComplete(responseText, executionId)
      }
      
      return {
        responseText: responseText,
        ex_id: executionId
      }
      
    } catch (error) {
      console.error('普通响应也失败:', error)
      throw error
    }
  }

  /**
   * 处理非流式响应（回退方案）
   * @param {Response} response 响应对象
   * @param {Function} onComplete 完成回调
   * @returns {Promise<Object>} 响应结果
   */
  static async handleNonStreamResponse(response, onComplete) {
    try {
      const data = await response.json()
      
      if (onComplete && typeof onComplete === 'function') {
        onComplete(data.response_text || data.response || '', data.execution_id)
      }
      
      return {
        responseText: data.response_text || data.response || '',
        ex_id: data.execution_id
      }
    } catch (error) {
      console.error('处理非流式响应失败:', error)
      throw error
    }
  }

  /**
   * 检查服务器是否支持流式响应
   * @param {string|number} agentId 智能体ID
   * @returns {Promise<boolean>} 是否支持流式响应
   */
  static async checkStreamSupport(agentId) {
    try {
      const response = await fetch(`${api.defaults.baseURL}/agents/${agentId}/execute/stream`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`
        }
      })
      
      return response.ok
    } catch (error) {
      console.warn('检查流式支持失败:', error)
      return false
    }
  }
}

export default StreamService 