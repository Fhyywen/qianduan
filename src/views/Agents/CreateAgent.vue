<template>
  <div class="create-agent-container">
    <h2>Create New Agent</h2>
    
    <AgentForm
      ref="agentForm"
      submit-text="Create Agent"
      :loading="loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <div v-if="error" class="error-message" ref="errorMessage">
      <i class="error-icon">!</i>
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import AgentForm from '@/components/AgentForm.vue'

const router = useRouter()
const store = useStore()

const agentForm = ref(null)
const errorMessage = ref(null)
const loading = ref(false)
const error = ref(null)

/**
 * 处理表单提交
 * @param {Object} formData - 表单数据
 */
const handleSubmit = async (formData) => {
  try {
    loading.value = true
    error.value = null

    // 数据预处理和验证
    const requestData = prepareRequestData(formData)
    
    // 验证必填字段
    validateRequiredFields(requestData)

    // 过滤掉无效值
    const filteredData = filterValidData(requestData)

    console.log('创建代理请求数据:', filteredData)

    // 调用Vuex action
    const newAgent = await store.dispatch('agent/createAgent', filteredData)

    console.log('创建代理返回数据:', newAgent)

    // 处理响应
    await handleAgentResponse(newAgent, formData.name)

  } catch (err) {
    console.error('创建代理错误:', err)
    await handleError(err)
  } finally {
    loading.value = false
  }
}

/**
 * 准备请求数据
 * @param {Object} formData - 原始表单数据
 * @returns {Object} 处理后的请求数据
 */
const prepareRequestData = (formData) => {
  return {
    name: formData.name?.trim(),
    description: formData.description?.trim(),
    system_prompt: formData.system_prompt?.trim(),
    model: formData.model,
    temperature: formData.temperature !== '' ? parseFloat(formData.temperature) : 0.7,
    max_tokens: formData.max_tokens !== '' ? parseInt(formData.max_tokens) : 2000,
    is_public: Boolean(formData.is_public),
    user_id: store.getters['auth/currentUser']?.id || null
  }
}

/**
 * 验证必填字段
 * @param {Object} data - 请求数据
 */
const validateRequiredFields = (data) => {

}

/**
 * 过滤有效数据
 * @param {Object} data - 原始数据
 * @returns {Object} 过滤后的数据
 */
const filterValidData = (data) => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => 
      v !== null && v !== undefined && !Number.isNaN(v)
    )
  )
}

/**
 * 处理代理创建响应
 * @param {Object} newAgent - 新创建的代理
 * @param {string} originalName - 原始名称
 */
const handleAgentResponse = async (newAgent, originalName) => {
  // 验证响应
  if (!newAgent) {
    throw new Error('服务器返回空响应')
  }

  if (typeof newAgent !== 'object') {
    throw new Error(`意外的响应格式: ${typeof newAgent}`)
  }

  // 如果没有ID但有name，可能是服务器返回异常
  if (!newAgent.id && newAgent.name) {
    console.log('使用名称作为临时标识，可能需要重新加载列表')
    
    await showNotification('info', `${newAgent.name} 创建成功，但系统未返回完整信息，列表将刷新`, 6000)
    
    // 导航到列表页并刷新
    router.push({ name: 'AgentList' })
    return
  }

  // 完全成功的情况
  await showNotification('success', `${originalName} 创建成功`, 5000)
  
  router.push({
    name: 'AgentDetail',
    params: { id: newAgent.id },
    query: { created: 'true' }
  })
}

/**
 * 处理错误
 * @param {Error} err - 错误对象
 */
const handleError = async (err) => {
  
  if (err instanceof Error) {
    errorMsg = err.message
  } else if (typeof err === 'string') {
    errorMsg = err
  } else if (err.response?.data?.message) {
    errorMsg = err.response.data.message
  }

  error.value = errorMsg

  // 显示错误通知
  await showNotification('error', errorMsg, 8000)

  // 滚动到错误提示
  await nextTick()
  errorMessage.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

/**
 * 显示通知
 * @param {string} type - 通知类型
 * @param {string} message - 通知消息
 * @param {number} timeout - 超时时间
 */
const showNotification = async (type, message, timeout) => {
  if (store.hasModule('notification')) {
    await store.dispatch('notification/showNotification', {
      type,
      message,
      timeout
    })
  }
}

/**
 * 处理取消操作
 */
const handleCancel = () => {
  router.push({ name: 'AgentList' })
}
</script>

<style scoped>
.create-agent-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  margin-bottom: 2rem;
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 600;
}

.error-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #ffebee;
  color: #f44336;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #ffcdd2;
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.1);
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #f44336;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-style: normal;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .create-agent-container {
    padding: 1rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  .error-message {
    margin-top: 1rem;
    padding: 0.75rem;
  }
}
</style>