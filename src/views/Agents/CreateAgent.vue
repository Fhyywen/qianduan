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

const state = {
  notification: null
}

const mutations = {
  SET_NOTIFICATION(state, notification) {
    state.notification = notification;
  }
}



// CreateAgent.vue

const handleSubmit = async (formData) => {
  try {
    loading.value = true
    error.value = null

    // 准备请求数据，改进类型转换
    const requestData = {
      name: formData.name,
      description: formData.description,
      system_prompt: formData.system_prompt,
      model: formData.model,
      temperature: formData.temperature !== '' ? parseFloat(formData.temperature) : 0.7,
      max_tokens: formData.max_tokens !== '' ? parseInt(formData.max_tokens) : 2000,
      is_public: Boolean(formData.is_public),
      user_id: store.getters['auth/currentUser']?.id || null
    }

    // 过滤掉无效值
    const filteredData = Object.fromEntries(
      Object.entries(requestData).filter(([_, v]) => 
        v !== null && v !== undefined && !Number.isNaN(v)
      )
    )

    console.log('创建代理请求数据:', filteredData)

    // 调用Vuex action
    const newAgent = await store.dispatch('agent/createAgent', filteredData)

    console.log('创建代理返回数据:', newAgent)

    // 改进验证逻辑
    if (!newAgent) {
      throw new Error('服务器返回空响应')
    }

    if (typeof newAgent !== 'object') {
      throw new Error(`意外的响应格式: ${typeof newAgent}`)
    }

    // 如果没有ID但有name，可能是服务器返回异常
    if (!newAgent.id && newAgent.name) {
      console.log('使用名称作为临时标识，可能需要重新加载列表')
      
      // 显示成功通知
      if (store.hasModule('notification')) {
        await store.dispatch('notification/showNotification', {
          type: 'info',
          message: `${newAgent.name} 创建成功，但系统未返回完整信息，列表将刷新`,
          timeout: 6000
        })
      }
      
      // 导航到列表页并刷新
      router.push({ name: 'AgentList' })
      return
    }

    // 原始成功处理逻辑
    router.push({
      name: 'AgentDetail',
      params: { id: newAgent.id },
      query: { created: 'true' }
    })

    // 显示成功通知
    if (store.hasModule('notification')) {
      await store.dispatch('notification/showNotification', {
        type: 'success',
        message: `${formData.name} 创建成功`,
        timeout: 5000
      })
    }
  } catch (err) {
    console.error('创建代理错误:', err)
    
    let errorMsg = '创建代理失败'
    
    if (err instanceof Error) {
      errorMsg = err.message
    } else if (typeof err === 'string') {
      errorMsg = err
    }

    error.value = errorMsg

    // 显示错误通知
    if (store.hasModule('notification')) {
      await store.dispatch('notification/showNotification', {
        type: 'error',
        message: errorMsg,
        timeout: 8000
      })
    }

    // 滚动到错误提示
    nextTick(() => {
      const errorEl = document.querySelector('.error-message')
      errorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  } finally {
    loading.value = false
  }
}




// const handleSubmit = async (formData) => {


//   try {
//     loading.value = true;
//     error.value = null;

//     // 准备请求数据
//     const requestData = {
//       name: formData.name,
//       description: formData.description,
//       system_prompt: formData.system_prompt,
//       model: formData.model,
//       temperature: parseFloat(formData.temperature),
//       max_tokens: parseInt(formData.max_tokens),
//       is_public: Boolean(formData.is_public),
//       user_id: store.getters['auth/currentUser']?.id || null // 添加null默认值
//     };

//     // 过滤掉undefined/null的字段
//     const filteredData = Object.fromEntries(
//       Object.entries(requestData).filter(([_, v]) => v != null)
//     );

//     // 调用Vuex action
//     const newAgent = await store.dispatch('agent/createAgent', filteredData);
    
//     // 新增空值检查
//     if (!newAgent || !newAgent.id) {
//       throw new Error('创建代理失败，未收到有效响应');
//     }

//     // 成功处理
//     router.push({
//       name: 'AgentDetail',
//       params: { id: newAgent.id },
//       query: { created: 'true' }
//     });

//     // 显示通知（先检查mutation是否存在）
//     if (store._mutations['SET_NOTIFICATION']) {
//       store.commit('SET_NOTIFICATION', {
//         type: 'success',
//         message: `${formData.name} created successfully`,
//         timeout: 5000
//       });
//     } else {
//       console.warn('SET_NOTIFICATION mutation不存在，无法显示通知');
//     }



//   // try {
//   //   loading.value = true;
//   //   error.value = null;

//   //   // 准备请求数据 - 确保不包含前端生成的id
//   //   const requestData = {
//   //     name: formData.name,
//   //     description: formData.description,
//   //     system_prompt: formData.system_prompt,
//   //     model: formData.model,
//   //     temperature: parseFloat(formData.temperature),
//   //     max_tokens: parseInt(formData.max_tokens),
//   //     is_public: Boolean(formData.is_public),
//   //     // 其他必要字段...
//   //     user_id: store.getters['auth/currentUser']?.id || null 
//   //   };

//   //   // 过滤掉undefined/null的字段
//   //   const filteredData = Object.fromEntries(
//   //     Object.entries(requestData).filter(([_, v]) => v != null)
//   //   );

//   //   // 调用Vuex action
//   //   const newAgent = await store.dispatch('agent/createAgent', filteredData);

//   //   // 成功处理
//   //   router.push({
//   //     name: 'AgentDetail',
//   //     params: { id: newAgent.id },
//   //     query: { created: 'true' } // 使用字符串而不是布尔值更安全
//   //   });

//   //   // 显示通知
//   //   store.commit('SET_NOTIFICATION', {
//   //     type: 'success',
//   //     message: `${formData.name} created successfully`,
//   //     timeout: 5000
//   //   });









//   } catch (err) {
//     // 增强的错误处理
//     const errorMsg = err.response?.data?.error
//       || err.message
//       || 'Failed to create agent';

//     error.value = errorMsg;
//     console.error('Create agent error:', {
//       error: err,
//       requestData: formData
//     });

//     // 成功通知
//     store.dispatch('notification/showNotification', {
//       type: 'success',
//       message: `${formData.name} created successfully`,
//       timeout: 5000
//     });

//     // 错误通知
//     store.dispatch('notification/showNotification', {
//       type: 'error',
//       message: errorMsg,
//       timeout: 8000
//     });

//     // 平滑滚动到错误位置
//     nextTick(() => {
//       const errorEl = document.querySelector('.error-message');
//       errorEl?.scrollIntoView({
//         behavior: 'smooth',
//         block: 'center'
//       });
//     });

//   } finally {
//     loading.value = false;
//   }
// }














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