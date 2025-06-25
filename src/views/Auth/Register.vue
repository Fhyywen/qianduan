<template>
  <form @submit.prevent="handleSubmit">
    <input
      type="text"
      placeholder="Username"
      v-model="username"
      required
    />
    <input
      type="email"
      placeholder="Email"
      v-model="email"
      required
    />
    <input
      type="password"
      placeholder="Password"
      v-model="password"
      required
      minlength="6"
    />
    <button type="submit" :disabled="isLoading">
      {{ isLoading ? 'Registering...' : 'Register' }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')

const isLoading = computed(() => store.getters['auth/isLoading'])
const error = computed(() => store.getters['auth/authError'])

const handleSubmit = async () => {
  try {
    await store.dispatch('auth/register', {
      username: username.value,
      email: email.value,
      password: password.value
    })
    router.push('/dashboard')
  } catch (err) {
    console.error('Registration error:', err)
  }
}
</script>

<style scoped>
.error {
  color: red;
}
</style>