<template>
  <div class="register-container">
    <div
      class="circle"
      :style="{
        left: `${circlePosition.x - circleSize / 2}px`,
        top: `${circlePosition.y - circleSize / 2}px`,
        position: 'fixed',
        transform: 'none'
      }"
    ></div>
    <div class="register-form">
      <h2>注册</h2>
      <p v-if="error" class="error-message">{{ error }}</p>
      <input
        type="text"
        placeholder="用户名"
        v-model="username"
        class="input-field"
      />
      <input
        type="email"
        placeholder="邮箱"
        v-model="email"
        class="input-field"
      />
      <input
        type="password"
        placeholder="密码"
        v-model="password"
        class="input-field"
      />
      <button type="submit" @click="handleSubmit" :disabled="isLoading" class="register-button">
        {{ isLoading ? 'Registering...' : 'Register' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);
const circlePosition = ref({ x: 0, y: 0 });
const circleSize = 25;

const validateForm = () => {
  if (!username.value || !email.value || !password.value) {
    error.value = 'All fields are required';
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    error.value = 'Please enter a valid email address';
    return false;
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long';
    return false;
  }
  error.value = '';
  return true;
};

const handleSubmit = async () => {
  if (validateForm()) {
    isLoading.value = true;
    try {
      await axios.post('http://localhost:5000/Auth/register', {
        username: username.value,
        email: email.value,
        password: password.value
      });
      console.log('User registered successfully');
    } catch (err) {
      console.error(err);
      error.value = 'Registration failed. Please try again.';
    } finally {
      isLoading.value = false;
    }
  }
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
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f4f9;
  text-align: center;
}

.register-form {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.1);
  width: 450px;
  z-index: 1;
}

.register-form h2 {
  margin-bottom: 20px;
  text-align: center;
  color: #333;
}

.input-field {
  width: 100%;
  padding: 12px;
  margin-bottom: 25px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 16px;
}

.register-button {
  width: 50%;
  padding: 15px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  text-align: center;
  font-size: 16px;
}

.register-button:hover {
  background-color: #0056b3;
}

.register-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  margin-bottom: 20px;
  text-align: center;
}

.register-container .circle {
  position: absolute;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background-color: rgb(0, 51, 255);
  pointer-events: none;
  opacity: 0.7;
  z-index: 2;
}
</style>