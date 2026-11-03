<template>
  <view class="page">
    <!-- 背景层 -->
    <view v-if="!activeBgImage" class="page-bg-default" />
    <view v-if="bgImage || editBgUrl" class="page-bg-img" :style="pageBgStyle" />
    <!-- 编辑模式下触摸捕获层 -->
    <view v-if="editMode" class="bg-touch-layer"
          @touchstart="onBgTouchStart" @touchmove.prevent="onBgTouchMove" @touchend="onBgTouchEnd" />

    <!-- Top bar -->
    <view class="top-bar">
      <view ref="settingsBtnRef" class="settings-btn" :class="{ disabled: editMode }" @click="!editMode && (drawerVisible = true)">
        <uni-icons type="gear" size="28" :color="activeTextColor || 'rgba(255,255,255,0.85)'" />
      </view>
    </view>

    <!-- Hero -->
    <view class="hero" @tap="onHeroClick">
      <text class="hero-label" :style="activeTextColor ? { color: activeTextColor } : {}">
        {{ activeTitle || '我们已经在一起' }}
      </text>
      <view class="counter-wrap">
        <text class="counter-number" :style="activeTextColor ? { color: activeTextColor } : {}">{{ days }}</text>
        <text class="counter-unit" :style="activeTextColor ? { color: activeTextColor } : {}">天</text>
      </view>
      <view class="hero-divider" :style="activeTextColor ? { background: activeTextColor, opacity: 0.3 } : {}" />
      <text class="hero-date" v-if="startDateStr" :style="activeTextColor ? { color: activeTextColor } : {}">起始日：{{ startDateStr }}</text>
      <text class="hero-date" v-else :style="activeTextColor ? { color: activeTextColor } : {}" style="opacity: 0.8;">点击设置纪念日</text>
    </view>

    <!-- 纪念日提示弹窗 -->
    <AnniversaryPrompt v-model:visible="showAnniversaryPrompt" :force="forcePrompt" @saved="onAnniversarySaved" />

    <!-- Partner card (编辑模式下隐藏) -->
    <view v-if="!editMode" class="partner-card" @click="goAnniversary">
      <view class="partner-row">
        <view class="partner-avatar">
          <image v-if="myAvatar" :src="myAvatar" mode="aspectFill" class="partner-avatar-img" />
          <text v-else class="partner-avatar-text">{{ myName.charAt(0) || '我' }}</text>
        </view>
        <uni-icons type="heart-filled" size="20" color="#E8A0B4" />
        <view class="partner-avatar">
          <image v-if="partnerAvatar" :src="partnerAvatar" mode="aspectFill" class="partner-avatar-img" />
          <text v-else class="partner-avatar-text">{{ partnerName.charAt(0) || 'TA' }}</text>
        </view>
      </view>
      <text class="partner-names">{{ myName || '我' }} & {{ partnerName || 'TA' }}</text>
    </view>

    <view v-if="!editMode && !hasPartner" class="invite-btn pressable" @click="goInvite">
      <text class="invite-text">立即邀请</text>
    </view>

    <!-- ====== 设置抽屉 ====== -->
    <view v-if="drawerVisible" class="drawer-mask" @click="drawerVisible = false" />
    <view class="drawer" :class="{ visible: drawerVisible }">
      <view class="drawer-handle" />
      <text class="drawer-title">设置</text>
      <view class="drawer-user">
        <view class="drawer-avatar">
          <image v-if="myAvatar" :src="myAvatar" mode="aspectFill" class="drawer-avatar-img" />
          <text v-else class="drawer-avatar-text">{{ myName.charAt(0) || '我' }}</text>
        </view>
        <view class="drawer-user-info">
          <text class="drawer-user-name">{{ myName || '未设置昵称' }}</text>
        </view>
      </view>
      <view class="drawer-divider" />
      <view class="drawer-item" @click="enterEditMode">
        <uni-icons type="compose" size="20" color="#2D2A2E" />
        <text class="drawer-item-text">调整首页</text>
      </view>
      <view v-if="isLoggedIn()" class="drawer-item danger" @click="confirmLogoutVisible = true">
        <uni-icons type="undo" size="20" color="#2D2A2E" />
        <text class="drawer-item-text">退出登录</text>
      </view>
      <view v-else class="drawer-item" @click="goLogin">
        <uni-icons type="person" size="20" color="#C47A92" />
        <text class="drawer-item-text" style="color: #C47A92; font-weight: 500;">去登录 / 注册</text>
      </view>
      <view class="drawer-cancel" @click="drawerVisible = false">
        <text class="drawer-cancel-text">取消</text>
      </view>
    </view>

    <!-- Confirm dialog -->
    <view v-if="confirmLogoutVisible" class="modal-mask" @click="confirmLogoutVisible = false">
      <view class="modal-card" @click.stop>
        <text class="modal-title">确认退出</text>
        <text class="modal-desc">退出后需要重新登录</text>
        <view class="modal-actions">
          <view class="modal-btn" @click="confirmLogoutVisible = false">
            <text class="btn-cancel">取消</text>
          </view>
          <view class="modal-btn" @click="doLogout">
            <text class="btn-confirm">退出</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== 编辑模式底部面板 ====== -->
    <view v-if="editMode" class="edit-wrapper">
      <!-- 手柄（面板外，贴着面板上方） -->
      <view class="edit-handle" @tap="editCollapsed = !editCollapsed">
        <uni-icons :type="editCollapsed ? 'up' : 'down'" size="16" color="#A39DA8" />
      </view>
      <!-- 面板 -->
      <view class="edit-panel">
        <!-- Tab 内容区（可收起） -->
        <view v-if="!editCollapsed" class="edit-content">
        <!-- Tab 0: 封面 -->
        <view v-if="editTab === 0" class="edit-tab-content">
          <view class="edit-cover-btn pressable" @tap="pickEditBg">
            <uni-icons type="image" size="18" color="#C47A92" />
            <text class="edit-cover-btn-text">{{ editBgUrl ? '重新选择' : '更换封面图片' }}</text>
          </view>
          <view v-if="editBgUrl || bgImage" class="edit-blur-row">
            <text class="edit-blur-label">模糊</text>
            <slider :value="editBgBlurLevel" :min="0" :max="10" :step="1"
                    activeColor="#C47A92" backgroundColor="rgba(0,0,0,0.06)" block-size="16" block-color="#C47A92"
                    class="edit-blur-slider"
                    @change="e => editBgBlurLevel = e.detail.value"
                    @changing="e => editBgBlurLevel = e.detail.value" />
            <text class="edit-blur-value">{{ editBgBlurLevel * 10 }}</text>
          </view>
        </view>

        <!-- Tab 1: 字体 -->
        <view v-if="editTab === 1" class="edit-tab-content">
          <input v-model="editTitle" placeholder="自定义标题（留空恢复默认）" placeholder-class="ph" class="edit-title-input" />
          <text class="edit-color-label">文字颜色</text>
          <view class="edit-color-grid">
            <view v-for="c in presetColors" :key="c" class="edit-color-item"
                  :class="{ active: editTextColor === c }" :style="{ background: c }"
                  @tap="editTextColor = c" />
          </view>
          <input v-model="editTextColor" placeholder="#FFFFFF" placeholder-class="ph" class="edit-hex-input" />
        </view>

        <!-- Tab 2: 退出编辑 -->
        <view v-if="editTab === 2" class="edit-tab-content">
          <view class="edit-exit-actions">
            <view class="edit-exit-btn" @tap="saveEdit">
              <text class="edit-exit-text">保存</text>
            </view>
            <view class="edit-exit-btn reset" @tap="exitEditMode">
              <text class="edit-exit-text reset-text">不保存</text>
            </view>
          </view>
        </view>
        <!-- 通用提示 -->
        <text class="edit-tip">上方页面即为实时预览</text>
      </view>

      <!-- Tab 栏 -->
      <view class="edit-tabs">
        <view class="edit-tab" :class="{ active: editTab === 0 }" @tap="editTab = 0; hasExitedOnce = false">
          <uni-icons :type="editTab === 0 ? 'image-filled' : 'image'" size="22" :color="editTab === 0 ? '#C47A92' : '#A39DA8'" />
          <text class="edit-tab-label" :class="{ active: editTab === 0 }">封面</text>
        </view>
        <view class="edit-tab" :class="{ active: editTab === 1 }" @tap="editTab = 1; hasExitedOnce = false">
          <uni-icons type="compose" size="22" :color="editTab === 1 ? '#C47A92' : '#A39DA8'" />
          <text class="edit-tab-label" :class="{ active: editTab === 1 }">字体</text>
        </view>
        <view class="edit-tab" :class="{ active: editTab === 2 }" @tap="onExitTabTap">
          <uni-icons :type="hasExitedOnce ? (editTab === 2 ? 'refresh-filled' : 'refresh') : (editTab === 2 ? 'close-filled' : 'close')" size="22" :color="editTab === 2 ? '#C47A92' : '#A39DA8'" />
          <text class="edit-tab-label" :class="{ active: editTab === 2 }">{{ hasExitedOnce ? '恢复默认' : '退出' }}</text>
        </view>
      </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request, upload } from '@/utils/request'
import { daysBetween, formatDate } from '@/utils/date'
import { getUserInfo, setLoginInfo, logout, isLoggedIn, requireLogin } from '@/utils/auth'
// #ifdef H5
import { bindNativeClick } from '@/utils/bindClick'
// #endif
import AnniversaryPrompt from '@/components/AnniversaryPrompt.vue'

// ====== 页面数据 ======
const days = ref(0)
const startDateStr = ref('')
const myName = ref('')
const myAvatar = ref('')
const partnerName = ref('')
const partnerAvatar = ref('')
const userId = ref('')
const settingsBtnRef = ref(null)
const drawerVisible = ref(false)
const confirmLogoutVisible = ref(false)
const showAnniversaryPrompt = ref(false)
const forcePrompt = ref(false)
const hasAnniversary = ref(false)
const hasPartner = ref(false)

// ====== 已保存的配置 ======
const bgImage = ref('')
const homeBgBlurValue = ref(0)
const homeBgPositionX = ref(50)
const homeBgPositionY = ref(50)
const homeBgScale = ref(100)
const customTitle = ref('')
const textColor = ref('')

// ====== 编辑模式 ======
const editMode = ref(false)
const editTab = ref(0)
const hasExitedOnce = ref(false)
const editCollapsed = ref(false)
const editBgUrl = ref('')
const editBgBlur = ref(false)
const editBgBlurLevel = ref(0)
const editHomeBgPositionX = ref(50)
const editHomeBgPositionY = ref(50)
const editHomeBgScale = ref(100)
const editTitle = ref('')
const editTextColor = ref('')

const presetColors = [
  '#FFFFFF', '#000000', '#E8A0B4', '#C47A92',
  '#9FC5E8', '#6BA3D4', '#FFD700', '#FF6B6B',
  '#4ECDC4', '#A8E6CF', '#DDA0DD', '#F0E68C',
]

// ====== 计算属性：实时预览用的值 ======
const activeBgImage = computed(() => editMode.value ? (editBgUrl.value || bgImage.value) : bgImage.value)
const activeBgBlur = computed(() => {
  if (editMode.value) return editBgBlurLevel.value
  return homeBgBlurValue.value
})

const pageImageRatio = ref(0)

const pageLocalStyle = computed(() => {
  const blur = editBgBlurLevel.value
  const style = {}
  if (blur > 0) style.filter = `blur(${blur}px)`
  return style
})

const pageBgStyle = computed(() => {
  const img = editMode.value ? (editBgUrl.value || bgImage.value) : bgImage.value
  const blur = editMode.value ? editBgBlurLevel.value : homeBgBlurValue.value
  const px = editMode.value ? editHomeBgPositionX.value : homeBgPositionX.value
  const py = editMode.value ? editHomeBgPositionY.value : homeBgPositionY.value
  const s = editMode.value ? editHomeBgScale.value : homeBgScale.value
  const style = {}
  if (img) style.backgroundImage = `url(${img})`
  if (s <= 100) {
    style.backgroundSize = 'cover'
  } else if (pageImageRatio.value > 0) {
    // 手机屏幕约 9:19.5 ≈ 0.46，图片宽高比比屏幕大的用高度优先
    style.backgroundSize = pageImageRatio.value > 0.5 ? `auto ${s}%` : `${s}% auto`
  } else {
    style.backgroundSize = `auto ${s}%`
  }
  style.backgroundPosition = `${px}% ${py}%`
  style.backgroundRepeat = 'no-repeat'
  if (blur > 0) style.filter = `blur(${blur}px)`
  return style
})
const activeTitle = computed(() => editMode.value ? editTitle.value : customTitle.value)
const activeTextColor = computed(() => editMode.value ? editTextColor.value : textColor.value)

// ====== 抽屉 ======
watch(drawerVisible, (val) => {
  if (editMode.value) return
  if (val) uni.hideTabBar({ animation: true })
  else uni.showTabBar({ animation: true })
})

// ====== 编辑模式 ======
function enterEditMode() {
  drawerVisible.value = false
  editMode.value = true
  editTab.value = 0
  editBgUrl.value = ''
  editBgBlurLevel.value = homeBgBlurValue.value
  editBgBlur.value = homeBgBlurValue.value > 0
  editHomeBgPositionX.value = homeBgPositionX.value
  editHomeBgPositionY.value = homeBgPositionY.value
  editHomeBgScale.value = homeBgScale.value
  editTitle.value = customTitle.value
  editTextColor.value = textColor.value || '#FFFFFF'
  hasExitedOnce.value = false
  editCollapsed.value = false
  uni.hideTabBar({ animation: true })
}

function exitEditMode() {
  editMode.value = false
  uni.showTabBar({ animation: true })
}

// 背景触摸拖动和缩放
let bgTouchStartX = 0, bgTouchStartY = 0
let bgTouchStartPosX = 50, bgTouchStartPosY = 50, bgTouchStartScale = 100
let bgLastDist = 0

function getBgTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function onBgTouchStart(e) {
  if (!editMode.value || (!editBgUrl.value && !bgImage.value)) return
  const ts = e.touches
  if (ts.length === 1) {
    bgTouchStartX = ts[0].clientX
    bgTouchStartY = ts[0].clientY
    bgTouchStartPosX = editHomeBgPositionX.value
    bgTouchStartPosY = editHomeBgPositionY.value
    bgLastDist = 0
  } else if (ts.length === 2) {
    bgLastDist = getBgTouchDist(ts)
    bgTouchStartScale = editHomeBgScale.value
  }
}

function onBgTouchMove(e) {
  if (!editMode.value || (!editBgUrl.value && !bgImage.value)) return
  const ts = e.touches
  if (ts.length === 1 && bgLastDist === 0) {
    const s = Math.max(editHomeBgScale.value / 100, 1)
    const sens = 0.55 / (1 + (s - 1) * 3)
    const deltaX = (bgTouchStartX - ts[0].clientX) * sens
    const deltaY = (bgTouchStartY - ts[0].clientY) * sens
    editHomeBgPositionX.value = Math.round(Math.max(0, Math.min(100, bgTouchStartPosX + deltaX)))
    editHomeBgPositionY.value = Math.round(Math.max(0, Math.min(100, bgTouchStartPosY + deltaY)))
  } else if (ts.length === 2) {
    const dist = getBgTouchDist(ts)
    if (bgLastDist > 0) {
      const ratio = dist / bgLastDist
      const newScale = Math.round(Math.max(100, Math.min(500, bgTouchStartScale * ratio)) / 5) * 5
      editHomeBgScale.value = newScale
    }
  }
}

function onBgTouchEnd() {
  bgLastDist = 0
}

function getPageImageRatio(src, cb) {
  // #ifdef MP-WEIXIN
  wx.getImageInfo({ src, success: (info) => cb(info.width / info.height), fail: () => cb(0) })
  // #endif
  // #ifndef MP-WEIXIN
  cb(0)
  // #endif
}

function pickEditBg() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: (res) => {
      const localPath = res.tempFilePaths[0]
      getPageImageRatio(localPath, (r) => { pageImageRatio.value = r })
      uni.showLoading({ title: '处理中...' })
      upload('/api/photo/upload', localPath).then((data) => {
        uni.hideLoading()
        editBgUrl.value = data.url
        editBgBlur.value = true
        editBgBlurLevel.value = editBgBlurLevel.value || 0
        editHomeBgPositionX.value = 50
        editHomeBgPositionY.value = 50
        editHomeBgScale.value = 100
      }).catch(() => {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'none' })
      })
    },
  })
}

async function saveEdit() {
  if (!requireLogin('登录后即可保存你的专属首页风格，是否前往登录？')) return
  uni.showLoading({ title: '保存中...' })
  try {
    const data = {}
    if (editBgUrl.value) data.homeBgImage = editBgUrl.value
    data.homeBgBlur = String(editBgBlurLevel.value)
    data.homeBgPositionX = String(editHomeBgPositionX.value)
    data.homeBgPositionY = String(editHomeBgPositionY.value)
    data.homeBgScale = String(editHomeBgScale.value)
    data.customTitle = editTitle.value || ''
    data.textColor = editTextColor.value || ''
    await request({ url: '/api/anniversary', method: 'PUT', data })
    if (data.homeBgImage) bgImage.value = data.homeBgImage
    homeBgBlurValue.value = editBgBlurLevel.value
    homeBgPositionX.value = editHomeBgPositionX.value
    homeBgPositionY.value = editHomeBgPositionY.value
    homeBgScale.value = editHomeBgScale.value
    customTitle.value = editTitle.value
    textColor.value = editTextColor.value
    exitEditMode()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function onExitTabTap() {
  if (!hasExitedOnce.value) {
    // 第一次点：切换到退出面板，tab 变成"恢复默认"
    hasExitedOnce.value = true
    editTab.value = 2
  } else {
    // 再次点"恢复默认"：二次确认
    uni.showModal({
      title: '恢复默认',
      content: '确定恢复所有自定义为默认值吗？',
      confirmColor: '#D4524A',
      success: (res) => {
        if (res.confirm) resetEdit()
      },
    })
  }
}

async function resetEdit() {
  try {
    await request({
      url: '/api/anniversary',
      method: 'PUT',
      data: { homeBgImage: '', homeBgBlur: '0', homeBgPositionX: '50', homeBgPositionY: '50', homeBgScale: '100', customTitle: '', textColor: '' },
    })
    bgImage.value = ''
    homeBgBlurValue.value = 0
    homeBgPositionX.value = 50
    homeBgPositionY.value = 50
    homeBgScale.value = 100
    customTitle.value = ''
    textColor.value = ''
    exitEditMode()
    uni.showToast({ title: '已恢复默认', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

// ====== 生命周期 ======
onMounted(() => {
  // #ifdef H5
  bindNativeClick('.hero', () => onHeroClick())
  nextTick(() => {
    const el = settingsBtnRef.value?.$el || settingsBtnRef.value
    if (el) {
      el.style.cursor = 'pointer'
      el.addEventListener('click', () => { drawerVisible.value = true })
    }
  })
  // #endif
  loadPageData()
})

onShow(() => { loadPageData() })

async function loadPageData() {
  if (!isLoggedIn()) {
    days.value = 520
    startDateStr.value = '2024 年 05 月 20 日'
    myName.value = '我'
    partnerName.value = 'TA'
    hasPartner.value = false
    hasAnniversary.value = true
    showAnniversaryPrompt.value = false
    return
  }
  try {
    const freshUser = await request({ url: '/api/user/info' })
    if (freshUser) {
      setLoginInfo(freshUser)
      myName.value = freshUser.nickname || ''
      myAvatar.value = freshUser.avatarUrl || ''
      userId.value = freshUser.id || ''
      hasPartner.value = !!freshUser.partnerId
      // 获取伴侣信息
      if (freshUser.partnerId) {
        try {
          const partner = await request({ url: '/api/user/partner-info' })
          if (partner) {
            partnerName.value = partner.nickname || ''
            partnerAvatar.value = partner.avatarUrl || ''
          }
        } catch (e2) {}
      }
    }
  } catch (e) {
    const user = getUserInfo()
    if (user) {
      myName.value = user.nickname || ''
      myAvatar.value = user.avatarUrl || ''
      userId.value = user.id || ''
      hasPartner.value = !!user.partnerId
    }
  }
  try {
    const anniversary = await request({ url: '/api/anniversary' })
    days.value = daysBetween(anniversary.startDate)
    startDateStr.value = formatDate(anniversary.startDate, 'YYYY 年 MM 月 DD 日')
    hasAnniversary.value = true
    if (anniversary.homeBgImage) {
      bgImage.value = anniversary.homeBgImage
      getPageImageRatio(anniversary.homeBgImage, (r) => { pageImageRatio.value = r })
    }
    homeBgBlurValue.value = anniversary.homeBgBlur || 0
    homeBgPositionX.value = anniversary.homeBgPositionX != null ? anniversary.homeBgPositionX : 50
    homeBgPositionY.value = anniversary.homeBgPositionY != null ? anniversary.homeBgPositionY : 50
    homeBgScale.value = anniversary.homeBgScale != null ? anniversary.homeBgScale : 100
    customTitle.value = anniversary.customTitle || ''
    textColor.value = anniversary.textColor || ''
  } catch (e) {
    days.value = 0
    hasAnniversary.value = false
    forcePrompt.value = false
    showAnniversaryPrompt.value = true
  }
}

function onHeroClick() {
  if (!isLoggedIn()) {
    requireLogin('登录后即可设置属于你们的专属恋爱起始日，是否前往登录？')
    return
  }
  if (!hasAnniversary.value) {
    forcePrompt.value = true
    showAnniversaryPrompt.value = false
    nextTick(() => { showAnniversaryPrompt.value = true })
  }
}

function onAnniversarySaved(dateStr) {
  hasAnniversary.value = true
  forcePrompt.value = false
  days.value = daysBetween(dateStr)
  startDateStr.value = formatDate(dateStr, 'YYYY 年 MM 月 DD 日')
}

function doLogout() {
  confirmLogoutVisible.value = false
  drawerVisible.value = false
  logout()
  loadPageData()
  uni.showToast({ title: '已退出登录', icon: 'none' })
}

function goAnniversary() { uni.switchTab({ url: '/pages/anniversary/index' }) }
function goInvite() {
  if (!requireLogin('登录后即可生成专属邀请码绑定另一半，是否前往登录？')) return
  uni.navigateTo({ url: '/pages/guide/index' })
}
function goLogin() {
  drawerVisible.value = false
  uni.navigateTo({ url: '/pages/login/index' })
}
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-bottom: 20px;
  box-sizing: border-box;
}
.bg-touch-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 5;
}
.page-bg-default {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(160deg, #F2C8D4 0%, #E8A0B4 30%, #C4DDF2 70%, #9FC5E8 100%);
  z-index: 0;
}
.page-bg-img {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100%; height: 100%;
  z-index: 0;
}
.top-bar {
  display: flex;
  align-items: center;
  padding: 80rpx 40rpx 0;
  position: relative;
  z-index: 10;
}
.settings-btn {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.settings-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Hero */
.hero {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx 60rpx;
  position: relative;
  z-index: 1;
}
.hero-label {
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 8rpx;
}
.counter-wrap {
  display: flex;
  align-items: baseline;
  margin-top: 32rpx;
}
.counter-number {
  font-size: 192rpx;
  font-weight: 200;
  color: #FFFFFF;
  letter-spacing: -6rpx;
  line-height: 1;
}
.counter-unit {
  font-size: 40rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 16rpx;
  font-weight: 300;
}
.hero-divider {
  width: 96rpx;
  height: 2rpx;
  margin: 40rpx 0;
  background: rgba(255, 255, 255, 0.3);
}
.hero-date {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 4rpx;
  font-weight: 300;
}

/* Partner card */
.partner-card {
  margin: 0 48rpx;
  padding: 48rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
}
.partner-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
}
.partner-avatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #F2C8D4, #C4DDF2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.partner-avatar-img { width: 100%; height: 100%; border-radius: 50%; }
.partner-avatar-text { font-size: 36rpx; font-weight: 600; color: #FFFFFF; }
.partner-names {
  display: block;
  text-align: center;
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #6B6570;
  letter-spacing: 4rpx;
}

/* Invite */
.invite-btn {
  margin: 24rpx 48rpx 0;
  padding: 24rpx 0;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.85);
  border: 2rpx solid rgba(232, 160, 180, 0.4);
  text-align: center;
  position: relative;
  z-index: 1;
}
.invite-text { font-size: 28rpx; color: #C47A92; font-weight: 500; letter-spacing: 4rpx; }

/* Drawer */
.drawer-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 900;
}
.drawer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 1000;
  background: #FFFFFF;
  border-radius: 48rpx 48rpx 0 0;
  padding: 24rpx 48rpx calc(48rpx + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer.visible { transform: translateY(0); }
.drawer-handle {
  width: 72rpx; height: 8rpx; border-radius: 4rpx;
  background: #E0DCE0; margin: 0 auto 32rpx;
}
.drawer-title {
  display: block; font-size: 36rpx; font-weight: 600;
  color: #2D2A2E; margin-bottom: 40rpx;
}
.drawer-user {
  display: flex; align-items: center; gap: 28rpx; padding: 24rpx 0;
}
.drawer-avatar {
  width: 96rpx; height: 96rpx; border-radius: 50%;
  background: linear-gradient(135deg, #F2C8D4, #C4DDF2);
  display: flex; align-items: center; justify-content: center;
}
.drawer-avatar-img { width: 100%; height: 100%; border-radius: 50%; }
.drawer-avatar-text { font-size: 36rpx; font-weight: 600; color: #FFFFFF; }
.drawer-user-info { flex: 1; }
.drawer-user-name { display: block; font-size: 32rpx; font-weight: 500; color: #2D2A2E; }
.drawer-user-id { display: block; font-size: 24rpx; color: #A39DA8; margin-top: 4rpx; }
.drawer-divider { height: 2rpx; background: #F3ECF0; margin: 24rpx 0; }
.drawer-item { display: flex; align-items: center; gap: 24rpx; padding: 32rpx 0; }
.drawer-item-text { font-size: 30rpx; color: #2D2A2E; }
.drawer-item.danger .drawer-item-text { color: #D4524A; }
.drawer-cancel {
  margin-top: 24rpx; padding: 32rpx 0; text-align: center;
  background: #F8F5F8; border-radius: 28rpx;
}
.drawer-cancel-text { font-size: 30rpx; color: #6B6570; font-weight: 500; }

/* Modal */
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  display: flex; align-items: center; justify-content: center;
}
.modal-card {
  width: 560rpx; background: #FFFFFF; border-radius: 40rpx;
  padding: 56rpx 48rpx 0; text-align: center;
}
.modal-title { display: block; font-size: 34rpx; font-weight: 600; color: #2D2A2E; margin-bottom: 16rpx; }
.modal-desc { display: block; font-size: 28rpx; color: #A39DA8; margin-bottom: 48rpx; }
.modal-actions { display: flex; border-top: 2rpx solid #F3ECF0; }
.modal-btn { flex: 1; padding: 28rpx 0; text-align: center; }
.modal-btn:first-child { border-right: 2rpx solid #F3ECF0; }
.btn-cancel { font-size: 32rpx; color: #6B6570; }
.btn-confirm { font-size: 32rpx; color: #D4524A; font-weight: 600; }

/* ====== 编辑模式面板 ====== */
.edit-wrapper {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}
.edit-handle {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 0;
  gap: 2rpx;
}
.edit-panel {
  background: #FFFFFF;
  box-shadow: 0 -8rpx 40rpx rgba(0, 0, 0, 0.1);
}
.edit-content {
  padding: 16rpx 32rpx 8rpx;
  text-align: center;
}
.edit-tab-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

/* Tab 0: 封面 */
.edit-cover-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx 0;
  border-radius: 20rpx;
  background: rgba(196, 122, 146, 0.08);
  width: 100%;
}
.edit-cover-btn-text {
  font-size: 26rpx;
  color: #C47A92;
  font-weight: 500;
}
.edit-tip {
  font-size: 22rpx;
  color: #A39DA8;
  text-align: center;
  margin-top: 6rpx;
}
.edit-blur-row {
  display: flex; align-items: center; gap: 16rpx;
  width: 100%;
}
.edit-blur-label { font-size: 24rpx; color: #6B6570; min-width: 60rpx; }
.edit-blur-slider { flex: 1; }
.edit-blur-value { font-size: 24rpx; color: #A39DA8; min-width: 40rpx; text-align: right; }

/* Tab 1: 字体 */
.edit-title-input {
  font-size: 28rpx; color: #2D2A2E;
  padding: 16rpx 0; border-bottom: 2rpx solid #F3ECF0;
  width: 100%; text-align: center;
}
.ph { color: #D1CDD3; }
.edit-color-label {
  font-size: 24rpx; color: #6B6570; margin-top: 8rpx;
}
.edit-color-grid {
  display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 8rpx;
}
.edit-color-item {
  width: 48rpx; height: 48rpx; border-radius: 50%;
  border: 3rpx solid transparent;
}
.edit-color-item.active {
  border-color: #C47A92;
  box-shadow: 0 0 0 3rpx rgba(196, 122, 146, 0.3);
}
.edit-hex-input {
  font-size: 24rpx; color: #2D2A2E;
  padding: 12rpx 0; border-bottom: 2rpx solid #F3ECF0;
  width: 100%; margin-top: 4rpx;
}

/* Tab 2: 退出 */
.edit-exit-actions {
  display: flex; gap: 24rpx;
  width: 100%;
}
.edit-exit-btn {
  flex: 1; padding: 24rpx 0; text-align: center;
  border-radius: 24rpx;
  background: rgba(196, 122, 146, 0.12);
}
.edit-exit-btn.reset {
  background: #F8F5F8;
}
.edit-exit-text {
  font-size: 28rpx; color: #C47A92; font-weight: 600;
}
.reset-text { color: #6B6570; font-weight: 500; }

/* Tab 栏 */
.edit-tabs {
  display: flex;
  border-top: 2rpx solid #F3ECF0;
  padding-bottom: env(safe-area-inset-bottom);
}
.edit-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0 12rpx;
  gap: 4rpx;
  transition: all 0.2s;
}
.edit-tab.active {
  background: rgba(196,122,146,0.08);
  border-radius: 16rpx;
}
.edit-tab-label {
  font-size: 20rpx;
  color: #A39DA8;
}
.edit-tab-label.active {
  color: #C47A92;
  font-weight: 600;
}
</style>
