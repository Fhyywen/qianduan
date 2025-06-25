<template>
  <div class="login-container">
    <div
      class="circle"
      :style="{
        left: `${circlePosition.x - circleSize / 2}px`,
        top: `${circlePosition.y - circleSize / 2}px`,
        position: 'fixed'
      }"
    ></div>
    <form @submit.prevent="handleSubmit" class="login-form">
      <h2>登录</h2>
      <div class="input-group">
        <input
          type="text"
          placeholder="用户名或邮箱"
          v-model="usernameOrEmail"
          required
        />
      </div>
      <div class="input-group">
        <input
          type="password"
          placeholder="密码"
          v-model="password"
          required
        />
      </div>
      <div style="display: flex; gap: 10px">
        <button type="button" @click="goToRegister">Register</button>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </div>
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const props = defineProps({
  setToken: {
    type: Function,
    default: (token) => {
      console.warn('No setToken function provided, using default');
      localStorage.setItem('token', token);
    }
  }
});

const usernameOrEmail = ref('');
const password = ref('');
const loading = ref(false);
const error = ref(null);
const circlePosition = ref({ x: 0, y: 0 });
const circleSize = 25;

const handleSubmit = async () => {
  try {
    loading.value = true;
    error.value = null;

    const response = await axios.post('http://localhost:5000/auth/login', {
      username_or_email: usernameOrEmail.value,
      password: password.value
    });

    // 调用父组件方法或使用默认处理
    props.setToken(response.data.access_token);
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed';
    console.error('Login error:', err);
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  window.location.href = '/register';
};

const handleMouseMove = (e) => {
  circlePosition.value = { x: e.clientX, y: e.clientY };
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f7fa;
  position: relative;
  overflow: hidden;
  text-align: center;
}

.login-form {
  background-color: #fff;
  border-radius: 8px;
  padding:30px;
  box-shadow: 4px 4px 6px rgba(0, 0, 0, 0.1);
  /* 增大 width */
  width: 450px;
  z-index: 1;
}

.login-form h2 {
  margin-bottom: 20px;
  text-align: center;
  color: #333;
}

.input-group {
  margin-bottom: 25px;
  justify-content: center;
  display: flex;
}

.input-group input {
  width: 95%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.input-group input::placeholder {
  color: #999;
}

.login-form button {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  justify-content: center;
  display: flex;

}

.login-form button:hover {
  background-color: #0056b3;
}

.login-container .circle {
  position: absolute;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background-color: rgb(0, 51, 255);
  pointer-events: none;
  z-index: 2;
  opacity: 0.7;
}

.error-message {
  color: #f44336;
  margin-top: 10px;
}
</style>