import api from './api'

export default {
  async login(usernameOrEmail, password) {
    const response = await api.post('/auth/login', {
      username_or_email: usernameOrEmail,
      password
    })
    return response.data
  },
  
  async register(username, email, password) {
    const response = await api.post('/auth/register', {
      username,
      email,
      password
    })
    return response.data
  },
  
  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  }
}