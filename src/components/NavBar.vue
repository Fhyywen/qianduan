<template>
  <div class="app-container">
    <!-- 左侧导航栏（仅在登录后显示） -->
    <div class="sidebar" v-if="isAuthenticated">
      <div class="sidebar-menu">
        <router-link to="/center" class="menu-item">
          <span class="menu-icon">👤</span>
          <span class="menu-text">个人中心</span>
        </router-link>
        <router-link to="/agents" class="menu-item">
          <span class="menu-icon">🤖</span>
          <span class="menu-text">智能体管理</span>
        </router-link>
        <!-- 可以添加更多菜单项 -->
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 顶部导航栏 -->
      <nav class="navbar">
        <div class="navbar-brand">
          <router-link to="/">智能体平台</router-link>
        </div>

        <div class="navbar-links">
          <template v-if="isAuthenticated">
            <div class="user-info" @mouseenter="handleUserInfoHoverEnter" @mouseleave="handleUserInfoHoverLeave">
              <span class="username">{{ currentUser.username }}</span>
              <div style="position: relative">
                <img
                  :src="avatarUrl"
                  alt="Avatar"
                  class="avatar"
                />
                <div :class="{ 'dropdown-menu': true, 'show': isDropdownOpen }">
                  <button class="dropdown-item" @click="logout">
                    <span class="icon">🚪</span> 退出
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <router-link to="/login">登录</router-link>
            <router-link to="/register">注册</router-link>
          </template>
        </div>
      </nav>

      <!-- 页面内容 -->
      <router-view />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import defaultAvatar from './manbo.png';

export default {
  data() {
    return {
      isDropdownOpen: ref(false),
      avatarUrl: defaultAvatar
    };
  },
  computed: {
    isAuthenticated() {
      return this.$store.getters['auth/isAuthenticated'];
    },
    currentUser() {
      return this.$store.getters['auth/currentUser'] || {};
    }
  },
  methods: {
    logout() {
      this.$store.dispatch('auth/logout');
      this.$router.push('/login');
    },
    handleUserInfoHoverEnter() {
      this.isDropdownOpen = true;
    },
    handleUserInfoHoverLeave() {
      this.isDropdownOpen = false;
    }
  }
};
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background-color: #2c3e50;
  color: white;
  padding: 20px 0;
  min-height: 100vh;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: white;
  text-decoration: none;
  transition: background-color 0.3s;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-item.router-link-exact-active {
  background-color: #42b983;
}

.menu-icon {
  margin-right: 10px;
  font-size: 18px;
}

.menu-text {
  font-size: 16px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px;
  background-color: #f4f4f9;
  color: #333;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

}

.navbar a {
  color: #333;
  text-decoration: none;
  margin: 0 10px;
}

.navbar a.router-link-exact-active {
  color: #42b983;
  font-weight: bold;
}

.navbar-links {
  display: flex;
  align-items: center;

}

.user-info {
  display: flex;
  align-items: center;
  margin-right: 80px;
}

.username {
  color: #2c3e50;
  font-weight: 500;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid #ddd;
  transition: transform 0.3s;
}

.avatar:hover {
  transform: scale(1.2);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: none;
  z-index: 100;
  min-width: 120px;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: #333;
}

.dropdown-item:hover {
  background-color: #f0f0f0;
}

.icon {
  margin-right: 8px;
}
</style>