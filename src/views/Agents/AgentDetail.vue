<template>
  <div class="agent-detail">
    <div v-if="loading" class="loading">Loading...</div>
    
    <template v-else>
      <div class="agent-header card">
        <div class="avatar">
          <span>{{ agent.name ? agent.name.charAt(0).toUpperCase() : '?' }}</span>
        </div>
        <div class="header-info">
          <h2>{{ agent.name }}
            <span class="badge" :class="agent.is_public ? 'public' : 'private'">
              <i v-if="agent.is_public" class="icon-public"></i>
              <i v-else class="icon-private"></i>
              {{ agent.is_public ? '公开' : '私有' }}
            </span>
          </h2>
          <div class="model-badge">
            <i class="icon-model"></i> {{ getModelName(agent.model) }}
          </div>
        </div>
        <div class="actions">
          <router-link :to="`/chat/${agent.id}`" class="btn chat-btn" title="聊天">
            <i class="icon-chat"></i> 聊天
          </router-link>
          <button @click="toggleEdit" class="btn edit-btn" title="编辑">
            <i class="icon-edit"></i> {{ editing ? '取消' : '编辑' }}
          </button>
          <button @click="handleDelete" class="btn delete-btn" title="删除">
            <i class="icon-delete"></i> 删除
          </button>
        </div>
      </div>
      
      <div v-if="editing">
        <AgentForm
          :initial-data="agent"
          show-cancel
          @submit="handleUpdate"
          @cancel="toggleEdit"
        />
      </div>
      
      <div v-else>
        <div class="card agent-meta">
          <div class="meta-item">
            <span class="label">模型：</span>
            <span class="value">{{ getModelName(agent.model) }}</span>
          </div>
          <div class="meta-item">
            <span class="label">温度：</span>
            <span class="value">{{ agent.temperature }}</span>
          </div>
          <div class="meta-item">
            <span class="label">最大Token：</span>
            <span class="value">{{ agent.max_tokens }}</span>
          </div>
          <div class="meta-item">
            <span class="label">可见性：</span>
            <span class="value">
              <span class="badge" :class="agent.is_public ? 'public' : 'private'">
                {{ agent.is_public ? '公开' : '私有' }}
              </span>
            </span>
          </div>
        </div>
        
        <div class="card agent-description">
          <h3>描述</h3>
          <p>{{ agent.description || '暂无描述' }}</p>
        </div>
        
        <div class="card agent-prompt">
          <h3>系统提示词</h3>
          <pre>{{ agent.system_prompt }}</pre>
        </div>
        
        <div class="card executions-section">
          <h3>历史执行</h3>
          <div v-if="executionsLoading" class="loading">加载中...</div>
          <div v-else-if="executions.length === 0" class="no-executions">
            暂无历史执行
          </div>
          <ul v-else class="executions-list">
            <li v-for="execution in executions" :key="execution.id">
              <router-link :to="`/chat/${agent.id}?execution=${execution.id}`">
                {{ execution.created_at | formatDate }} - {{ execution.status }}
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import AgentForm from '@/components/AgentForm.vue'

export default {
  components: { AgentForm },
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      loading: true,
      editing: false,
      agent: {},
      executions: [],
      executionsLoading: false
    }
  },
  async created() {
    await this.fetchAgent()
    await this.fetchExecutions()
  },
  methods: {
    async fetchAgent() {
      this.loading = true
      try {
        this.agent = await this.$store.dispatch('agent/fetchAgent', this.id)
      } catch (error) {
        console.error('Failed to fetch agent:', error)
        this.$router.push('/agents')
      } finally {
        this.loading = false
      }
    },
    async fetchExecutions() {
      this.executionsLoading = true
      try {
        this.executions = await this.$store.dispatch('agent/fetchAgentExecutions', this.id)
      } catch (error) {
        console.error('Failed to fetch executions:', error)
      } finally {
        this.executionsLoading = false
      }
    },
    getModelName(modelId) {
      const model = this.$store.getters['agent/getModelById'](modelId)
      return model ? model.name : modelId
    },
    toggleEdit() {
      this.editing = !this.editing
    },
    async handleUpdate(updateData) {
      try {
        await this.$store.dispatch('agent/updateAgent', {
          id: this.id,
          updateData
        })
        await this.fetchAgent()
        this.editing = false
      } catch (error) {
        console.error('Failed to update agent:', error)
      }
    },
    async handleDelete() {
      if (confirm('确定要删除该智能体吗？')) {
        try {
          await this.$store.dispatch('agent/deleteAgent', this.id)
          this.$router.push('/agents')
        } catch (error) {
          console.error('Failed to delete agent:', error)
        }
      }
    }
  },
  filters: {
    formatDate(value) {
      if (!value) return ''
      return new Date(value).toLocaleString()
    }
  }
}
</script>

<style scoped>
.agent-detail {
  padding: 24px 8px;
  max-width: 900px;
  margin: 0 auto;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans', Arial, sans-serif;
  background: #f6f8fa;
  min-height: 100vh;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px 0 rgba(60,72,88,0.08);
  margin-bottom: 24px;
  padding: 24px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.card:hover {
  box-shadow: 0 6px 24px 0 rgba(60,72,88,0.16);
  transform: translateY(-2px) scale(1.01);
}

.agent-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #42b983 60%, #646cff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  color: #fff;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(100,108,255,0.10);
}
.header-info {
  flex: 1;
}
.header-info h2 {
  margin: 0 0 8px 0;
  font-size: 1.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}
.badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.85rem;
  border-radius: 12px;
  padding: 2px 10px;
  margin-left: 8px;
  font-weight: 500;
}
.badge.public {
  background: #e6f7ff;
  color: #1890ff;
}
.badge.private {
  background: #f5f5f5;
  color: #888;
}
.model-badge {
  background: #f0f0f0;
  color: #555;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.btn {
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  text-decoration: none;
  border: none;
  font-weight: 500;
  transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 4px rgba(60,72,88,0.06);
}
.chat-btn {
  background: linear-gradient(90deg, #42b983 60%, #646cff 100%);
  color: #fff;
}
.chat-btn:hover {
  background: linear-gradient(90deg, #3aa876 60%, #4e5ed3 100%);
  transform: translateY(-1px) scale(1.03);
}
.edit-btn {
  background: #f0f0f0;
  color: #555;
}
.edit-btn:hover {
  background: #e0e0e0;
}
.delete-btn {
  background: #ffebee;
  color: #f44336;
}
.delete-btn:hover {
  background: #ffcdd2;
}

.agent-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
  margin-bottom: 18px;
  padding: 18px 12px;
  background: #f8fafc;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(60,72,88,0.04);
}
.meta-item {
  font-size: 1rem;
  margin-bottom: 0;
}
.label {
  color: #888;
  margin-right: 4px;
}
.value {
  font-weight: 500;
  color: #333;
}
.agent-description h3,
.agent-prompt h3,
.executions-section h3 {
  font-size: 1.1rem;
  color: #646cff;
  margin-bottom: 10px;
  font-weight: 600;
}
.agent-description p {
  color: #555;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
}
.agent-prompt pre {
  white-space: pre-wrap;
  background: #f5f7fa;
  padding: 14px;
  border-radius: 8px;
  font-size: 0.98rem;
  color: #333;
  margin: 0;
}
.executions-section {
  margin-bottom: 0;
}
.executions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.executions-list li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.executions-list li:last-child {
  border-bottom: none;
}
.executions-list li a {
  color: #42b983;
  text-decoration: none;
  transition: color 0.2s;
}
.executions-list li a:hover {
  color: #646cff;
  text-decoration: underline;
}
.no-executions {
  color: #999;
  font-style: italic;
  padding: 8px 0;
}
.loading {
  padding: 40px;
  text-align: center;
  color: #888;
}
/* 图标样式（可用iconfont或svg） */
.icon-chat::before { content: '\1F4AC'; }
.icon-edit::before { content: '\270E'; }
.icon-delete::before { content: '\1F5D1'; }
.icon-model::before { content: '\1F916'; }
.icon-public::before { content: '\1F310'; }
.icon-private::before { content: '\1F512'; }

/* 响应式优化 */
@media (max-width: 700px) {
  .agent-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .actions {
    flex-direction: row;
    width: 100%;
    gap: 8px;
  }
  .card {
    padding: 14px;
  }
  .agent-meta {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px 6px;
  }
}
</style>