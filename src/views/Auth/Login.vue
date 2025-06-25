<template>
  <form @submit.prevent="handleSubmit" class="login-form">
    <input
      type="text"
      placeholder="Username or Email"
      v-model="usernameOrEmail"
      required
    />
    <input
      type="password"
      placeholder="Password"
      v-model="password"
      required
    />
    <button type="submit" :disabled="loading">
      {{ loading ? 'Logging in...' : 'Login' }}
    </button>
    <p v-if="error" class="error-message">{{ error }}</p>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const store = useStore()

const usernameOrEmail = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await axios.post('http://localhost:5000/auth/login', {
      username_or_email: usernameOrEmail.value,
      password: password.value
    })
    
    // 1. 先提交 mutation 更新状态
    store.commit('auth/SET_TOKEN', response.data.access_token)
    
    // 2. 等待用户信息加载完成
    await store.dispatch('auth/loadUser')
    
    // 3. 检查重定向路径或默认跳转
    const redirectPath = route.query.redirect || '/agents'
    
    // 4. 使用 replace 而不是 push 避免历史记录问题
    await router.replace(redirectPath)
    
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed'
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 10px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
}

.error-message {
  color: #f44336;
  margin-top: 10px;
}
</style>