<template>
  <div class="agent-list">
    <h2>{{ showPublic ? 'Public Agents' : 'My Agents' }}</h2>
    <div class="actions">
      <router-link to="/agents/create" class="btn">Create New Agent</router-link>
      <button @click="togglePublic" class="btn">
        {{ showPublic ? 'Show My Agents' : 'Show Public Agents' }}
      </button>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="agents.length === 0" class="no-agents">
      {{ showPublic ? 'No public agents found.' : 'No agents found. Create your first agent!' }}
    </div>

    <div v-else class="agent-grid">
      <AgentCard
        v-for="agent in agents"
        :key="agent.id"
        :agent="agent"
        @delete="handleDeleteAgent"
      />
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
      showPublic: false,
      agents: []
    }
  },
  created() {
    this.fetchAgents()
  },
  methods: {
    async fetchAgents() {
      this.loading = true;
      try {
        const agents = await this.$store.dispatch('agent/fetchAgents', this.showPublic);
        console.log('组件接收到的智能体数据:', agents);

        if (Array.isArray(agents)) {
          this.agents = agents;
        } else {
          console.error('获取的智能体数据不是数组格式:', agents);
          this.agents = [];
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        this.agents = [];
      } finally {
        this.loading = false;
      }
    },
    async handleDeleteAgent(agentId) {
      if (confirm('Are you sure you want to delete this agent?')) {
        try {
          await this.$store.dispatch('agent/deleteAgent', agentId)
          this.agents = this.agents.filter(agent => agent.id !== agentId)
        } catch (error) {
          console.error('Failed to delete agent:', error)
        }
      }
    },
    togglePublic() {
      this.showPublic = !this.showPublic;
      this.fetchAgents();
    }
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
}

.loading, .no-agents {
  padding: 20px;
  text-align: center;
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
</style>