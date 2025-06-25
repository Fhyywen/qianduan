<template>
  <form @submit.prevent="handleSubmit" class="agent-form">
    <!-- Name Field -->
    <div class="form-group">
      <label for="name">Agent Name *</label>
      <input
        id="name"
        v-model="formData.name"
        type="text"
        required
        placeholder="My Awesome Agent"
        :class="{ 'error': errors.name }"
      />
      <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
    </div>

    <!-- Description Field -->
    <div class="form-group">
      <label for="description">Description</label>
      <textarea
        id="description"
        v-model="formData.description"
        rows="3"
        placeholder="What does this agent do?"
      ></textarea>
    </div>

    <!-- System Prompt Field -->
    <div class="form-group">
      <label for="system_prompt">System Prompt *</label>
      <textarea
        id="system_prompt"
        v-model="formData.system_prompt"
        rows="8"
        required
        placeholder="You are a helpful assistant..."
        :class="{ 'error': errors.system_prompt }"
      ></textarea>
      <span v-if="errors.system_prompt" class="error-message">{{ errors.system_prompt }}</span>
      <div class="hint">
        This defines how your agent behaves. Be clear about its role and capabilities.
      </div>
    </div>

    <!-- Model Selection -->
    <div class="form-row">
      <div class="form-group">
        <label for="model">Model *</label>
        <select
          id="model"
          v-model="formData.model"
          required
          :class="{ 'error': errors.model }"
        >
          <option value="">Select a model</option>
          <option v-for="model in availableModels" :key="model.id" :value="model.id">
            {{ model.name }} ({{ model.id }})
          </option>
        </select>
        <span v-if="errors.model" class="error-message">{{ errors.model }}</span>
      </div>

      <!-- Temperature Slider -->
      <div class="form-group">
        <label for="temperature">Temperature: {{ formData.temperature }}</label>
        <input
          id="temperature"
          v-model.number="formData.temperature"
          type="range"
          min="0"
          max="1"
          step="0.1"
          class="slider"
        />
        <div class="slider-labels">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      </div>
    </div>

    <!-- Advanced Settings -->
    <div class="advanced-settings" :class="{ 'expanded': showAdvanced }">
      <button type="button" class="toggle-advanced" @click="toggleAdvanced">
        {{ showAdvanced ? '▲ Hide Advanced Settings' : '▼ Show Advanced Settings' }}
      </button>

      <div v-if="showAdvanced" class="advanced-content">
        <div class="form-row">
          <!-- Max Tokens -->
          <div class="form-group">
            <label for="max_tokens">Max Tokens *</label>
            <input
              id="max_tokens"
              v-model.number="formData.max_tokens"
              type="number"
              min="100"
              max="4000"
              required
              :class="{ 'error': errors.max_tokens }"
            />
            <span v-if="errors.max_tokens" class="error-message">{{ errors.max_tokens }}</span>
            <div class="hint">
              Maximum length of the response (100-4000)
            </div>
          </div>

          <!-- Top P -->
          <div class="form-group">
            <label for="top_p">Top P</label>
            <input
              id="top_p"
              v-model.number="formData.top_p"
              type="number"
              min="0"
              max="1"
              step="0.1"
            />
            <div class="hint">
              Controls diversity (0-1)
            </div>
          </div>
        </div>

        <!-- Additional Parameters -->
        <div class="form-row">
          <div class="form-group">
            <label for="presence_penalty">Presence Penalty</label>
            <input
              id="presence_penalty"
              v-model.number="formData.presence_penalty"
              type="number"
              min="-2"
              max="2"
              step="0.1"
            />
            <div class="hint">
              Penalize new tokens based on whether they appear in the text so far (-2 to 2)
            </div>
          </div>

          <div class="form-group">
            <label for="frequency_penalty">Frequency Penalty</label>
            <input
              id="frequency_penalty"
              v-model.number="formData.frequency_penalty"
              type="number"
              min="-2"
              max="2"
              step="0.1"
            />
            <div class="hint">
              Penalize new tokens based on their frequency in the text so far (-2 to 2)
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Visibility Toggle -->
    <div class="form-group checkbox-group">
      <input
        id="is_public"
        v-model="formData.is_public"
        type="checkbox"
      />
      <label for="is_public">Make this agent public</label>
      <div class="hint">
        Public agents can be seen and used by other users
      </div>
    </div>

    <!-- Form Actions -->
    <div class="form-actions">
      <button type="submit" :disabled="loading" class="btn-primary">
        <span v-if="loading">
          <i class="spinner"></i> Processing...
        </span>
        <span v-else>
          {{ submitText }}
        </span>
      </button>
      <button 
        v-if="showCancel"
        type="button" 
        @click="handleCancel"
        class="btn-secondary"
      >
        Cancel
      </button>
    </div>

    <!-- Form Error -->
    <div v-if="formError" class="form-error">
      <i class="error-icon"></i>
      {{ formError }}
    </div>
  </form>
</template>

<script>
export default {
  name: 'AgentForm',
  props: {
    initialData: {
      type: Object,
      default: () => ({
        name: '',
        description: '',
        system_prompt: '',
        model: 'qwen-turbo',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1.0,
        presence_penalty: 0,
        frequency_penalty: 0,
        is_public: false
      })
    },
    showCancel: {
      type: Boolean,
      default: false
    },
    submitText: {
      type: String,
      default: 'Save Agent'
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      formData: { ...this.initialData },
      availableModels: [],
      showAdvanced: false,
      errors: {},
      formError: ''
    }
  },
  async created() {
    await this.fetchAvailableModels()
  },
  methods: {
    async fetchAvailableModels() {
    try {
      // 从Vuex获取模型列表
      this.availableModels = await this.$store.dispatch('agent/fetchAvailableModels')
      
      // 确保当前选择的model在列表中
      if (!this.availableModels.some(m => m.id === this.formData.model)) {
        this.formData.model = this.availableModels[0]?.id || ''
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      // 使用默认值
      this.availableModels = [
        { id: 'qwen-turbo', name: '通义千问Turbo' },
        { id: 'qwen-plus', name: '通义千问Plus' },
        { id: 'qwen-max', name: '通义千问Max' }
      ]
    }
  },
    validateForm() {
      this.errors = {}
      let isValid = true

      // Name validation
      if (!this.formData.name.trim()) {
        this.errors.name = 'Agent name is required'
        isValid = false
      } else if (this.formData.name.length > 50) {
        this.errors.name = 'Name must be less than 50 characters'
        isValid = false
      }

      // System prompt validation
      if (!this.formData.system_prompt.trim()) {
        this.errors.system_prompt = 'System prompt is required'
        isValid = false
      } else if (this.formData.system_prompt.length > 5000) {
        this.errors.system_prompt = 'Prompt must be less than 5000 characters'
        isValid = false
      }

      // Model validation
      if (!this.formData.model) {
        this.errors.model = 'Please select a model'
        isValid = false
      }

      // Max tokens validation
      if (!this.formData.max_tokens || this.formData.max_tokens < 100 || this.formData.max_tokens > 4000) {
        this.errors.max_tokens = 'Max tokens must be between 100 and 4000'
        isValid = false
      }

      return isValid
    },
    handleSubmit() {
      if (!this.validateForm()) {
        return
      }

      this.$emit('submit', {
        ...this.formData,
        // Ensure numeric values are properly typed
        temperature: parseFloat(this.formData.temperature),
        max_tokens: parseInt(this.formData.max_tokens),
        top_p: parseFloat(this.formData.top_p || 1.0),
        presence_penalty: parseFloat(this.formData.presence_penalty || 0),
        frequency_penalty: parseFloat(this.formData.frequency_penalty || 0)
      })
    },
    handleCancel() {
      this.$emit('cancel')
    },
    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced
    }
  },
  watch: {
    initialData: {
      deep: true,
      handler(newVal) {
        this.formData = { ...newVal }
        this.errors = {}
        this.formError = ''
      }
    }
  }
}
</script>

<style scoped>
.agent-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

input[type="text"],
input[type="number"],
textarea,
select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

input[type="text"]:focus,
input[type="number"]:focus,
textarea:focus,
select:focus {
  border-color: #42b983;
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

textarea {
  min-height: 120px;
  resize: vertical;
  line-height: 1.5;
}

select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
}

.slider {
  width: 100%;
  margin-top: 8px;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.checkbox-group input {
  width: auto;
  margin-right: 10px;
}

.checkbox-group label {
  margin-bottom: 0;
  font-weight: normal;
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.advanced-settings {
  margin: 25px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  padding: 15px 0;
}

.toggle-advanced {
  background: none;
  border: none;
  color: #42b983;
  font-size: 14px;
  cursor: pointer;
  padding: 5px 0;
  display: flex;
  align-items: center;
}

.toggle-advanced:hover {
  text-decoration: underline;
}

.advanced-content {
  margin-top: 15px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.btn-primary {
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #3aa876;
}

.btn-primary:disabled {
  background-color: #a0d9bb;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background-color: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.error {
  border-color: #f44336 !important;
}

.error-message {
  display: block;
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
}

.form-error {
  margin-top: 20px;
  padding: 10px;
  background-color: #ffebee;
  color: #f44336;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.error-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  background-color: #f44336;
  mask: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3ccircle cx='12' cy='12' r='10'%3e%3c/circle%3e%3cline x1='12' y1='8' x2='12' y2='12'%3e%3c/line%3e%3cline x1='12' y1='16' x2='12.01' y2='16'%3e%3c/line%3e%3c/svg%3e");
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>