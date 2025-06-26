<template>
  <div class="agent-card" :class="{ 'public': agent.is_public }">
    <div class="card-header">
      <h3>{{ agent.name }}</h3>
      <span class="model-badge">{{ getModelName(agent.model) }}</span>
      <span v-if="agent.is_public" class="public-badge">Public</span>
    </div>

    <div class="card-body">
      <p class="description" v-if="agent.description">{{ agent.description }}</p>
      <p v-else class="no-description">未提供描述</p>

      <div class="meta-info">
        <div class="meta-item">
          <span class="label">温度:</span>
          <span class="value">{{ agent.temperature }}</span>
        </div>
        <div class="meta-item">
          <span class="label">最大Tokens:</span>
          <span class="value">{{ agent.max_tokens }}</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <router-link 
        :to="`/chat/${agent.id}`" 
        class="btn chat-btn"
        title="Start Chat"
      >
        <i class="icon-chat"></i> 聊天
      </router-link>
      
      <router-link 
        v-if="isOwner"
        :to="`/agents/${agent.id}/edit`" 
        class="btn edit-btn"
        title="Edit Agent"
      >
        <i class="icon-edit"></i> 编辑
      </router-link>
      
      <button 
        v-if="isOwner"
        @click="handleDelete" 
        class="btn delete-btn"
        title="Delete Agent"
        :disabled="deleting"
      >
        <span v-if="deleting" class="spinner"></span>
        <template v-else>
          <i class="icon-delete"></i> 删除
        </template>
      </button>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue' // 添加 onMounted 导入
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'AgentCard',
  props: {
    agent: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    const store = useStore()
    const router = useRouter()
    const deleting = ref(false)

    const isOwner = computed(() => {
      return store.getters['auth/currentUser']?.id === props.agent.user_id
    })

    const getModelName = (modelId) => {
      const model = store.getters['agent/getModelById'](modelId)
      return model?.name || modelId
    }

    const handleDelete = async () => {
      if (!confirm(`Are you sure you want to delete "${props.agent.name}"?`)) {
        return
      }

      deleting.value = true
      try {
        const agentId = props.agent.id
        console.log('开始删除代理:', {
          id: agentId,
          name: props.agent.name,
          type: typeof agentId
        })
        
        await store.dispatch('agent/deleteAgent', agentId)
        
        // 显示成功通知
        await store.dispatch('notification/showNotification', {
          type: 'success',
          message: `"${props.agent.name}" 删除成功`,
          timeout: 5000
        })
        
        console.log('代理删除成功')
        emit('delete', agentId) // 通知父组件
      } catch (error) {
        console.error('删除代理失败:', {
          error: error,
          message: error.message,
          response: error.response
        })
        
        let errorMessage = '删除代理失败'
        if (error.message) {
          errorMessage = error.message
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        }
        
        // 显示错误通知
        await store.dispatch('notification/showNotification', {
          type: 'error',
          message: errorMessage,
          timeout: 8000
        })
      } finally {
        deleting.value = false
      }
    }

    // 现在 onMounted 可用
    onMounted(() => {
      console.log('AgentCard 已挂载，接收的agent数据：', props.agent);
      console.log('Agent ID:', props.agent.id, '类型:', typeof props.agent.id);
      console.log('Agent 名称:', props.agent.name);
      console.log('是否公开:', props.agent.is_public);
      console.log('用户ID:', props.agent.user_id);
      console.log('当前用户ID:', store.getters['auth/currentUser']?.id);
      console.log('是否为所有者:', store.getters['auth/currentUser']?.id === props.agent.user_id);
    });

    return {
      isOwner,
      deleting,
      getModelName,
      handleDelete
    }
  }
}
</script>

<style scoped>
.agent-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid #42b983;
}

.agent-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.agent-card.public {
  border-left-color: #646cff;
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-badge {
  background: #f0f0f0;
  color: #555;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.public-badge {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.card-body {
  padding: 16px;
}

.description {
  margin: 0 0 12px;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-description {
  margin: 0 0 12px;
  color: #999;
  font-style: italic;
  font-size: 0.85rem;
}

.meta-info {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.meta-item {
  font-size: 0.85rem;
}

.label {
  color: #888;
  margin-right: 4px;
}

.value {
  font-weight: 500;
  color: #333;
}

.card-footer {
  padding: 12px 16px;
  background: #f9f9f9;
  display: flex;
  gap: 8px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}

.chat-btn {
  background: #42b983;
  color: white;
  border: none;
}

.chat-btn:hover {
  background: #3aa876;
}

.edit-btn {
  background: #f0f0f0;
  color: #555;
  border: none;
}

.edit-btn:hover {
  background: #e0e0e0;
}

.delete-btn {
  background: #ffebee;
  color: #f44336;
  border: none;
  margin-left: auto;
}

.delete-btn:hover:not(:disabled) {
  background: #ffcdd2;
}

.delete-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(244, 67, 54, 0.3);
  border-top-color: #f44336;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.icon-chat, .icon-edit, .icon-delete {
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .card-footer {
    flex-wrap: wrap;
  }
  
  .btn {
    flex-grow: 1;
    justify-content: center;
  }
}
</style>