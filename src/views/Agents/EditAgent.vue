<template>
  <main-layout>
    <div class="edit-agent">
      <h2>编辑智能体</h2>
      <agent-form
        :initial-data="agent"
        submit-text="Update Agent"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="$router.push(`/agents/${agent.id}`)"
      />
    </div>
  </main-layout>
</template>

<script>
import AgentForm from '@/components/AgentForm.vue'
import MainLayout from '@/layouts/MainLayout.vue'

export default {
  components: { AgentForm, MainLayout },
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      agent: {},
      loading: false
    }
  },
  async created() {
    await this.fetchAgent()
  },
  methods: {
    async fetchAgent() {
      try {
        this.agent = await this.$store.dispatch('agent/fetchAgent', this.id)
      } catch (error) {
        this.$router.push('/agents')
      }
    },
    async handleSubmit(updateData) {
      this.loading = true
      try {
        await this.$store.dispatch('agent/updateAgent', {
          id: this.id,
          updateData
        })
        this.$router.push(`/agents/${this.id}`)
      } catch (error) {
        console.error('Update failed:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.edit-agent {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>