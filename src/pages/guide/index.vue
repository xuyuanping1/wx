<template>
  <view class="page">
    <view class="bg-layer">
      <view class="bg-gradient" />
      <view class="bg-overlay" />
    </view>

    <view class="content">
      <view class="hero">
        <uni-icons type="staff" size="44" color="#FFFFFF" />
        <text class="hero-title">邀请你的另一半</text>
        <text class="hero-sub">绑定情侣关系，一起记录甜蜜时光</text>
      </view>

      <view class="card glass-heavy">
        <!-- Step indicator -->
        <view class="steps">
          <view class="step">
            <view class="step-dot active">1</view>
            <text class="step-text">分享邀请</text>
          </view>
          <view class="step-line" />
          <view class="step">
            <view class="step-dot" :class="inviteToken ? 'active' : ''">2</view>
            <text class="step-text">对方确认</text>
          </view>
          <view class="step-line" />
          <view class="step">
            <view class="step-dot">3</view>
            <text class="step-text">绑定成功</text>
          </view>
        </view>

        <!-- H5 提示 -->
        <view v-if="isH5" class="action-area">
          <view class="h5-notice">
            <text class="h5-notice-icon">💬</text>
            <text class="h5-notice-title">请在微信中进行情侣绑定</text>
            <text class="h5-notice-desc">复制下方链接，在微信中打开即可邀请 TA 绑定</text>
          </view>
          <button class="btn-primary pressable" @tap="createInvite">
            生成邀请链接
          </button>
          <button v-if="inviteToken" class="btn-secondary pressable" @tap="copyLink">
            复制邀请链接
          </button>
        </view>

        <!-- 小程序正常流程 -->
        <view v-else>
          <view v-if="!inviteToken" class="action-area">
            <text class="action-desc">生成邀请链接，发送给你的另一半</text>
            <button class="btn-primary pressable" @tap="createInvite">
              生成邀请
            </button>
          </view>

          <view v-else class="action-area">
            <text class="action-desc">邀请已生成，请通过微信发送给 TA</text>
            <button class="btn-primary pressable" open-type="share">
              发送给 TA
            </button>
            <button class="btn-secondary pressable" @tap="copyToken">
              复制邀请码
            </button>
          </view>
        </view>

        <view class="skip-area">
          <text class="skip-text pressable" @tap="skip">稍后再说</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import { getUserInfo } from '@/utils/auth'

const inviteToken = ref('')
const isH5 = process.env.UNI_PLATFORM === 'h5'

async function createInvite() {
  try {
    const invite = await request({ url: '/api/invite/create', method: 'POST' })
    inviteToken.value = invite.token
  } catch (e) {
    uni.showToast({ title: '创建失败', icon: 'none' })
  }
}

function copyToken() {
  uni.setClipboardData({
    data: inviteToken.value,
    success: () => {
      uni.showToast({ title: '已复制邀请码', icon: 'success' })
    },
  })
}

function copyLink() {
  // #ifdef H5
  const link = window.location.origin + '/#/pages/bind/confirm?token=' + inviteToken.value
  uni.setClipboardData({
    data: link,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'success' })
    },
  })
  // #endif
  // #ifndef H5
  copyToken()
  // #endif
}

function skip() {
  uni.switchTab({ url: '/pages/index/index' })
}

onShareAppMessage(() => {
  const user = getUserInfo()
  return {
    title: `${user?.nickname || '你的另一半'} 邀请你绑定情侣关系`,
    path: `pages/bind/confirm?token=${inviteToken.value}`,
  }
})
</script>

<style scoped>
.page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
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

.hero {
  flex: 0 0 auto;
  text-align: center; margin-bottom: 24px;
}
.hero-emoji { font-size: 44px; display: block; margin-bottom: 12px; }
.hero-title {
  display: block; font-size: 24px; font-weight: 700;
  color: #FFFFFF; letter-spacing: 2px;
}
.hero-sub {
  display: block; font-size: 14px; color: rgba(255,255,255,0.7);
  margin-top: 6px; font-weight: 300; letter-spacing: 1px;
}

.card {
  flex: 0 0 auto;
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 24px;
  padding: 24px 24px;
}

/* Steps */
.steps {
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
}
.step { display: flex; flex-direction: column; align-items: center; }
.step-dot {
  width: 32px; height: 32px; border-radius: 50%;
  background: #F3ECF0; color: #A39DA8;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600;
}
.step-dot.active {
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
  color: #FFFFFF;
}
.step-text { font-size: 11px; color: #A39DA8; margin-top: 6px; }
.step-line { flex: 1; height: 1px; background: #F3ECF0; margin: 0 12px; margin-bottom: 18px; }

/* Action */
.action-area { margin-bottom: 16px; }
.action-desc {
  display: block; text-align: center;
  font-size: 14px; color: #6B6570; margin-bottom: 14px;
  line-height: 1.6;
}

.btn-primary {
  width: 100%; height: 48px; border-radius: 28px;
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
  color: #FFFFFF; font-size: 16px; font-weight: 500;
  letter-spacing: 2px; border: none;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(232,160,180,0.25);
  margin-bottom: 12px;
}
.btn-secondary {
  width: 100%; height: 44px; border-radius: 28px;
  background: #F3ECF0;
  color: #6B6570; font-size: 15px; font-weight: 500;
  letter-spacing: 1px; border: none;
  display: flex; align-items: center; justify-content: center;
}

/* Skip */
.skip-area { text-align: center; margin-top: 8px; }
.skip-text { font-size: 14px; color: #A39DA8; }

/* H5 notice */
.h5-notice {
  background: #F3ECF0;
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  margin-bottom: 16px;
}
.h5-notice-icon { font-size: 28px; display: block; margin-bottom: 8px; }
.h5-notice-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #2D2A2E;
  margin-bottom: 8px;
}
.h5-notice-desc {
  display: block;
  font-size: 13px;
  color: #6B6570;
  line-height: 1.6;
}
</style>
