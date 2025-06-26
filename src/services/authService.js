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
  
  getAccessToken() {
    return localStorage.getItem('access_token');
  },

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  },

  isAuthenticated() {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch (error) {
      console.error('令牌解析错误:', error);
      return false;
    }
  },

  async login(usernameOrEmail, password) {
    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username_or_email: usernameOrEmail,
          password: password,
        }),
        credentials: 'include',
      });
      console.log("登录中")
      const data = await response.json();
      console.log('登录响应:', data);
      
      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }
      
      if (!data.refresh_token) {
        throw new Error('响应中缺少刷新令牌字段');
      }
      
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return data;
      
    } catch (error) {
      console.error('登录错误:', error);
      throw error;
    }
  },

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.error('刷新令牌不存在，本地存储状态:', {
        access: this.getAccessToken(),
        refresh: refreshToken
      });
      this.logout();
      throw new Error('No refresh token');
    }
    
    try {
      console.log('开始刷新token，refresh token:', refreshToken.substring(0, 20) + '...')
      
      const response = await axios.post('http://localhost:5000/auth/refresh', null, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });
      
      console.log('刷新token响应:', response.data)
      
      if (!response.data.access_token) {
        throw new Error('刷新响应缺少访问令牌');
      }
      
      localStorage.setItem('access_token', response.data.access_token);
      
      // 如果响应中包含新的refresh token，也更新它
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      console.log('Token刷新成功')
      return response.data.access_token;
      
    } catch (error) {
      console.error('刷新令牌错误:', error);
      
      // 清除无效的token
      this.logout();
      
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          throw new Error('刷新令牌已过期，请重新登录');
        } else if (status >= 500) {
          throw new Error('服务器错误，请稍后重试');
        } else {
          throw new Error(data?.message || '刷新令牌失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接');
      } else {
        throw new Error('网络连接失败');
      }
    }
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // 路由跳转
    // import router from '@/router'; router.push('/login');
  }
}