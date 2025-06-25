import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // 如果需要跨域带cookie
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 对成功响应做统一处理
    return response.data;
  },
  (error) => {
    // 对错误响应做统一处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // token过期或无效，跳转到登录页
          localStorage.removeItem('access_token');
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          break;
        case 403:
          error.message = '您没有权限执行此操作';
          break;
        case 404:
          error.message = '请求的资源不存在';
          break;
        case 500:
          error.message = '服务器内部错误';
          break;
        default:
          error.message = error.response.data?.message || '请求失败';
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      error.message = '网络连接异常，请检查网络设置';
    } else {
      // 请求设置出错
      error.message = error.message || '未知错误';
    }
    
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export default api;