<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>Chat with {{ agent.name }}</h2>
      <router-link :to="`/agents/${agent.id}`" class="btn">Agent Details</router-link>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" 
           :class="['message', message.role]">
        <div class="message-content">{{ message.content }}</div>
      </div>
    </div>
    
    <div class="chat-input">
      <form @submit.prevent="sendMessage">
        <input
          v-model="userInput"
          type="text"
          placeholder="Type your message..."
          :disabled="loading"
        />
        <button type="submit" :disabled="loading || !userInput.trim()">
          {{ loading ? 'Sending...' : 'Send' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    agentId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      agent: {},
      messages: [],
      userInput: '',
      loading: false,
      sessionId: null
    }
  },
  async created() {
    await this.fetchAgent()
    this.loadPreviousSession()
  },
  methods: {
    async fetchAgent() {
      try {
        this.agent = await this.$store.dispatch('agent/fetchAgent', this.agentId)
      } catch (error) {
        console.error('Failed to fetch agent:', error)
        this.$router.push('/agents')
      }
    },
    loadPreviousSession() {
      // Load previous session if exists
      const savedSession = localStorage.getItem(`chat_session_${this.agentId}`)
      if (savedSession) {
        const session = JSON.parse(savedSession)
        this.messages = session.messages
        this.sessionId = session.sessionId
      }
    },
    async sendMessage() {
      if (!this.userInput.trim() || this.loading) return
      
      const userMessage = {
        role: 'user',
        content: this.userInput
      }
      
      this.messages.push(userMessage)
      this.userInput = ''
      
      this.loading = true
      
      try {
        const response = await this.$store.dispatch('agent/executeAgent', {
          agentId: this.agentId,
          input: userMessage.content,
          parentExecutionId: this.sessionId
        })
        
        this.sessionId = response.execution_id
        
        this.messages.push({
          role: 'assistant',
          content: response.output
        })
        
        // Save session to localStorage
        localStorage.setItem(`chat_session_${this.agentId}`, JSON.stringify({
          sessionId: this.sessionId,
          messages: this.messages
        }))
        
      } catch (error) {
        console.error('Failed to send message:', error)
        this.messages.push({
          role: 'error',
          content: 'Failed to get response from the agent.'
        })
      } finally {
        this.loading = false
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  },
  watch: {
    messages() {
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.message {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 4px;
}

.message.user {
  background-color: #e3f2fd;
  margin-left: 20%;
  text-align: right;
}

.message.assistant {
  background-color: #f5f5f5;
  margin-right: 20%;
}

.message.error {
  background-color: #ffebee;
  color: #d32f2f;
}

.chat-input {
  padding: 10px 0;
}

.chat-input form {
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.chat-input button {
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-input button:disabled {
  background-color: #cccccc;
}
</style>