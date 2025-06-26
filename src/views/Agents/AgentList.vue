<template>
  <div class="agent-list">
    <h2>My Agents</h2>
    <div class="actions">
      <router-link to="/agents/create" class="btn">Create New Agent</router-link>
      <button @click="togglePublic" class="btn">
        {{ showPublic ? 'Show My Agents' : 'Show Public Agents' }}
      </button>
    </div>
    
    <div v-if="loading" class="loading">Loading...</div>
    
    <div v-else-if="error" class="error-message">
      <i class="error-icon">!</i>
      {{ error }}
      <button @click="fetchAgents" class="retry-btn">Retry</button>
    </div>
    
    <div v-else-if="agents.length === 0" class="no-agents">
      <p>No agents found.</p>
      <p v-if="showPublic">No public agents available.</p>
      <p v-else>Create your first agent!</p>
    </div>
    
    <div v-else class="agent-grid">
      <AgentCard
        v-for="agent in agents"
        :key="agent.id"
        :agent="agent"
        @delete="handleDeleteAgent"
      />
    </div>
    
    <!-- 调试信息 -->
    <div v-if="debug" class="debug-info">
      <h4>Debug Info:</h4>
      <p>Loading: {{ loading }}</p>
      <p>Error: {{ error }}</p>
      <p>Agents Count: {{ agents.length }}</p>
      <p>Show Public: {{ showPublic }}</p>
      <p>Agents: {{ JSON.stringify(agents, null, 2) }}</p>
    </div>
  </div>
</template>

<script>
import AgentCard from '@/components/AgentCard.vue'

export default {
  components: { AgentCard },
  data() {
    return {
      loading: false,
      error: null,
      showPublic: false,
      agents: [],
      debug: false // 设置为true可以看到调试信息
    }
  },
  created() {
    this.fetchAgents()
  },
  methods: {
    async fetchAgents() {
      this.loading = true;
      this.error = null;
      
      try {
        console.log('AgentList 开始获取智能体，showPublic:', this.showPublic);
        
        // 从store获取数据
        const agents = await this.$store.dispatch('agent/fetchAgents', this.showPublic);
        console.log('AgentList 接收到的智能体数据:', agents);
        
        // 确保agents是数组
        if (Array.isArray(agents)) {
          this.agents = agents;
          console.log('AgentList 设置智能体数据成功，数量:', agents.length);
        } else {
          console.error('AgentList 获取的智能体数据不是数组格式:', agents);
          this.agents = [];
          this.error = 'Invalid data format received from server';
        }
      } catch (error) {
        console.error('AgentList Failed to fetch agents:', error);
        this.error = error.message || 'Failed to load agents';
        this.agents = [];
      } finally {
        this.loading = false;
      }
    },
    
    togglePublic() {
      this.showPublic = !this.showPublic;
      console.log('切换显示模式:', this.showPublic ? 'Public' : 'My Agents');
      this.fetchAgents();
    },
    
    async handleDeleteAgent(agentId) {
      if (confirm('Are you sure you want to delete this agent?')) {
        try {
          await this.$store.dispatch('agent/deleteAgent', agentId);
          // 从本地列表中移除
          this.agents = this.agents.filter(agent => agent.id !== agentId);
          console.log('AgentList 删除智能体成功，ID:', agentId);
        } catch (error) {
          console.error('AgentList Failed to delete agent:', error);
          this.error = error.message || 'Failed to delete agent';
        }
      }
    },
    
  }
}
</script>

<style scoped>
.agent-list {
  padding: 20px;
}

.actions {
  margin-bottom: 20px;
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
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #3aa876;
}

.test-btn:hover {
  background-color: #f57c00;
}

.loading, .no-agents {
  padding: 20px;
  text-align: center;
  color: #666;
}

.error-message {
  margin: 20px 0;
  padding: 15px;
  background-color: #ffebee;
  color: #f44336;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #ffcdd2;
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

.retry-btn {
  margin-left: auto;
  padding: 5px 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background-color: #d32f2f;
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.debug-info {
  margin-top: 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
}

.debug-info h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.debug-info p {
  margin: 5px 0;
  color: #666;
}
</style>