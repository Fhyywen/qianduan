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

    <div v-if="error" class="error-message">
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
const loading = ref(false)
const error = ref(null)

const handleSubmit = async (formData) => {
  try {
    loading.value = true;
    error.value = null;

    // 准备请求数据 - 确保不包含前端生成的id
    const requestData = {
      name: formData.name,
      description: formData.description,
      system_prompt: formData.system_prompt,
      model: formData.model,
      temperature: parseFloat(formData.temperature),
      max_tokens: parseInt(formData.max_tokens),
      is_public: Boolean(formData.is_public),
      // 其他必要字段...
      user_id: store.getters['auth/currentUser']?.id // 可选链操作防止错误
    };

    // 过滤掉undefined/null的字段
    const filteredData = Object.fromEntries(
      Object.entries(requestData).filter(([_, v]) => v != null)
    );

    // 调用Vuex action
    const newAgent = await store.dispatch('agent/createAgent', filteredData);

    // 成功处理
    router.push({
      name: 'AgentDetail',
      params: { id: newAgent.id },
      query: { created: 'true' } // 使用字符串而不是布尔值更安全
    });

    // 显示通知
    store.commit('SET_NOTIFICATION', {
      type: 'success',
      message: `${formData.name} created successfully`,
      timeout: 5000
    });

  } catch (err) {
    // 增强的错误处理
    const errorMsg = err.response?.data?.error
      || err.message
      || 'Failed to create agent';

    error.value = errorMsg;
    console.error('Create agent error:', {
      error: err,
      requestData: formData
    });

    // 错误通知
    store.commit('SET_NOTIFICATION', {
      type: 'error',
      message: errorMsg,
      timeout: 8000
    });

    // 平滑滚动到错误位置
    nextTick(() => {
      const errorEl = document.querySelector('.error-message');
      errorEl?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });

  } finally {
    loading.value = false;
  }
}

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
}

.error-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #ffebee;
  color: #f44336;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
}

@media (max-width: 768px) {
  .create-agent-container {
    padding: 1rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}
</style>