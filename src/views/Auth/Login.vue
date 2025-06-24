<template>
  <form @submit.prevent="handleSubmit">
    <input
      type="text"
      placeholder="Username or Email"
      v-model="usernameOrEmail"
    />
    <input
      type="password"
      placeholder="Password"
      v-model="password"
    />
    <button type="submit">Login</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const props = defineProps({
  setToken: {
    type: Function,
    required: true
  }
});

const usernameOrEmail = ref('');
const password = ref('');

const handleSubmit = async () => {
  try {
    const response = await axios.post('http://localhost:5000/Auth/login', {
      username_or_email: usernameOrEmail.value,
      password: password.value
    });
    props.setToken(response.data.access_token);
  } catch (error) {
    console.error(error);
  }
};
</script>