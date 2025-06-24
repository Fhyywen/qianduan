import axios from '@/services/api' // 假设你已经配置了axios实例
import { ref } from 'vue'

const DEFAULT_MAX_TOKENS = 1000

class Message {
  /**
   * @param {'system'|'user'|'assistant'} role 
   * @param {string} content 
   */
  constructor(role, content) {
    this.role = role
    this.content = content
  }
}

class TongyiService {
  static apiKey = null
  static baseUrl = null

  /**
   * 初始化通义API配置
   * @param {string} apiKey 
   * @param {string|null} baseUrl 
   */
  static initialize(apiKey, baseUrl = null) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  /**
   * 生成AI响应（前端简化版）
   * @param {Object} agent 
   * @param {string} userInput 
   * @param {number|null} executionId 
   * @param {Array<Message>|null} historyMessages 
   * @param {number} maxHistoryTurns 
   * @returns {Promise<{response: string, execution: Object}>}
   */
  static async generateResponse(
    agent,
    userInput,
    executionId = null,
    historyMessages = null,
    maxHistoryTurns = 3
  ) {
    try {
      // 构建消息上下文
      const messages = this.generateContextMessages(
        agent,
        userInput,
        executionId,
        historyMessages,
        maxHistoryTurns
      )

      // 调用后端API（实际前端应调用自己的后端，再由后端调用Dashscope）
      const response = await axios.post('/api/tongyi/generate', {
        agent_id: agent.id,
        messages: this.convertMessagesToApiFormat(messages),
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || DEFAULT_MAX_TOKENS,
        model: agent.model || 'qwen-turbo',
        execution_id: executionId
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      return {
        response: response.data.output.text,
        execution: response.data.execution
      }
    } catch (error) {
      console.error('Tongyi API error:', error)
      throw new Error(error.response?.data?.error || 'Failed to generate response')
    }
  }

  /**
   * 构建消息上下文
   * @private
   */
  static generateContextMessages(
    agent,
    userInput,
    executionId,
    historyMessages,
    maxHistoryTurns
  ) {
    const messages = [
      new Message('system', agent.system_prompt)
    ]

    if (historyMessages) {
      messages.push(...historyMessages)
    } else if (executionId) {
      // 前端场景下通常从store获取历史记录
      const history = this._getConversationHistory(executionId, maxHistoryTurns)
      messages.push(...history)
    }

    messages.push(new Message('user', userInput))
    return messages
  }

  /**
   * 获取对话历史（前端应从store获取）
   * @private
   */
  static _getConversationHistory(executionId, maxTurns = 3) {
    // 实际实现应从Vuex store获取历史记录
    const history = []
    // 伪代码 - 实际应从store.executions查找
    /*
    let current = store.getters.getExecutionById(executionId)
    while (current && maxTurns > 0) {
      if (current.parent_execution_id) {
        history.unshift(new Message('assistant', current.output))
        history.unshift(new Message('user', current.input))
        maxTurns--
      }
      current = store.getters.getExecutionById(current.parent_execution_id)
    }
    */
    return history
  }

  /**
   * 转换消息格式为API所需格式
   * @private
   */
  static convertMessagesToApiFormat(messages) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }

  /**
   * 直接调用模型API（仅供演示，实际应通过后端调用）
   * @private
   */
  static async callModelApi(agent, messages) {
    // 注意：前端不应直接调用Dashscope API，这里只是示例
    const response = await axios.post(
      this.baseUrl || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: agent.model,
        input: {
          messages: this.convertMessagesToApiFormat(messages)
        },
        parameters: {
          temperature: agent.temperature || 0.7,
          max_tokens: agent.max_tokens || DEFAULT_MAX_TOKENS
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  }
}

// 创建Vue可用的响应式服务
export function useTongyiService() {
  const loading = ref(false)
  const error = ref(null)

  const generateResponse = async (...args) => {
    loading.value = true
    error.value = null
    try {
      const result = await TongyiService.generateResponse(...args)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    initialize: TongyiService.initialize,
    generateResponse,
    loading,
    error
  }
}

export default TongyiService