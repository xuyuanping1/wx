<template>
  <view class="page">
    <view class="bg-layer">
      <view class="bg-gradient" />
      <view class="bg-overlay" />
    </view>

    <view class="content">
      <view class="hero">
        <uni-icons type="heart-filled" size="44" color="#FFFFFF" />
        <text class="hero-title">情侣绑定邀请</text>
      </view>

      <view class="card glass-heavy">
        <view v-if="loading" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 没有 token 时显示输入邀请码 -->
        <view v-else-if="!token" class="input-state">
          <text class="input-title">输入邀请码</text>
          <text class="input-desc">请输入对方分享给你的邀请码</text>
          <input v-model="inputToken"
                 placeholder="请输入邀请码"
                 placeholder-class="ph"
                 class="code-input" />
          <button class="btn-primary pressable" :disabled="!inputToken.trim()" @tap="onSubmitCode">
            确认绑定
          </button>
          <button class="btn-secondary pressable" @tap="goHome">
            返回首页
          </button>
        </view>

        <view v-else-if="error" class="error-state">
          <text class="error-icon">😔</text>
          <text class="error-text">{{ error }}</text>
          <button class="btn-secondary pressable" @tap="goHome">返回首页</button>
        </view>

        <view v-else class="invite-info">
          <view class="inviter-row">
            <view class="inviter-avatar">
              <text class="avatar-text">{{ inviterNickname.charAt(0) || 'TA' }}</text>
            </view>
          </view>
          <text class="invite-desc">
            <text class="nickname">{{ inviterNickname }}</text>
            邀请你绑定情侣关系
          </text>
          <text class="invite-hint">绑定后你们可以一起记录纪念日、管理相册</text>

          <view class="actions">
            <button class="btn-primary pressable" @tap="acceptInvite">
              接受邀请
            </button>
            <button class="btn-secondary pressable" @tap="goHome">
              暂不绑定
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import { isLoggedIn, setLoginInfo, getUserInfo } from '@/utils/auth'

const loading = ref(false)
const error = ref('')
const token = ref('')
const inputToken = ref('')
const inviterNickname = ref('')

onLoad((options) => {
  token.value = options?.token || ''

  if (token.value) {
    loadInviteInfo()
  }
})

function onSubmitCode() {
  const code = inputToken.value.trim()
  if (!code) return
  token.value = code
  loadInviteInfo()
}

async function loadInviteInfo() {
  loading.value = true
  error.value = ''
  try {
    const data = await request({ url: `/api/invite/info?token=${token.value}` })
    inviterNickname.value = data.inviterNickname || '对方'
    loading.value = false
  } catch (e) {
    error.value = '邀请无效或已过期'
    loading.value = false
  }
}

async function acceptInvite() {
  // 未登录先跳登录
  if (!isLoggedIn()) {
    uni.setStorageSync('pendingInviteToken', token.value)
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }

  try {
    const inviter = await request({
      url: '/api/invite/accept',
      method: 'POST',
      data: { token: token.value },
    })

    uni.showToast({ title: '绑定成功！', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  } catch (e) {
    uni.showToast({ title: e.message || '绑定失败', icon: 'none' })
  }
}

function goHome() {
  if (isLoggedIn()) {
    uni.switchTab({ url: '/pages/index/index' })
  } else {
    uni.reLaunch({ url: '/pages/login/index' })
  }
}
</script>

<style scoped>
.page { position: relative; width: 100%; height: 100vh; overflow: hidden; }
.bg-layer { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
.bg-gradient {
  width: 100%; height: 100%;
  background: linear-gradient(160deg, #F2C8D4 0%, #E8A0B4 35%, #C4DDF2 70%, #9FC5E8 100%);
}
.bg-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.08); }

.content {
  position: relative; z-index: 1;
  height: 100vh;
  display: flex; flex-direction: column;
  justify-content: center;
  padding: 0 24px;
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}

.hero { flex: 0 0 auto; text-align: center; margin-bottom: 24px; }
.hero-emoji { font-size: 44px; display: block; margin-bottom: 12px; }
.hero-title { display: block; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: 2px; }

.card {
  flex: 0 0 auto;
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 24px;
  padding: 24px 24px;
}

.loading-state, .error-state { text-align: center; padding: 32px 0; }
.loading-text { font-size: 15px; color: #A39DA8; }
.error-icon { font-size: 36px; display: block; margin-bottom: 12px; }
.error-text { font-size: 15px; color: #6B6570; display: block; margin-bottom: 20px; }

/* 输入邀请码 */
.input-state { text-align: center; }
.input-title { display: block; font-size: 18px; font-weight: 600; color: #2D2A2E; margin-bottom: 8px; }
.input-desc { display: block; font-size: 13px; color: #A39DA8; margin-bottom: 20px; }
.code-input {
  font-size: 17px; color: #2D2A2E; text-align: center;
  padding: 12px 0; margin-bottom: 20px;
  border-bottom: 1px solid #F3ECF0; width: 100%;
}
.ph { color: #D1CDD3; }

.invite-info { text-align: center; }
.inviter-row { margin-bottom: 16px; }
.inviter-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, #F2C8D4, #C4DDF2);
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(232,160,180,0.2);
}
.avatar-text { font-size: 22px; font-weight: 600; color: #FFFFFF; }

.invite-desc {
  display: block; font-size: 17px; color: #2D2A2E; font-weight: 500;
  margin-bottom: 6px; line-height: 1.6;
}
.nickname { color: #C47A92; font-weight: 600; }
.invite-hint { display: block; font-size: 13px; color: #A39DA8; margin-bottom: 24px; }

.actions { margin-top: 12px; }
.btn-primary {
  width: 100%; height: 48px; border-radius: 28px;
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
  color: #FFFFFF; font-size: 16px; font-weight: 500;
  letter-spacing: 2px; border: none;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(232,160,180,0.25);
  margin-bottom: 12px;
}
.btn-primary[disabled] { opacity: 0.5; }
.btn-secondary {
  width: 100%; height: 44px; border-radius: 28px;
  background: #F3ECF0; color: #6B6570; font-size: 15px; font-weight: 500;
  border: none; display: flex; align-items: center; justify-content: center;
}
</style>
