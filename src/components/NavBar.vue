<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/">智能体平台</router-link>
    </div>
    
    <div class="navbar-links">
      <router-link to="/agents">智能体</router-link>
      
      <template v-if="isAuthenticated">
        <span class="username">{{ currentUser.username }}</span>
        <button @click="logout">登出</button>
      </template>
      
      <template v-else>
        <router-link to="/login">登录</router-link>
        <router-link to="/register">注册</router-link>
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