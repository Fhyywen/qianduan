<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>Chat with {{ agent.name }}</h2>
      <div class="header-actions">
        <button @click="testTongyiService" class="test-btn" title="Test TongyiService">Test Service</button>
        <button @click="testApiConnection" class="test-btn" title="Test API Connection">Test API</button>
        <button @click="clearSession" class="clear-btn" title="Clear Chat Session">Clear Chat</button>
        <router-link :to="`/agents/${agent.id}`" class="btn">Agent Details</router-link>
      </div>
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
      try {
        const savedSession = localStorage.getItem(`chat_session_${this.agentId}`)
        if (savedSession) {
          const session = JSON.parse(savedSession)
          this.messages = session.messages || []
          this.sessionId = session.sessionId || null
          console.log('已加载之前的会话:', {
            messageCount: this.messages.length,
            sessionId: this.sessionId,
            timestamp: session.timestamp
          })
        } else {
          console.log('没有找到之前的会话')
        }
      } catch (error) {
        console.error('加载会话失败:', error)
        // 如果加载失败，清除可能损坏的数据
        localStorage.removeItem(`chat_session_${this.agentId}`)
        this.messages = []
        this.sessionId = null
      }
    },
    saveSession() {
      // Save current session to localStorage
      try {
        const session = {
          messages: this.messages || [],
          sessionId: this.sessionId || null,
          timestamp: Date.now(),
          agentId: this.agentId
        }
        
        // 限制保存的消息数量，避免localStorage过大
        if (session.messages.length > 50) {
          session.messages = session.messages.slice(-50)
          console.log('消息数量过多，只保存最近50条')
        }
        
        localStorage.setItem(`chat_session_${this.agentId}`, JSON.stringify(session))
        console.log('会话已保存到本地存储:', {
          messageCount: session.messages.length,
          sessionId: session.sessionId,
          timestamp: session.timestamp
        })
      } catch (error) {
        console.error('保存会话失败:', error)
        // 如果保存失败，尝试清除一些数据再保存
        try {
          const minimalSession = {
            messages: this.messages.slice(-10), // 只保存最近10条
            sessionId: this.sessionId,
            timestamp: Date.now(),
            agentId: this.agentId
          }
          localStorage.setItem(`chat_session_${this.agentId}`, JSON.stringify(minimalSession))
          console.log('已保存简化版会话')
        } catch (retryError) {
          console.error('保存简化版会话也失败:', retryError)
        }
      }
    },
    clearSession() {
      // Clear current session with confirmation
      if (this.messages.length > 0) {
        if (confirm('确定要清除所有聊天记录吗？此操作不可撤销。')) {
          localStorage.removeItem(`chat_session_${this.agentId}`)
          this.messages = []
          this.sessionId = null
          console.log('会话已清除')
          
          // 显示清除成功的提示
          this.$nextTick(() => {
            this.messages.push({
              role: 'system',
              content: '聊天记录已清除，开始新的对话吧！'
            })
          })
        }
      } else {
        console.log('没有聊天记录需要清除')
      }
    },
    async sendMessage() {
      if (!this.userInput.trim() || this.loading) return;
      
      // 确保 agent 存在且有效
      if (!this.agent?.id) {
        console.error('No valid agent selected');
        return;
      }

      const userMessage = {
        role: 'user',
        content: this.userInput.trim() // 确保去除空白字符
      };

      this.messages.push(userMessage);
      this.userInput = '';
      this.loading = true;
      
      try {
        console.log('发送消息到代理:', {
          agentId: this.agent.id,
          userInput: userMessage.content,
          parentExecutionId: this.sessionId
        });

        const response = await this.$store.dispatch('agent/executeAgent', {
          agentId: this.agent.id, // 确保传递正确的 agentId
          userInput: userMessage.content, // 使用格式化后的内容
          parentExecutionId: this.sessionId
        });

        console.log("获得的响应", response);
        
        // 处理响应数据
        const { responseText, execution_id } = response;
        
        if (!responseText) {
          throw new Error('AI未返回有效响应');
        }
        
        console.log("提取的:", responseText, execution_id);
        
        // 更新会话ID
        if (execution_id) {
          this.sessionId = execution_id;
        }
        
        // 将AI的回复添加到消息列表
        this.messages.push({
          role: 'assistant',
          content: responseText // 使用responseText作为回复内容
        });
        
        console.log('当前messages数组:', this.messages);

        // 保存会话到本地存储
        this.saveSession();
        
      } catch (error) {
        console.error('Failed to send message:', error);
        
        let errorMessage = '发送消息失败';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        this.messages.push({
          role: 'error',
          content: errorMessage
        });
      } finally {
        this.loading = false;
      }
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },
    // 测试API连接
    async testApiConnection() {
      console.log('测试API连接...');
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        console.log('当前token:', token ? token.substring(0, 20) + '...' : '无token');
        
        // 测试简单的API调用
        const response = await fetch('http://localhost:5000/agents', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('API测试响应状态:', response.status);
        const data = await response.json();
        console.log('API测试响应数据:', data);
        
        return data;
      } catch (error) {
        console.error('API测试失败:', error);
        throw error;
      }
    },
    
    // 测试TongyiService
    async testTongyiService() {
      console.log('测试TongyiService...');
      try {
        if (!this.agent) {
          throw new Error('没有可用的智能体');
        }
        
        console.log('测试智能体:', this.agent);
        
        const result = await this.$store.dispatch('agent/executeAgent', {
          agentId: this.agent.id,
          userInput: 'Hello, this is a test message.',
          parentExecutionId: null
        });
        
        console.log('TongyiService测试结果:', result);
        return result;
      } catch (error) {
        console.error('TongyiService测试失败:', error);
        throw error;
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
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.chat-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 600;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chat-header .btn {
  padding: 10px 20px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.chat-header .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.chat-header .header-actions {
  display: flex;
  gap: 10px;
}

.chat-header .test-btn {
  padding: 10px 20px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.chat-header .test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.chat-header .clear-btn {
  padding: 10px 20px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.chat-header .clear-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 10px;
}

.message {
  margin-bottom: 15px;
  padding: 15px 20px;
  border-radius: 20px;
  position: relative;
  animation: fadeInUp 0.3s ease-out;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  margin-left: 20%;
  text-align: right;
  border-bottom-right-radius: 5px;
}

.message.assistant {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  margin-right: 20%;
  border-bottom-left-radius: 5px;
}

.message.error {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  text-align: center;
  margin: 0 10%;
}

.message.system {
  background: linear-gradient(135deg, #74b9ff, #0984e3);
  color: white;
  text-align: center;
  margin: 0 10%;
  font-style: italic;
}

.message-content {
  font-size: 1rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.chat-input {
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.chat-input form {
  display: flex;
  gap: 15px;
  align-items: center;
}

.chat-input input {
  flex: 1;
  padding: 15px 20px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 25px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  outline: none;
}

.chat-input input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.chat-input input::placeholder {
  color: #999;
}

.chat-input button {
  padding: 15px 30px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  min-width: 100px;
}

.chat-input button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.chat-input button:disabled {
  background: linear-gradient(45deg, #bdc3c7, #95a5a6);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-container {
    margin: 10px;
    padding: 15px;
    border-radius: 15px;
  }
  
  .chat-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .message.user,
  .message.assistant {
    margin-left: 10%;
    margin-right: 10%;
  }
  
  .chat-input form {
    flex-direction: column;
  }
  
  .chat-input button {
    width: 100%;
  }
}
</style>