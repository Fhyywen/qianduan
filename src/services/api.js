import axios from 'axios';
import authService from './authService'; // 假设存在认证服务处理令牌逻辑

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // 跨域请求携带Cookie
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证头并处理请求配置
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // 为不同类型的请求设置不同的超时时间
    if (config.url?.includes('/execute')) {
      config.timeout = 60000; // 执行请求60秒超时
    } else if (config.url?.includes('/agents') && config.method === 'post') {
      config.timeout = 45000; // 创建代理45秒超时
    }
    
    // 添加请求开始时间，用于性能监控
    config.__requestStart = Date.now();
    return config;
  },
  (error) => {
    console.error('请求配置错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一处理响应和错误
api.interceptors.response.use(
  (response) => {
    // 计算请求耗时并记录（可选）
    const requestTime = Date.now() - response.config.__requestStart;
    if (requestTime > 5000) {
      console.warn(`请求耗时较长: ${requestTime}ms`, response.config.url);
    }
    
    // 处理2xx以外的状态码（虽然axios会将2xx视为成功）
    if (response.status >= 300) {
      return Promise.reject(new Error(response.data?.message || '请求失败'));
    }
    
    // 返回response.data以保持向后兼容
    return response.data;
  },
  async (error) => {
    // 统一错误处理逻辑
    let errorMessage = '未知错误';
    
    if (error.response) {
      // 服务器返回了状态码，但不是2xx
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 令牌过期或无效，尝试刷新令牌
          errorMessage = '登录状态已过期，请重新登录';
          return handle401Error(error);
          
        case 403:
          errorMessage = data?.message || '权限不足，无法访问此资源';
          break;
          
        case 404:
          errorMessage = '请求的资源不存在';
          break;
          
        case 408:
          errorMessage = '请求超时，请稍后重试';
          break;
          
        case 500:
          errorMessage = data?.message || '服务器内部错误，请稍后再试';
          break;
          
        case 502:
        case 503:
        case 504:
          errorMessage = '服务器暂时不可用，请稍后重试';
          break;
          
        default:
          errorMessage = data?.message || `请求失败 (状态码: ${status})`;
      }
    } else if (error.request) {
      // 请求已发出但未收到响应（网络问题）
      errorMessage = '网络连接失败，请检查您的网络设置';
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // 处理超时错误
      errorMessage = '请求超时，请稍后重试';
    } else {
      // 请求设置出错
      errorMessage = error.message || '请求配置错误';
    }
    
    // 显示错误提示（可根据项目需求替换为Toast或Modal）
    console.error('API错误:', errorMessage);
    // 示例：Vue项目中可通过this.$message.error(errorMessage)显示提示
    
    return Promise.reject(new Error(errorMessage));
  }
);

// 处理401错误的专用函数
async function handle401Error(error) {
  const originalRequest = error.config;
  
  // 防止重复刷新令牌
  if (originalRequest._retrying) {
    // 清除令牌并跳转登录
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    
    // 如果当前不在登录页，跳转到登录页
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
  
  originalRequest._retrying = true;
  
  try {
    // 调用刷新令牌的方法
    const authService = await import('./authService.js');
    const newAccessToken = await authService.default.refreshToken();
    if (newAccessToken) {
      // 更新请求头中的令牌
      localStorage.setItem('access_token', newAccessToken);
      originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
      
      // 重试原始请求
      return api(originalRequest);
    }
  } catch (refreshError) {
    console.error('令牌刷新失败:', refreshError);
    // 刷新失败，清除令牌并跳转登录
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }
  
  return Promise.reject(error);
}

export default api;