<template>
  <div id="app">
    <NavBar />
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'

export default {
  components: { NavBar },
  created() {
    // Try to refresh token on app startup
    this.$store.dispatch('auth/refreshToken')
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

body {
  margin: 0;
  padding: 0;
}
</style>