import axios from 'axios'  // 确保正确导入axios
import store from '@/store'


const API_URL = 'http://localhost:5000'


export default {
  async register(userData) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, 
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
    // 不需要手动传 refreshToken，浏览器会自动携带 Cookie
    const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
      withCredentials: true, // 必须！确保浏览器发送 Cookie
    });

    if (!response.data?.access_token) {
      throw new Error('Invalid token response');
    }

    return response.data.access_token;
  } catch (error) {
    console.error('刷新令牌失败:', error);
    store.dispatch('auth/logout');
    throw error;
  }
}
}