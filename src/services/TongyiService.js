// TongyiService.js
import axios from '@/services/api.js' // 假设已配置axios实例
import { ref } from 'vue'
import api from '@/services/api'
console.log('tongyi中的api 导入成功:', api);
const DEFAULT_MAX_TOKENS = 1000

/**
 * 消息类 - 用于构建对话上下文
 */
class Message {
  /**
   * @param {'system'|'user'|'assistant'} role 消息角色
   * @param {string} content 消息内容
   */
  constructor(role, content) {
    this.role = role
    this.content = content
  }
}

/**
 * 通义服务类 - 处理与AI模型的交互
 */
class TongyiService {
  static apiKey = null          // API密钥
  static baseUrl = null         // 基础API地址

  /**
   * 初始化通义API配置
   * @param {string} apiKey API密钥
   * @param {string|null} baseUrl 基础API地址（可选）
   */
  static initialize(apiKey, baseUrl = null) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  /**
   * 执行代理对话 - 核心方法
   * @param {Object} agent 代理配置对象（需包含id、system_prompt等字段）
   * @param {string} userInput 用户输入内容
   * @param {string|null} executionId 执行ID（用于对话历史追踪）
   * @param {Array<Message>|null} historyMessages 历史消息列表
   * @returns {Promise<{response: string, execution: Object}>} 包含AI响应和执行信息的对象
   */
  static async executeAgent({ agent, userInput, parentExecutionId }) {
    // 参数验证
    if (!agent || !userInput) {
      throw new Error('Missing required parameters: agent or userInput');
    }

    try {
      const agentId = agent.id;
      if (!agentId) {
        throw new Error('Agent对象缺少id字段');
      }

      const payload = {
        agent_id: agent.id,
        model: agent.model,
        input: userInput,
        parameters: {
          temperature: agent.temperature,
          max_tokens: agent.max_tokens
        },
        parent_execution_id: parentExecutionId
      };

      console.log('Sending payload:', payload); // 调试日志
      
      const response = await api.post(`/agents/${agentId}/execute`, payload, {
        timeout: 60000 // 60秒超时
      });
      
      console.log("API响应完整对象", response);
      
      // 更健壮的响应处理
      if (!response) {
        console.error('Invalid API response:', response);
        throw new Error('Invalid API response structure');
      }
      
      console.log('API Response data:', response); // 调试日志
      
      // 处理响应数据 - 现在response已经是data了
      const responseData = response;
      
      // 兼容不同响应结构
      const responseText = responseData.response_text || responseData.response || responseData.text;
      const executionId = responseData.execution_id || responseData.execution?.id || responseData.id;
      
      if (!responseText) {
        console.error('Missing response text in:', responseData);
        throw new Error('API response missing required field: response_text');
      }
      
      console.log('提取的响应文本:', responseText);
      console.log('提取的执行ID:', executionId);

      return {
        response_text: responseText,
        execution_id: executionId,
        parent_execution_id: parentExecutionId
      };
    } catch (error) {
      // 详细错误分类
      if (error.response) {
        // 服务器返回错误状态码
        const { status, data } = error.response;
        console.error(`API请求失败 ${status}:`, data);
        
        if (status === 401) {
          // 处理未授权情况
          throw new Error('身份验证失败，请重新登录');
        } else if (status === 404) {
          throw new Error('请求的资源不存在');
        } else if (status === 500) {
          throw new Error('服务器内部错误，请稍后重试');
        } else if (status === 408 || status === 504) {
          throw new Error('请求超时，请稍后重试');
        } else {
          throw new Error(data?.message || `API错误 ${status}`);
        }
      } else if (error.request) {
        // 请求已发送，但没有收到响应
        console.error('网络请求错误:', error.request);
        throw new Error('网络连接失败，请检查网络设置');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // 处理超时错误
        throw new Error('请求超时，请稍后重试');
      } else {
        // 请求设置时出错
        console.error('请求配置错误:', error.message);
        throw new Error('请求配置错误');
      }
    }
  }

  /**
   * 生成AI响应 - 封装具体API调用逻辑
   * @param {Object} agent 代理配置对象
   * @param {string} userInput 用户输入
   * @param {string|null} executionId 执行ID
   * @param {Array<Message>|null} historyMessages 历史消息
   * @param {number} maxHistoryTurns 最大历史轮次（默认3轮）
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
      // 构建对话上下文消息
      const messages = this.generateContextMessages(
        agent,
        userInput,
        executionId,
        historyMessages,
        maxHistoryTurns
      )

      // 调用后端API（实际应由前端后端转发至通义API）
      const response = await axios.post('/api/tongyi/execute', {
        agent_id: agent.id,
        messages: this.convertMessagesToApiFormat(messages),
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || DEFAULT_MAX_TOKENS,
        model: agent.model || 'qwen-turbo',
        execution_id: executionId
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return {
        response: response.data.output.text,
        execution: response.data.execution
      }
    } catch (error) {
      console.error('通义API调用失败:', error)
      throw new Error(error.response?.data?.error || 'Failed to generate response')
    }
  }

  /**
   * 构建对话上下文消息（私有方法）
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
      new Message('system', agent.system_prompt || '你是一个智能助手，能回答各种问题。')
    ]

    // 添加历史消息或对话历史
    if (historyMessages && historyMessages.length > 0) {
      messages.push(...historyMessages)
    } else if (executionId) {
      const history = this._getConversationHistory(executionId, maxHistoryTurns)
      messages.push(...history)
    }

    // 添加当前用户输入
    messages.push(new Message('user', userInput))
    return messages
  }

  /**
   * 获取对话历史（私有方法，实际应从状态管理中获取）
   * @private
   */
  static _getConversationHistory(executionId, maxTurns = 3) {
    // 示例：此处应从Vuex或localStorage获取历史记录
    // 实际项目中需根据状态管理方案调整
    const history = []
    console.log(`模拟获取执行ID为 ${executionId} 的对话历史，最大轮次: ${maxTurns}`)
    return history
  }

  /**
   * 转换消息格式为API所需格式（私有方法）
   * @private
   */
  static convertMessagesToApiFormat(messages) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }

  /**
   * 直接调用模型API（仅供演示，实际项目中应通过后端调用）
   * @private
   */
  static async callModelApi(agent, messages) {
    console.warn('警告：前端不应直接调用通义API，此方法仅用于演示')
    try {
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
    } catch (error) {
      console.error('直接调用模型API失败:', error)
      throw error
    }
  }
}

/**
 * 导出Vue组合式函数 - 提供响应式的服务调用接口
 */
export function useTongyiService() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * 生成AI响应（带加载状态和错误处理）
   */
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

  /**
   * 执行代理对话（带加载状态和错误处理）
   */
  const executeAgent = async (...args) => {
    loading.value = true
    error.value = null
    try {
      const result = await TongyiService.executeAgent(...args)
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
    executeAgent,
    loading,
    error
  }
}

export default TongyiService