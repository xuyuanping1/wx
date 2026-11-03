<template>
  <view class="page">
    <view class="bg-layer">
      <view class="bg-gradient" />
      <view class="bg-overlay" />
    </view>

    <view class="content">
      <view class="hero">
        <uni-icons type="heart-filled" size="40" color="#FFFFFF" />
        <text class="hero-title">在一起的每一天</text>
        <text class="hero-sub">都值得被记住</text>
      </view>

      <view class="form-area glass-heavy">
        <text class="form-heading">开始记录你们的故事</text>

        <!-- #ifdef MP-WEIXIN -->
        <!-- 头像选择 -->
        <view class="avatar-section">
          <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image v-if="avatarUrl" :src="avatarUrl" class="avatar-img" mode="aspectFill" />
            <view v-else class="avatar-placeholder">
              <text class="avatar-plus">+</text>
            </view>
          </button>
          <text class="avatar-hint">选择头像</text>
        </view>

        <!-- 昵称输入（支持微信昵称建议） -->
        <view class="input-group">
          <text class="input-label">你的昵称</text>
          <input type="nickname"
                 v-model="nickname"
                 placeholder="点击获取微信昵称"
                 placeholder-class="ph"
                 class="text-input"
                 :maxlength="16" />
        </view>

        <!-- 邀请码 -->
        <view class="invite-toggle" @tap="hasInvite = !hasInvite">
          <view class="checkbox" :class="{ checked: hasInvite }">
            <text v-if="hasInvite" class="check-icon">✓</text>
          </view>
          <text class="invite-toggle-text">我有邀请码</text>
        </view>
        <view v-if="hasInvite" class="input-group">
          <input v-model="inviteCode"
                 placeholder="请输入对方的邀请码"
                 placeholder-class="ph"
                 class="text-input invite-input" />
        </view>

        <button class="start-btn pressable" :disabled="!nickname.trim()" :loading="loading" @tap="wxLogin">
          开始
        </button>
        <view class="guest-action" @tap="goGuest">
          <text class="guest-action-text">暂不登录，先随便逛逛 &gt;</text>
        </view>
        <!-- #endif -->

        <!-- #ifdef H5 -->
        <view class="input-group">
          <text class="input-label">你的昵称</text>
          <input v-model="nickname"
                 placeholder="怎么称呼你"
                 placeholder-class="ph"
                 class="text-input"
                 :maxlength="16" />
        </view>

        <!-- 邀请码 -->
        <view class="invite-toggle" @tap="hasInvite = !hasInvite">
          <view class="checkbox" :class="{ checked: hasInvite }">
            <text v-if="hasInvite" class="check-icon">✓</text>
          </view>
          <text class="invite-toggle-text">我有邀请码</text>
        </view>
        <view v-if="hasInvite" class="input-group">
          <input v-model="inviteCode"
                 placeholder="请输入对方的邀请码"
                 placeholder-class="ph"
                 class="text-input invite-input" />
        </view>

        <button class="start-btn pressable" :disabled="!nickname.trim()" :loading="loading" @tap="h5Login">
          开始
        </button>
        <view class="guest-action" @tap="goGuest">
          <text class="guest-action-text">暂不登录，先随便逛逛 &gt;</text>
        </view>
        <!-- #endif -->
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { request, upload } from '@/utils/request'
import { setLoginInfo } from '@/utils/auth'

const nickname = ref('')
const avatarUrl = ref('')
const loading = ref(false)
const hasInvite = ref(false)
const inviteCode = ref('')

function goGuest() {
  uni.switchTab({ url: '/pages/index/index' })
}

// #ifdef MP-WEIXIN
function onChooseAvatar(e) {
  // 先保存临时路径，登录成功后再上传
  avatarUrl.value = e.detail.avatarUrl
}

async function wxLogin() {
  if (!nickname.value.trim() || loading.value) return
  loading.value = true

  try {
    // 1. wx.login 获取 code
    const loginRes = await new Promise((resolve, reject) => {
      uni.login({ success: resolve, fail: reject })
    })
    const code = loginRes.code

    // 2. 调用后端微信登录（先不传头像，登录后上传）
    const user = await request({
      url: '/api/user/wx-login',
      method: 'POST',
      data: {
        code,
        nickname: nickname.value.trim(),
      },
    })

    if (!user || !user.id) {
      uni.showToast({ title: '登录失败，请重试', icon: 'none' })
      loading.value = false
      return
    }

    setLoginInfo(user)

    // 3. 登录成功后上传头像
    if (avatarUrl.value) {
      try {
        const data = await upload('/api/photo/upload', avatarUrl.value)
        if (data?.url) {
          await request({
            url: '/api/user/info',
            method: 'PUT',
            data: { avatarUrl: data.url },
          })
          user.avatarUrl = data.url
          uni.setStorageSync('userInfo', JSON.stringify(user))
        }
      } catch (e) {
        console.warn('头像上传失败', e)
      }
    }

    onLoginSuccess(user)
  } catch (e) {
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}
// #endif

// #ifdef H5
async function h5Login() {
  if (!nickname.value.trim() || loading.value) return
  loading.value = true

  try {
    const openid = 'h5_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)

    const user = await request({
      url: '/api/user/login',
      method: 'POST',
      data: {
        openid,
        nickname: nickname.value.trim(),
      },
    })

    onLoginSuccess(user)
  } catch (e) {
    uni.showToast({ title: '创建失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}
// #endif

async function onLoginSuccess(user) {
  setLoginInfo(user)

  // 有邀请码则自动接受绑定
  const code = inviteCode.value.trim() || uni.getStorageSync('pendingInviteToken')
  if (code) {
    uni.removeStorageSync('pendingInviteToken')
    try {
      await request({
        url: '/api/invite/accept',
        method: 'POST',
        data: { token: code },
      })
      user.partnerId = true
      uni.showToast({ title: '绑定成功', icon: 'success' })
    } catch (e) {
      uni.showToast({ title: '邀请码无效', icon: 'none' })
    }
  }

  if (user.partnerId) {
    uni.switchTab({ url: '/pages/index/index' })
  } else {
    uni.redirectTo({ url: '/pages/guide/index' })
  }
}
</script>

<style scoped>
.page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.bg-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
}
.bg-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    160deg,
    #F2C8D4 0%,
    #E8A0B4 35%,
    #C4DDF2 70%,
    #9FC5E8 100%
  );
}
.bg-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.08);
}

.content {
  position: relative;
  z-index: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 24px;
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}

/* Hero */
.hero {
  flex: 0 0 auto;
  text-align: center;
  margin-bottom: 24px;
}
.hero-emoji {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}
.hero-title {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 2px;
}
.hero-sub {
  display: block;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8px;
  font-weight: 300;
  letter-spacing: 3px;
}

/* Form area */
.form-area {
  flex: 0 0 auto;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 20px 24px;
}
.form-heading {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #2D2A2E;
  text-align: center;
  margin-bottom: 18px;
}

/* Avatar */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 14px;
}
.avatar-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  overflow: hidden;
  line-height: normal;
}
.avatar-btn::after {
  display: none;
}
.avatar-img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}
.avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #F2C8D4, #C4DDF2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-plus {
  font-size: 32px;
  color: #FFFFFF;
  font-weight: 300;
}
.avatar-hint {
  font-size: 12px;
  color: #A39DA8;
  margin-top: 8px;
}

.input-group {
  margin-bottom: 14px;
}

/* Invite toggle */
.invite-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 4px 0;
}
.checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #D1CDD3;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.checkbox.checked {
  background: #C47A92;
  border-color: #C47A92;
}
.check-icon {
  font-size: 12px;
  color: #FFFFFF;
  font-weight: 700;
}
.invite-toggle-text {
  font-size: 13px;
  color: #6B6570;
}
.invite-input {
  border-bottom: 1px solid rgba(196, 122, 146, 0.3);
}
.input-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #A39DA8;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.text-input {
  font-size: 17px;
  color: #2D2A2E;
  padding: 8px 0;
  border-bottom: 1px solid #F3ECF0;
  width: 100%;
}
.ph {
  color: #D1CDD3;
  font-weight: 300;
}

.start-btn {
  margin-top: 16px;
  width: 100%;
  height: 54px;
  border-radius: 28px;
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
  color: #FFFFFF;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: 4px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(232, 160, 180, 0.3);
}
.start-btn[disabled] {
  opacity: 0.5;
}
.guest-action {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
}
.guest-action-text {
  font-size: 14px;
  color: #C47A92;
  letter-spacing: 1px;
}
</style>
