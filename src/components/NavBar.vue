<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/">Agent Platform</router-link>
    </div>
    
    <div class="navbar-links">
      <router-link to="/agents">Agents</router-link>
      
      <template v-if="isAuthenticated">
        <span class="username">{{ currentUser.username }}</span>
        <button @click="logout">Logout</button>
      </template>
      
      <template v-else>
        <router-link to="/login">Login</router-link>
        <router-link to="/register">Register</router-link>
      </template>
    </div>
  </nav>
</template>

<script>
export default {
  computed: {
    isAuthenticated() {
      return this.$store.getters['auth/isAuthenticated']
    },
    currentUser() {
      return this.$store.getters['auth/currentUser'] || {}
    }
  },
  methods: {
    logout() {
      this.$store.dispatch('auth/logout')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #2c3e50;
  color: white;
}

.navbar a {
  color: white;
  text-decoration: none;
  margin: 0 10px;
}

.navbar a.router-link-exact-active {
  color: #42b983;
}

.navbar-links {
  display: flex;
  align-items: center;
}

.username {
  margin: 0 10px;
  color: #42b983;
}

button {
  background: none;
  border: 1px solid white;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>