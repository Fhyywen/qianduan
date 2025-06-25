// src/services/authService.js
import axios from 'axios'  // 确保正确导入axios

const API_URL = 'http://localhost:5000'

export default {
  async register(userData) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData)
      return response.data
    } catch (error) {
      throw error
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
      const response = await axios.post(`${API_URL}/auth/refresh`)
      return response.data
    } catch (error) {
      throw error
    }
  }
}