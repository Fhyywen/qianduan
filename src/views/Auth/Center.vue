<template>
  <div class="profile-content">
    <h2>个人中心</h2>
    
    <!-- 头像设置部分保持不变 -->
    <div class="profile-section">
      <h3>头像设置</h3>
      <div class="avatar-container">
        <div
          class="profile-avatar-wrapper"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
          @click="handleAvatarClick"
        >
          <img
            :src="avatarUrl"
            alt="Avatar"
            class="profile-avatar"
          />
          <div v-if="isHovering" class="avatar-hover-text">点击上传新头像</div>
        </div>
        <input
          type="file"
          id="avatar"
          @change="handleAvatarChange"
          accept="image/*"
          style="display: none"
        />
      </div>
    </div>
    
    <!-- 账号设置部分修改为展示邮箱和管理员状态 -->
    <div class="profile-section">
      <h3>账号信息</h3>
      <div class="input-group">
        <label>用户邮箱</label>
        <input
          type="email"
          placeholder="用户邮箱"
          v-model="userEmail"
          disabled 
        />
      </div>
      <div class="input-group">
        <label>管理员状态</label>
        <div class="admin-status">
          <span :class="{'admin-yes': isAdmin, 'admin-no': !isAdmin}">
            {{ isAdmin ? '是' : '否' }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- API设置部分保持不变 -->
    <div class="profile-section">
      <h3>API 设置</h3>
      <div class="input-group">
        <label>OpenAI API Key</label>
        <input
          type="text"
          placeholder="输入 OpenAI API 密钥"
          v-model="openaiApiKey"
        />
      </div>
      <div class="input-group">
        <label>通义 API Key</label>
        <input
          type="text"
          placeholder="输入通义 API 密钥"
          v-model="tongyiApiKey"
        />
      </div>
    </div>

    <button type="button" @click="handleSubmit">
      保存更改
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import defaultAvatar from './manbo.png';

const props = defineProps({
  token: {
    type: String,
    required: true
  }
});

// 新增：用户信息状态
const userEmail = ref('');
const isAdmin = ref(false);

const avatar = ref(null);
const newPassword = ref('');  // 保留但不再使用
const gender = ref('');       // 保留但不再使用
const openaiApiKey = ref('');
const tongyiApiKey = ref('');
const avatarUrl = ref(defaultAvatar);
const isHovering = ref(false);

// 头像处理函数保持不变
const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    avatar.value = file;
    const reader = new FileReader();
    reader.onloadend = () => {
      avatarUrl.value = reader.result;
    };
    reader.readAsDataURL(file);
  }
};

const handleAvatarClick = () => {
  document.getElementById('avatar').click();
};

const handleMouseEnter = () => {
  isHovering.value = true;
};

const handleMouseLeave = () => {
  isHovering.value = false;
};

// 新增：获取用户信息函数
const fetchUserInfo = async () => {
  const storedToken = localStorage.getItem('token');
  try {
    const response = await axios.get(
      'http://127.0.0.1:5000/auth/center',
      {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      }
    );
    
    if (response.data) {
      userEmail.value = response.data.email;
      isAdmin.value = response.data.is_admin;
    }
  } catch (error) {
    console.error('获取用户信息失败', error);
    alert('获取用户信息失败，请重试');
  }
};

const handleSubmit = async () => {
  const data = {
    openai_api_key: openaiApiKey.value,
    tongyi_api_key: tongyiApiKey.value
  };
  
  const storedToken = localStorage.getItem('token');
  console.log("发送的JSON数据:", data);
  console.log("JWT令牌:", props.token);

  try {
    const response = await axios.post(
      'http://127.0.0.1:5000/auth/center',
      data,
      {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(response.data);
    alert('API密钥更新成功!');
  } catch (error) {
    console.error(error);
    if (error.response && error.response.data) {
      alert(error.response.data.error || '更新失败，请重试');
    } else {
      alert('更新失败，请重试');
    }
  }
};

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped>
.profile-content {
  padding: 0 20px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  margin-left: 20px;
}

.profile-section {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.profile-section h3 {
  margin-top: 0;
  color: #333;
}

.avatar-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar-wrapper {
  position: relative;
  cursor: pointer;
  width: 120px;
  height: 120px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: none;
  box-shadow: none;
  transition: filter 0.3s ease;
}

.profile-avatar-wrapper:hover .profile-avatar {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  filter: brightness(90%);
}

.avatar-hover-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.profile-avatar-wrapper:hover .avatar-hover-text {
  opacity: 1;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.input-group input,
.input-group select {
  width: 95%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

/* 新增：管理员状态样式 */
.admin-status {
  width: 95%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  display: flex;
  align-items: center;
}

.admin-yes {
  color: #28a745; /* 绿色 */
  font-weight: bold;
  margin-right: 8px;
}

.admin-no {
  color: #dc3545; /* 红色 */
  font-weight: bold;
  margin-right: 8px;
}

/* 只读输入框样式 */
.input-group input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  border-color: #ddd;
}

button {
  width: 95%;
  padding: 14px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}
</style>