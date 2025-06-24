<template>
  <form @submit.prevent="handleSubmit">
    <input
      type="text"
      placeholder="Username"
      v-model="username"
    />
    <input
      type="email"
      placeholder="Email"
      v-model="email"
    />
    <input
      type="password"
      placeholder="Password"
      v-model="password"
    />
    <button type="submit">Register</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const username = ref('');
const email = ref('');
const password = ref('');

const handleSubmit = async () => {
  try {
    await axios.post('http://localhost:5000/Auth/register', {
      username: username.value,
      email: email.value,
      password: password.value
    });
    console.log('User registered successfully');
  } catch (error) {
    console.error(error);
  }
};
</script>