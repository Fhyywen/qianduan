<template>
  <div class="profile-content">
    <h2>个人中心</h2>
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

    <div class="profile-section">
      <h3>账号设置</h3>
      <div class="input-group">
        <label>修改密码</label>
        <input
          type="password"
          placeholder="输入新密码"
          v-model="newPassword"
        />
      </div>
      <div class="input-group">
        <label>修改性别</label>
        <select v-model="gender">
          <option value="">选择性别</option>
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
      </div>
    </div>

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
import { ref } from 'vue';
import axios from 'axios';
import defaultAvatar from './manbo.png';

const props = defineProps({
  token: {
    type: String,
    required: true
  }
});

const avatar = ref(null);
const newPassword = ref('');
const gender = ref('');
const openaiApiKey = ref('');
const tongyiApiKey = ref('');
const avatarUrl = ref(defaultAvatar);
const isHovering = ref(false);

// 头像处理函数保持不变...

const handleSubmit = async () => {
  // 构建JSON数据（不包含文件）
  const data = {
    openai_api_key: openaiApiKey.value,
    tongyi_api_key: tongyiApiKey.value
    // 如需传输其他字段：
    // new_password: newPassword.value,
    // gender: gender.value
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
          'Content-Type': 'application/json'  // 显式设置为JSON格式
        }
      }
    );
    console.log(response.data);
    alert('个人信息更新成功!');
  } catch (error) {
    console.error(error);
    if (error.response && error.response.data) {
      alert(error.response.data.error || '更新失败，请重试');
    } else {
      alert('更新失败，请重试');
    }
  }
};
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
  width: 120px; /* 固定宽度与头像相同 */
  height: 120px; /* 固定高度与头像相同 */
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  /* 移除默认的边框和阴影 */
  border: none;
  box-shadow: none;
  /* 移除右边距 */
  margin-right: 0;
  transition: filter 0.3s ease;
}

/* 只在悬停时显示边框和阴影 */
.profile-avatar-wrapper:hover .profile-avatar {
  border: none;
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
  pointer-events: none; /* 防止文字干扰点击 */
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

.input-group input:focus,
.input-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
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