<template>
  <view class="page">
    <uni-nav-bar title="纪念日" />
    <!-- Main anniversary card -->
    <view class="main-card" @tap="onMainCardClick" :style="editingCardBg ? 'position:relative;z-index:950' : ''"
          @touchstart="onCardTouchStart" @touchmove.stop.prevent="onCardTouchMove" @touchend="onCardTouchEnd">
      <view v-if="hasEditingBgImage" class="main-card-bg-img" :style="cardBgImageStyle" />
      <view v-else class="main-card-bg" />
      <view class="main-card-content" :style="editingCardBg ? 'pointer-events:none' : ''">
        <text class="main-card-label" :style="previewTextColor ? { color: previewTextColor } : {}">和宝宝在一起已经</text>
        <view class="main-card-counter">
          <view class="main-card-number-wrap">
            <text class="main-card-number" :style="previewTextColor ? { color: previewTextColor } : {}">{{ days }}</text>
            <view class="main-card-divider" :style="previewTextColor ? { background: previewTextColor, opacity: 0.3 } : {}" />
          </view>
          <text class="main-card-unit" :style="previewTextColor ? { color: previewTextColor } : {}">天</text>
        </view>
        <text class="main-card-date" v-if="startDate" :style="previewTextColor ? { color: previewTextColor } : {}">起始日 · {{ startDate }}</text>
        <text class="main-card-date" v-else style="opacity:0.8;">点击设置纪念日</text>
      </view>
    </view>

    <!-- 纪念日提示弹窗 -->
    <AnniversaryPrompt v-model:visible="showPrompt" :force="forcePrompt" :initial-date="startDate" @saved="onAnniversarySaved" />

    <!-- 抽屉遮罩 -->
    <view v-if="cardDrawerVisible" class="drawer-mask" @click="closeDrawer" />
    <view class="card-drawer" :class="{ visible: cardDrawerVisible }">
      <view class="drawer-handle" />
      <!-- 编辑卡片背景模式 -->
      <view v-if="editingCardBg" class="bg-edit-section">
        <view class="bg-upload-btn pressable" @tap="pickCardBgImage">
          <uni-icons type="refreshempty" size="20" color="#C47A92" />
          <text class="bg-upload-btn-text">{{ hasEditingBgImage ? '更换图片' : '选择图片' }}</text>
        </view>
        <view v-if="hasEditingBgImage" class="blur-slider-label">
          <text class="bg-blur-label">模糊 {{ cardBgBlurLevel * 10 }}%</text>
        </view>
        <slider v-if="hasEditingBgImage" :value="cardBgBlurLevel" :min="0" :max="10" :step="1"
                activeColor="#C47A92" backgroundColor="#F3ECF0" block-size="16" block-color="#C47A92"
                @change="e => cardBgBlurLevel = e.detail.value"
                @changing="e => cardBgBlurLevel = e.detail.value" />
        <view v-if="hasEditingBgImage" class="color-section">
          <text class="color-label">文字颜色</text>
          <view class="color-grid">
            <view v-for="c in presetColors" :key="c" class="color-swatch"
                  :class="{ active: editTextColor === c }" :style="{ background: c }"
                  @tap="editTextColor = c" />
          </view>
        </view>
        <view class="bg-edit-actions">
          <view class="bg-edit-btn cancel" @tap="restoreCardBgDefault">
            <text class="bg-edit-btn-text" style="color:#D4524A">恢复默认</text>
          </view>
          <view class="bg-edit-btn confirm" @tap="saveCardBg">
            <text class="bg-edit-btn-text" style="color:#C47A92;font-weight:600">保存</text>
          </view>
        </view>
      </view>
      <!-- 普通模式 -->
      <view v-else>
        <view class="drawer-option" @click="updateAnniversary">
          <uni-icons type="calendar" size="20" color="#2D2A2E" />
          <text class="drawer-option-text">更新纪念日</text>
        </view>
        <view class="drawer-divider-line" />
        <view class="drawer-option" @click="editCardBg">
          <uni-icons type="image" size="20" color="#2D2A2E" />
          <text class="drawer-option-text">编辑卡片背景</text>
        </view>
        <view v-if="cardBgImage" class="drawer-divider-line" />
        <view v-if="cardBgImage" class="drawer-option" @click="resetCardBg">
          <uni-icons type="refreshempty" size="20" color="#D4524A" />
          <text class="drawer-option-text" style="color:#D4524A">恢复默认背景</text>
        </view>
      </view>
      <view class="drawer-cancel" @click="editingCardBg ? cancelCardBgEdit() : closeDrawer()">
        <text class="drawer-cancel-text">取消</text>
      </view>
    </view>

    <!-- Event section -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">纪念日</text>
        <text class="section-count">{{ events.length }} 个事件</text>
      </view>

      <view v-if="events.length > 0" class="event-list">
        <view v-for="event in events" :key="event.id"
              class="event-card pressable"
              @tap="goDetail(event.id)"
              @longpress="onEventAction(event)">
          <!-- 左侧：已过天数 -->
          <view v-if="getElapsed(event) !== null" class="event-left-col">
            <text class="event-days-number days-passed">{{ getElapsed(event) }}</text>
            <text class="event-days-label">天已过</text>
          </view>
          <view v-if="getElapsed(event) !== null" class="event-separator" />
          <!-- 中间：事件信息 -->
          <view class="event-info">
            <text class="event-name">{{ event.name }}</text>
            <view class="event-meta">
              <text class="event-date">{{ formatEventDate(event) }}</text>
              <view class="tag" :class="event.repeatType === 'NONE' ? 'tag-secondary' : 'tag-primary'">
                {{ getRepeatLabel(event.repeatType) }}
              </view>
            </view>
          </view>
          <!-- 最右侧：剩余天数 + 未来日期 -->
          <view v-if="getRemaining(event) !== null" class="event-right-col">
            <text class="event-days-number days-remaining">{{ getRemaining(event) }}</text>
            <text class="event-days-label">天后</text>
            <text class="event-next-date">{{ getNextDate(event) }}</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <uni-icons type="calendar" size="40" color="#A39DA8" />
        <text class="empty-title">还没有纪念日</text>
        <text class="empty-desc">记录你们的每一个重要时刻</text>
      </view>
    </view>

    <!-- FAB -->
    <view class="fab pressable" @tap="goCreate">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request, upload } from '@/utils/request'
import { daysBetween, formatDate, getRepeatLabel, getClampedDate } from '@/utils/date'
import { isLoggedIn, requireLogin } from '@/utils/auth'
// #ifdef H5
import { bindNativeClick } from '@/utils/bindClick'
// #endif
import AnniversaryPrompt from '@/components/AnniversaryPrompt.vue'

const days = ref(0)
const startDate = ref('')
const events = ref([])
const hasAnniversary = ref(false)
const hasPartner = ref(false)
const showPrompt = ref(false)
const forcePrompt = ref(false)
const cardDrawerVisible = ref(false)
const cardBgImage = ref('')
const cardBgBlurValue = ref(0)
// 编辑卡片背景状态
const editingCardBg = ref(false)
const tempCardBgUrl = ref('')
const cardBgBlurLevel = ref(0)
const cardTextColor = ref('')
const editTextColor = ref('')
const cardBgPositionX = ref(50)
const cardBgPositionY = ref(50)
const cardBgScale = ref(100)
const editCardBgPositionX = ref(50)
const editCardBgPositionY = ref(50)
const editCardBgScale = ref(100)
const presetColors = ['#FFFFFF','#000000','#E8A0B4','#C47A92','#9FC5E8','#6BA3D4','#FFD700','#FF6B6B','#4ECDC4','#A8E6CF','#DDA0DD','#F0E68C']

// 实时预览用的计算属性
const previewBgImage = computed(() => {
  if (editingCardBg.value && tempCardBgUrl.value) return tempCardBgUrl.value
  return cardBgImage.value
})
const previewBgBlur = computed(() => {
  if (editingCardBg.value && tempCardBgUrl.value) {
    return cardBgBlurLevel.value
  }
  return cardBgBlurValue.value
})
const previewTextColor = computed(() => editingCardBg.value ? editTextColor.value : cardTextColor.value)

const hasEditingBgImage = computed(() => !!tempCardBgUrl.value || !!cardBgImage.value)

const cardBgImageRatio = ref(0)

const cardBgLocalStyle = computed(() => {
  const blur = cardBgBlurLevel.value
  const style = {}
  if (blur > 0) style.filter = `blur(${blur}px)`
  return style
})

const cardBgImageStyle = computed(() => {
  const img = editingCardBg.value ? (tempCardBgUrl.value || cardBgImage.value) : cardBgImage.value
  const blur = (editingCardBg.value && tempCardBgUrl.value) ? cardBgBlurLevel.value : cardBgBlurValue.value
  const px = editingCardBg.value ? editCardBgPositionX.value : cardBgPositionX.value
  const py = editingCardBg.value ? editCardBgPositionY.value : cardBgPositionY.value
  const s = editingCardBg.value ? editCardBgScale.value : cardBgScale.value
  const style = {}
  style.backgroundImage = `url(${img})`
  if (s <= 100) {
    style.backgroundSize = 'cover'
  } else if (cardBgImageRatio.value > 0) {
    // 图片比容器宽 → 按高度缩放；比容器窄 → 按宽度缩放（卡片约 2:1）
    style.backgroundSize = cardBgImageRatio.value > 2 ? `auto ${s}%` : `${s}% auto`
  } else {
    style.backgroundSize = `${s}% auto`
  }
  style.backgroundPosition = `${px}% ${py}%`
  style.backgroundRepeat = 'no-repeat'
  if (blur > 0) style.filter = `blur(${blur}px)`
  return style
})

const mockEvents = [
  { id: 'mock-1', title: '认识的第一天 (示例)', targetDate: '2024-01-01', repeatType: 'YEARLY', isMock: true },
  { id: 'mock-2', title: '恋爱 100 天纪念 (示例)', targetDate: '2024-04-10', repeatType: 'NONE', isMock: true },
  { id: 'mock-3', title: 'TA 的生日 (示例) 🎂', targetDate: '2024-08-15', repeatType: 'YEARLY', isMock: true },
]

async function loadData() {
  if (!isLoggedIn()) {
    days.value = 520
    startDate.value = '2024-05-20'
    hasAnniversary.value = true
    hasPartner.value = false
    events.value = mockEvents
    return
  }
  try {
    const anniversary = await request({ url: '/api/anniversary' })
    days.value = daysBetween(anniversary.startDate)
    startDate.value = formatDate(anniversary.startDate)
    hasAnniversary.value = true
    cardBgImage.value = anniversary.backgroundImage || ''
    if (cardBgImage.value) getImageRatio(cardBgImage.value, (r) => { cardBgImageRatio.value = r })
    cardBgBlurValue.value = anniversary.cardBgBlur || 0
    cardTextColor.value = anniversary.cardTextColor || ''
    cardBgPositionX.value = anniversary.cardBgPositionX != null ? anniversary.cardBgPositionX : 50
    cardBgPositionY.value = anniversary.cardBgPositionY != null ? anniversary.cardBgPositionY : 50
    cardBgScale.value = anniversary.cardBgScale != null ? anniversary.cardBgScale : 100
  } catch (e) {
    days.value = 0
    hasAnniversary.value = false
  }
  // 检查是否绑定伴侣
  try {
    const user = await request({ url: '/api/user/info' })
    hasPartner.value = !!user.partnerId
  } catch (e) {
    hasPartner.value = false
  }
  try {
    events.value = await request({ url: '/api/event/list' })
  } catch (e) {
    events.value = []
  }
}

onMounted(async () => {
  await loadData()
  // 首次进入弹出提示（仅当已登录且无纪念日时提示）
  if (isLoggedIn() && !hasAnniversary.value) {
    forcePrompt.value = false
    showPrompt.value = true
  }
  // #ifdef H5
  bindNativeClick('.main-card', () => onMainCardClick())
  // #endif
})

// 每次页面显示时刷新数据（navigateBack 后也会触发）
onShow(() => {
  if (!cardDrawerVisible.value) {
    try { uni.showTabBar() } catch (e) {}
  }
  loadData()
})

// 计算事件的已过天数和剩余天数
function getEventDays(event) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(event.targetDate)
  target.setHours(0, 0, 0, 0)

  if (event.repeatType === 'NONE') {
    // 单次事件
    const diff = Math.floor((today - target) / 86400000)
    if (diff >= 0) {
      return { elapsed: diff, remaining: null }
    } else {
      return { elapsed: null, remaining: -diff }
    }
  }

  // 循环事件：找到最近一次已过的 occurrence 和下一次 occurrence
  let lastOccurrence, nextOccurrence

  if (event.repeatType === 'YEARLY') {
    const thisYear = getClampedDate(today.getFullYear(), target.getMonth(), target.getDate())
    if (thisYear <= today) {
      lastOccurrence = thisYear
      nextOccurrence = getClampedDate(today.getFullYear() + 1, target.getMonth(), target.getDate())
    } else {
      lastOccurrence = getClampedDate(today.getFullYear() - 1, target.getMonth(), target.getDate())
      nextOccurrence = thisYear
    }
  } else if (event.repeatType === 'MONTHLY') {
    // 本月的 occurrence（考虑月份天数限制，如31号在2月/4月自动对齐月末）
    const thisMonth = getClampedDate(today.getFullYear(), today.getMonth(), target.getDate())
    if (thisMonth <= today) {
      lastOccurrence = thisMonth
      nextOccurrence = getClampedDate(today.getFullYear(), today.getMonth() + 1, target.getDate())
    } else {
      lastOccurrence = getClampedDate(today.getFullYear(), today.getMonth() - 1, target.getDate())
      nextOccurrence = thisMonth
    }
  }

  const elapsed = Math.floor((today - lastOccurrence) / 86400000)
  const remaining = Math.floor((nextOccurrence - today) / 86400000)

  return { elapsed, remaining }
}

function formatEventDate(event) {
  const parts = event.targetDate.split('-')
  if (event.repeatType === 'MONTHLY') return `${parseInt(parts[2])}号`
  if (event.repeatType === 'YEARLY') return `${parseInt(parts[1])}.${parseInt(parts[2])}`
  return formatDate(event.targetDate)
}

function getElapsed(event) {
  return getEventDays(event).elapsed
}

function getRemaining(event) {
  return getEventDays(event).remaining
}

function getNextDate(event) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(event.targetDate)

  if (event.repeatType === 'NONE') {
    if (new Date(event.targetDate) <= today) return ''
    return formatDate(event.targetDate)
  }

  let nextOccurrence
  if (event.repeatType === 'YEARLY') {
    const thisYear = getClampedDate(today.getFullYear(), target.getMonth(), target.getDate())
    nextOccurrence = thisYear > today ? thisYear : getClampedDate(today.getFullYear() + 1, target.getMonth(), target.getDate())
  } else if (event.repeatType === 'MONTHLY') {
    const thisMonth = getClampedDate(today.getFullYear(), today.getMonth(), target.getDate())
    nextOccurrence = thisMonth > today ? thisMonth : getClampedDate(today.getFullYear(), today.getMonth() + 1, target.getDate())
  }

  const m = String(nextOccurrence.getMonth() + 1).padStart(2, '0')
  const d = String(nextOccurrence.getDate()).padStart(2, '0')
  if (event.repeatType === 'YEARLY') return `${nextOccurrence.getFullYear()}.${m}.${d}`
  return `${m}.${d}`
}

function onMainCardClick() {
  if (!isLoggedIn()) {
    requireLogin('登录后即可设置属于你们的专属恋爱天数与卡片，是否前往登录？')
    return
  }
  if (cardDrawerVisible.value) return
  if (!hasAnniversary.value) {
    forcePrompt.value = true
    showPrompt.value = false
    nextTick(() => {
      showPrompt.value = true
    })
  } else {
    cardDrawerVisible.value = true
    try { uni.hideTabBar() } catch (e) {}
  }
}

function closeDrawer() {
  cardDrawerVisible.value = false
  editingCardBg.value = false
  editTextColor.value = ''
  try { uni.showTabBar() } catch (e) {}
}

function updateAnniversary() {
  cardDrawerVisible.value = false
  forcePrompt.value = true
  showPrompt.value = false
  nextTick(() => {
    showPrompt.value = true
  })
}

async function resetCardBg() {
  closeDrawer()
  try {
    await request({
      url: '/api/anniversary',
      method: 'PUT',
      data: { backgroundImage: '', cardBgBlur: '0', cardTextColor: '', cardBgPositionX: '50', cardBgPositionY: '50', cardBgScale: '100' },
    })
    cardBgImage.value = ''
    cardBgBlurValue.value = 0
    cardTextColor.value = ''
    cardBgPositionX.value = 50
    cardBgPositionY.value = 50
    cardBgScale.value = 100
    uni.showToast({ title: '已恢复默认', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

function editCardBg() {
  editingCardBg.value = true
  tempCardBgUrl.value = ''
  cardBgBlurLevel.value = cardBgBlurValue.value
  editTextColor.value = cardTextColor.value || ''
  editCardBgPositionX.value = cardBgPositionX.value
  editCardBgPositionY.value = cardBgPositionY.value
  editCardBgScale.value = cardBgScale.value
}

function getImageRatio(src, cb) {
  // #ifdef MP-WEIXIN
  wx.getImageInfo({ src, success: (info) => cb(info.width / info.height), fail: () => cb(0) })
  // #endif
  // #ifndef MP-WEIXIN
  cb(0)
  // #endif
}

function pickCardBgImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: (res) => {
      const localPath = res.tempFilePaths[0]
      getImageRatio(localPath, (r) => { cardBgImageRatio.value = r })
      uni.showLoading({ title: '处理中...' })
      upload('/api/photo/upload', localPath).then((data) => {
        uni.hideLoading()
        tempCardBgUrl.value = data.url
        editCardBgPositionX.value = 50
        editCardBgPositionY.value = 50
        editCardBgScale.value = 100
      }).catch(() => {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'none' })
      })
    },
  })
}

function restoreCardBgDefault() {
  uni.showModal({
    title: '恢复默认',
    content: '确定要恢复默认背景吗？自定义封面和模糊设置将被清除。',
    confirmColor: '#C47A92',
    success: async (res) => {
      if (!res.confirm) return
      closeDrawer()
      editingCardBg.value = false
      tempCardBgUrl.value = ''
      try {
        await request({
          url: '/api/anniversary',
          method: 'PUT',
          data: { backgroundImage: '', cardBgBlur: '0', cardTextColor: '', cardBgPositionX: '50', cardBgPositionY: '50', cardBgScale: '100' },
        })
        cardBgImage.value = ''
        cardBgBlurValue.value = 0
        cardTextColor.value = ''
        cardBgPositionX.value = 50
        cardBgPositionY.value = 50
        cardBgScale.value = 100
        uni.showToast({ title: '已恢复默认', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
  })
}

function cancelCardBgEdit() {
  editingCardBg.value = false
  tempCardBgUrl.value = ''
  editCardBgPositionX.value = 50
  editCardBgPositionY.value = 50
  editCardBgScale.value = 100
}

// 封面触摸拖动和缩放
let touchStartX = 0, touchStartY = 0
let touchStartPosX = 50, touchStartPosY = 50, touchStartScale = 100
let lastDist = 0

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function onCardTouchStart(e) {
  if (!editingCardBg.value || !hasEditingBgImage.value) return
  const ts = e.touches
  if (ts.length === 1) {
    touchStartX = ts[0].clientX
    touchStartY = ts[0].clientY
    touchStartPosX = editCardBgPositionX.value
    touchStartPosY = editCardBgPositionY.value
    lastDist = 0
  } else if (ts.length === 2) {
    lastDist = getTouchDist(ts)
    touchStartScale = editCardBgScale.value
  }
}

function onCardTouchMove(e) {
  if (!editingCardBg.value || !hasEditingBgImage.value) return
  e.preventDefault()
  const ts = e.touches
  if (ts.length === 1 && lastDist === 0) {
    // 单指平移（缩放越大灵敏度越低，保持手感一致）
    const s = Math.max(editCardBgScale.value / 100, 1)
    const sens = 0.55 / (1 + (s - 1) * 3)
    const deltaX = (touchStartX - ts[0].clientX) * sens
    const deltaY = (touchStartY - ts[0].clientY) * sens
    editCardBgPositionX.value = Math.round(Math.max(0, Math.min(100, touchStartPosX + deltaX)))
    editCardBgPositionY.value = Math.round(Math.max(0, Math.min(100, touchStartPosY + deltaY)))
  } else if (ts.length === 2) {
    // 双指缩放（基于初始距离对比，避免抖动）
    const dist = getTouchDist(ts)
    if (lastDist > 0) {
      const ratio = dist / lastDist
      const newScale = Math.round(Math.max(100, Math.min(500, touchStartScale * ratio)) / 5) * 5
      editCardBgScale.value = newScale
    }
  }
}

function onCardTouchEnd() {
  lastDist = 0
}

async function saveCardBg() {
  const payload = {
    cardBgBlur: String(cardBgBlurLevel.value),
    cardTextColor: editTextColor.value || '',
    cardBgPositionX: String(editCardBgPositionX.value),
    cardBgPositionY: String(editCardBgPositionY.value),
    cardBgScale: String(editCardBgScale.value),
  }
  if (tempCardBgUrl.value) payload.backgroundImage = tempCardBgUrl.value

  try {
    await request({ url: '/api/anniversary', method: 'PUT', data: payload })
    if (tempCardBgUrl.value) cardBgImage.value = tempCardBgUrl.value
    cardBgBlurValue.value = cardBgBlurLevel.value
    cardTextColor.value = editTextColor.value
    cardBgPositionX.value = editCardBgPositionX.value
    cardBgPositionY.value = editCardBgPositionY.value
    cardBgScale.value = editCardBgScale.value
    editingCardBg.value = false
    tempCardBgUrl.value = ''
    closeDrawer()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

function onAnniversarySaved(dateStr) {
  hasAnniversary.value = true
  forcePrompt.value = false
  days.value = daysBetween(dateStr)
  startDate.value = formatDate(dateStr)
}

function onEventAction(event) {
  if (event.isMock) {
    requireLogin('登录后即可编辑或管理属于你们的纪念日，是否前往登录？')
    return
  }
  if (!requireLogin()) return
  uni.showActionSheet({
    itemList: ['编辑', '删除'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.navigateTo({ url: `/pages/anniversary/edit?id=${event.id}` })
      } else if (res.tapIndex === 1) {
        deleteEvent(event.id)
      }
    },
  })
}

async function deleteEvent(id) {
  if (String(id).startsWith('mock-')) return
  try {
    await request({ url: `/api/event/${id}`, method: 'DELETE' })
    events.value = events.value.filter(e => e.id !== id)
    uni.showToast({ title: '已删除', icon: 'success' })
  } catch (e) {}
}

function goCreate() {
  if (!requireLogin('登录后即可添加属于你们的专属纪念日与重要事件，是否前往登录？')) return
  uni.navigateTo({ url: '/pages/anniversary/edit' })
}

function goDetail(id) {
  if (String(id).startsWith('mock-')) {
    requireLogin('登录后即可查看和记录属于你们的事件详情，是否前往登录？')
    return
  }
  console.log('goDetail id:', id, 'url:', `/pages/anniversary/detail?id=${id}`)
  uni.navigateTo({ url: `/pages/anniversary/detail?id=${id}` })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #FAF5F7;
  overflow-y: auto;
  padding-bottom: 40rpx;
}

/* Main card */
.main-card {
  position: relative;
  margin: 16px 20px 0;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(232, 160, 180, 0.2);
}
.main-card-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(145deg, #E8A0B4 0%, #C47A92 40%, #9FC5E8 100%);
}
.main-card-bg-img {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100%; height: 100%;
}
.main-card-content {
  position: relative;
  padding: 32px 28px;
}
.main-card-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 3px;
  font-weight: 400;
}
.main-card-counter {
  display: flex;
  align-items: baseline;
  margin-top: 8px;
}
.main-card-number-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 14px;
}
.main-card-number {
  font-size: 80px;
  font-weight: 200;
  color: #FFFFFF;
  letter-spacing: -2px;
  line-height: 1;
}
.main-card-unit {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 8px;
  font-weight: 300;
}
.main-card-divider {
  width: 36px;
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
  margin-top: 8px;
}
.main-card-date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 1px;
  font-weight: 300;
}

/* Section */
.section {
  margin: 28px 20px 0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #2D2A2E;
}
.section-count {
  font-size: 13px;
  color: #A39DA8;
}

/* Event card */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.event-card {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 2px 16px rgba(45, 42, 46, 0.04);
}
.event-left-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}
.event-days-number {
  font-size: 32px;
  font-weight: 300;
  line-height: 1;
}
.days-passed {
  color: #E8A0B4;
}
.days-remaining {
  color: #9FC5E8;
}
.event-days-label {
  font-size: 11px;
  color: #A39DA8;
  margin-top: 4px;
}
.event-next-date {
  font-size: 10px;
  color: #B8B2BC;
  margin-top: 2px;
}
.event-separator {
  width: 1px;
  height: 40px;
  background: #F3ECF0;
  margin: 0 12px;
}
.event-info {
  flex: 1;
}
.event-right-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  padding-left: 12px;
  border-left: 1px solid #F3ECF0;
}
.event-name {
  font-size: 16px;
  font-weight: 500;
  color: #2D2A2E;
}
.event-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.event-date {
  font-size: 12px;
  color: #A39DA8;
}

/* Tag */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 500;
}
.tag-primary {
  background: rgba(232, 160, 180, 0.12);
  color: #C47A92;
}
.tag-secondary {
  background: rgba(159, 197, 232, 0.12);
  color: #6BA3D4;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
}
.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}
.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: #6B6570;
}
.empty-desc {
  font-size: 13px;
  color: #A39DA8;
  margin-top: 6px;
}

/* FAB */
.fab {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
  opacity: 0.5;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(232, 160, 180, 0.35);
}
.fab-icon {
  font-size: 28px;
  color: #FFFFFF;
  font-weight: 300;
  margin-top: -4px;
}

/* Drawer */
.drawer-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 900;
}
.card-drawer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 1000;
  background: #FFFFFF;
  border-radius: 24px 24px 0 0;
  padding: 16px 24px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.card-drawer.visible {
  transform: translateY(0);
}
.drawer-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: #E0DCE0; margin: 0 auto 16px;
}
.drawer-option {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 0;
}
.drawer-option-text {
  font-size: 16px; color: #2D2A2E;
}
.drawer-divider {
  height: 1px; background: #F3ECF0;
}
.drawer-cancel {
  margin-top: 12px; padding: 14px 0;
  text-align: center; background: #F8F5F8;
  border-radius: 16px;
}
.drawer-cancel-text {
  font-size: 15px; color: #6B6570; font-weight: 500;
}
.drawer-divider-line {
  height: 1px; background: #F3ECF0; margin: 0 0;
}

/* 背景编辑 */
.bg-edit-section {
  padding: 8px 0;
}
.bg-upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 0;
  background: rgba(196, 122, 146, 0.08);
  border-radius: 16px;
  margin-bottom: 12px;
}
.bg-upload-btn-text {
  font-size: 15px;
  color: #C47A92;
  font-weight: 500;
}
.bg-preview-wrap {
  width: 100%;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
  background: #F8F5F8;
  margin-bottom: 12px;
}
.bg-preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.bg-preview-hint {
  font-size: 12px;
  color: #A39DA8;
}
.blur-slider-label {
  margin-bottom: 4px;
}
.bg-blur-label {
  font-size: 13px;
  color: #2D2A2E;
}
.bg-edit-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.bg-edit-btn {
  flex: 1;
  padding: 12px 0;
  text-align: center;
  border-radius: 16px;
}
.bg-edit-btn.cancel {
  background: #F8F5F8;
}
.bg-edit-btn.confirm {
  background: rgba(232, 160, 180, 0.12);
}
.bg-edit-btn-text {
  font-size: 14px;
  color: #6B6570;
  font-weight: 500;
}

/* 色板 */
.color-section { margin-top: 12px; }
.color-label { font-size: 13px; color: #2D2A2E; display: block; margin-bottom: 8px; }
.color-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.color-swatch { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; }
.color-swatch.active { border-color: #C47A92; box-shadow: 0 0 0 2px rgba(196,122,146,0.3); }
</style>
