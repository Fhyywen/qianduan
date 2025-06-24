<template>
  <div class="agent-detail">
    <div v-if="loading" class="loading">Loading...</div>
    
    <template v-else>
      <div class="agent-header">
        <h2>{{ agent.name }}</h2>
        <div class="actions">
          <router-link :to="`/chat/${agent.id}`" class="btn">Chat</router-link>
          <button @click="toggleEdit" class="btn">
            {{ editing ? 'Cancel' : 'Edit' }}
          </button>
          <button @click="handleDelete" class="btn danger">Delete</button>
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
        <div class="agent-meta">
          <p><strong>Model:</strong> {{ getModelName(agent.model) }}</p>
          <p><strong>Temperature:</strong> {{ agent.temperature }}</p>
          <p><strong>Max Tokens:</strong> {{ agent.max_tokens }}</p>
          <p><strong>Visibility:</strong> {{ agent.is_public ? 'Public' : 'Private' }}</p>
        </div>
        
        <div class="agent-description">
          <h3>Description</h3>
          <p>{{ agent.description || 'No description provided' }}</p>
        </div>
        
        <div class="agent-prompt">
          <h3>System Prompt</h3>
          <pre>{{ agent.system_prompt }}</pre>
        </div>
        
        <div class="executions-section">
          <h3>Previous Executions</h3>
          <div v-if="executionsLoading" class="loading">Loading executions...</div>
          <div v-else-if="executions.length === 0" class="no-executions">
            No previous executions found
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
      if (confirm('Are you sure you want to delete this agent?')) {
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
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.loading {
  padding: 40px;
  text-align: center;
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}

.btn.danger {
  background-color: #f44336;
}

.agent-meta {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.agent-description,
.agent-prompt,
.executions-section {
  margin-bottom: 30px;
}

pre {
  white-space: pre-wrap;
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
}

.executions-list {
  list-style: none;
  padding: 0;
}

.executions-list li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.executions-list li a {
  color: #42b983;
  text-decoration: none;
}

.executions-list li a:hover {
  text-decoration: underline;
}

.no-executions {
  color: #777;
  font-style: italic;
}
</style>