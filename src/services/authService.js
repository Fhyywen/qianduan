// src/services/authService.js
import axios from 'axios'  // 确保正确导入axios

const API_URL = 'http://localhost:5000'

export default {
  async register(userData) {
    try {
      const response = await api.post('/auth/refresh', 
      {},  // 空 body
      {
        withCredentials: true,  // 关键配置
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Refresh token failed:', error);
    throw error;
  }
  },
  
  async login(usernameOrEmail, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        usernameOrEmail,
        password
      })
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  // 添加refreshToken方法
  async refreshToken() {
    try {
      const response = await axios.post(
      'http://localhost:5000/auth/refresh',
      {},  // 不需要 body，refresh_token 通过 Cookie 或 Authorization 头传递
      {
        withCredentials: true,  // 如果使用 Cookie
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    localStorage.setItem('access_token', response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error('Refresh failed:', error);
    logoutUser();  // 跳转到登录页
  }
}
}