<template>
  <view class="page">
    <uni-nav-bar title="事件详情" :showBack="true" />

    <!-- 背景编辑遮罩 -->
    <view v-if="editingBg" class="bg-edit-mask" @tap="cancelBgEdit" />
    <view v-if="editingBg" class="bg-edit-panel">
      <view class="bg-edit-handle" />
      <view class="bg-edit-pick pressable" @tap="pickBgImage">
        <uni-icons type="refreshempty" size="20" :color="hasEditingBgImage ? '#C47A92' : '#A39DA8'" />
        <text class="bg-edit-pick-text" :style="hasEditingBgImage ? 'color:#C47A92' : ''">{{ hasEditingBgImage ? '更换图片' : '选择图片' }}</text>
      </view>
      <view v-if="hasEditingBgImage" class="bg-blur-section">
        <text class="bg-blur-label">模糊 {{ bgBlurLevel * 10 }}%</text>
        <slider :value="bgBlurLevel" :min="0" :max="10" :step="1"
                activeColor="#C47A92" backgroundColor="#F3ECF0" block-size="16" block-color="#C47A92"
                @change="e => bgBlurLevel = e.detail.value"
                @changing="e => bgBlurLevel = e.detail.value" />
      </view>
      <view class="bg-edit-actions">
        <view v-if="bgImage" class="bg-edit-btn pressable" @tap="clearBackground">
          <text class="bg-edit-btn-text" style="color:#D4524A">恢复默认</text>
        </view>
        <view class="bg-edit-btn pressable" @tap="saveBackground">
          <text class="bg-edit-btn-text" style="color:#C47A92;font-weight:600">保存</text>
        </view>
      </view>
    </view>

    <!-- 事件头部卡片 -->
    <view class="event-header pressable" @tap="onCardTap"
          :style="editingBg ? 'position:relative;z-index:950' : ''"
          @touchstart="onHeaderTouchStart" @touchmove.prevent="onHeaderTouchMove" @touchend="onHeaderTouchEnd">
      <view v-if="hasEditingBgImage" class="header-bg-img" :style="headerBgStyle" />
      <view class="header-overlay" :style="editingBg ? 'pointer-events:none' : ''">
        <text class="event-title">{{ event.name }}</text>
        <view class="header-tags">
          <view class="tag" :class="event.repeatType === 'NONE' ? 'tag-secondary' : 'tag-primary'">
            {{ getRepeatLabel(event.repeatType) }}
          </view>
        </view>
        <text class="event-date-text">{{ formatEventDate(event) }}</text>
        <view class="event-days-row">
          <view v-if="daysInfo.elapsed !== null" class="days-item">
            <text class="days-num">{{ daysInfo.elapsed }}</text>
            <text class="days-unit">天已过</text>
          </view>
          <view v-if="daysInfo.elapsed !== null && daysInfo.remaining !== null" class="days-divider" />
          <view v-if="daysInfo.remaining !== null" class="days-item">
            <text class="days-num remaining">{{ daysInfo.remaining }}</text>
            <text class="days-unit">天后</text>
          </view>
        </view>
        <text v-if="event.remark" class="event-remark">{{ event.remark }}</text>
      </view>
    </view>

    <!-- 照片记录 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">照片记录</text>
      </view>

      <!-- 横向时间线（只有照片的年份 + 左侧添加按钮） -->
      <scroll-view scroll-x class="h-timeline-wrap" :scroll-left="timelineScrollLeft" scroll-with-animation>
        <view class="h-timeline">
          <!-- 左侧添加按钮 -->
          <view class="h-timeline-item" @tap="onSupplement">
            <view class="h-dot-cell">
              <view class="h-timeline-dot add-dot">
                <text class="h-dot-year" style="color:#C47A92">+</text>
              </view>
              <text class="h-dot-label">添加</text>
            </view>
            <view v-if="photoOccurrences.length > 0" class="h-timeline-line" />
          </view>
          <!-- 有照片的记录 + 未来日期 -->
          <view v-for="(occ, idx) in photoOccurrences" :key="occ.date"
                class="h-timeline-item" @tap="selectOccurrence(occ)">
            <view v-if="idx > 0" class="h-timeline-line" />
            <view class="h-dot-cell">
              <view class="h-timeline-dot" :class="{ active: currentOcc && currentOcc.date === occ.date, future: occ.daysAgo < 0 }">
                <text class="h-dot-year">{{ getOccLabel(occ.date) }}</text>
              </view>
              <text class="h-dot-label">{{ occ.daysAgo < 0 ? '未到' : occ.photos.length + '张' }}</text>
            </view>
            <view v-if="idx < photoOccurrences.length - 1" class="h-timeline-line" />
          </view>
        </view>
      </scroll-view>

      <!-- 选中的记录卡片 -->
      <view v-if="currentOcc" class="occ-card">
        <view class="occ-card-header">
          <view class="occ-card-info">
            <text class="occ-card-date">{{ formatOccurrenceDate(currentOcc.date) }}</text>
            <text class="occ-card-days" v-if="currentOcc.daysAgo >= 0">{{ currentOcc.daysAgo === 0 ? '今天' : currentOcc.daysAgo + '天前' }}</text>
            <text class="occ-card-days future" v-else>{{ -currentOcc.daysAgo }}天后</text>
          </view>
          <view v-if="currentOcc.daysAgo >= 0 && currentOcc.photos.length < 4" class="occ-upload-btn pressable"
                @tap="pickPhotos(currentOcc.date, currentOcc.photos.length)">
            <uni-icons type="plusempty" size="14" color="#C47A92" />
            <text class="occ-upload-text">上传照片</text>
          </view>
        </view>

        <view v-if="currentOcc.daysAgo < 0" class="future-tip">
          <uni-icons type="info" size="16" color="#A39DA8" />
          <text class="future-tip-text">该日期尚未到达，暂不能上传照片</text>
        </view>

        <view v-else-if="currentOcc.photos.length > 0" class="photo-grid">
          <view v-for="(photo, idx) in currentOcc.photos" :key="photo.id"
                class="photo-cell pressable"
                @tap="previewPhoto(currentOcc.photos, idx)"
                @longpress="onPhotoLongPress(photo)">
            <image :src="photo.thumbnailUrl || photo.url" mode="aspectFill" class="photo-img" />
          </view>
          <view v-if="currentOcc.photos.length < 4" class="photo-cell add-cell pressable"
                @tap="pickPhotos(currentOcc.date, currentOcc.photos.length)">
            <view class="add-placeholder">
              <uni-icons type="plusempty" size="24" color="#D1CDD3" />
            </view>
          </view>
        </view>
        <view v-else class="empty-photos">
          <text class="empty-photos-text">暂无照片，点击上方上传</text>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-add-btn pressable" @tap="onSupplement">
          <uni-icons type="plusempty" size="28" color="#A39DA8" />
          <text class="empty-add-text">添加照片记录</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bottom-btn edit-btn pressable" @tap="goEdit">
        <uni-icons type="compose" size="18" color="#C47A92" />
        <text class="bottom-btn-text edit-text">编辑</text>
      </view>
      <view class="bottom-btn delete-btn pressable" @tap="onDeleteEvent">
        <uni-icons type="trash" size="18" color="#D4524A" />
        <text class="bottom-btn-text delete-text">删除</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request, upload } from '@/utils/request'
import { formatDate, getRepeatLabel, getClampedDate } from '@/utils/date'

const event = ref({})
const photos = ref([])
const photoOccurrences = ref([])
const bgImage = ref('')
const currentOcc = ref(null)
const timelineScrollLeft = ref(999)
const bgBlur = ref(0)
const bgPositionX = ref(50)
const bgPositionY = ref(50)
const bgScale = ref(100)
const editingBg = ref(false)
const tempBgUrl = ref('')
const bgBlurLevel = ref(0)
const editBgPositionX = ref(50)
const editBgPositionY = ref(50)
const editBgScale = ref(100)
let eventId = null

const daysInfo = computed(() => {
  if (!event.value.targetDate) return { elapsed: null, remaining: null }
  return getEventDays(event.value)
})

const hasEditingBgImage = computed(() => !!tempBgUrl.value || !!bgImage.value)

const previewBgImage = computed(() => {
  if (editingBg.value && tempBgUrl.value) return tempBgUrl.value
  return bgImage.value
})
const previewBgBlur = computed(() => {
  if (editingBg.value && tempBgUrl.value) return bgBlurLevel.value
  return bgBlur.value
})

const headerImageRatio = ref(0)

const headerLocalStyle = computed(() => {
  const blur = bgBlurLevel.value
  const style = {}
  if (blur > 0) style.filter = `blur(${blur}px)`
  return style
})

const headerBgStyle = computed(() => {
  const img = editingBg.value ? (tempBgUrl.value || bgImage.value) : bgImage.value
  const blur = (editingBg.value && tempBgUrl.value) ? bgBlurLevel.value : bgBlur.value
  const px = editingBg.value ? editBgPositionX.value : bgPositionX.value
  const py = editingBg.value ? editBgPositionY.value : bgPositionY.value
  const s = editingBg.value ? editBgScale.value : bgScale.value
  const style = {}
  style.backgroundImage = `url(${img})`
  if (s <= 100) {
    style.backgroundSize = 'cover'
  } else if (headerImageRatio.value > 0) {
    style.backgroundSize = headerImageRatio.value > 2 ? `auto ${s}%` : `${s}% auto`
  } else {
    style.backgroundSize = `${s}% auto`
  }
  style.backgroundPosition = `${px}% ${py}%`
  style.backgroundRepeat = 'no-repeat'
  if (blur > 0) style.filter = `blur(${blur}px)`
  return style
})

onShow(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const id = page.$page?.options?.id || page.options?.id
  console.log('detail onShow page:', page, 'id:', id, 'options:', page.$page?.options, page.options)
  if (id) {
    eventId = id
    loadData()
  }
})

async function loadData() {
  try {
    const events = await request({ url: '/api/event/list' })
    const found = events.find(e => String(e.id) === String(eventId))
    if (found) {
      event.value = found
      bgImage.value = found.backgroundImage || ''
      bgBlur.value = found.backgroundBlur || 0
      if (bgImage.value) getImageRatio(bgImage.value, (r) => { headerImageRatio.value = r })
      bgPositionX.value = found.backgroundPositionX != null ? found.backgroundPositionX : 50
      bgPositionY.value = found.backgroundPositionY != null ? found.backgroundPositionY : 50
      bgScale.value = found.backgroundScale != null ? found.backgroundScale : 100
    }
  } catch (e) {}
  try {
    photos.value = await request({ url: `/api/event-photo/${eventId}` })
  } catch (e) {
    photos.value = []
  }
  buildOccurrences()
}

function buildOccurrences() {
  if (!event.value.targetDate) return
  const ev = event.value
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(ev.targetDate)
  const dates = []

  if (ev.repeatType === 'YEARLY') {
    const startYear = Math.max(target.getFullYear(), 2001)
    for (let y = today.getFullYear(); y >= startYear; y--) {
      const d = getClampedDate(y, target.getMonth(), target.getDate())
      if (d <= today) dates.push(d)
    }
    // 加一个最近的未来日期
    const nextYear = today.getFullYear() + 1
    const nextDate = getClampedDate(nextYear, target.getMonth(), target.getDate())
    if (!dates.find(d => d.getFullYear() === nextYear)) dates.push(nextDate)
  } else if (ev.repeatType === 'MONTHLY') {
    const day = target.getDate()
    let y = today.getFullYear()
    let m = today.getMonth()
    for (let i = 0; i < 24; i++) {
      const d = getClampedDate(y, m, day)
      if (d <= today) dates.push(d)
      m--
      if (m < 0) { m = 11; y-- }
    }
    // 加一个最近的未来月份
    const nm = today.getMonth() + 1
    const ny = nm > 11 ? today.getFullYear() + 1 : today.getFullYear()
    const nextDate = getClampedDate(ny, nm > 11 ? 0 : nm, day)
    dates.push(nextDate)
  } else {
    if (target <= today) dates.push(target)
    else dates.push(target) // 单次未来事件也显示
  }

  const photoMap = {}
  for (const p of photos.value) {
    const key = p.occurrenceDate
    if (!photoMap[key]) photoMap[key] = []
    photoMap[key].push(p)
  }

  // 有照片的 + 最近一个未来日期，按日期升序（最旧在左，最新在右）
  photoOccurrences.value = dates
    .map(d => {
      const dateStr = formatDateISO(d)
      return {
        date: dateStr,
        daysAgo: Math.floor((today - d) / 86400000),
        photos: photoMap[dateStr] || [],
      }
    })
    .filter(occ => occ.photos.length > 0 || occ.daysAgo < 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  // 保持当前选中，或默认选中最近的有照片记录
  const prevDate = currentOcc.value?.date
  const match = prevDate ? photoOccurrences.value.find(o => o.date === prevDate) : null
  if (match) {
    currentOcc.value = match
  } else {
    const withPhotos = photoOccurrences.value.filter(o => o.photos.length > 0)
    currentOcc.value = withPhotos.length > 0 ? withPhotos[withPhotos.length - 1] : null
  }
  timelineScrollLeft.value = 9999
}

function selectOccurrence(occ) {
  currentOcc.value = occ
}

// 补充记录
function onSupplement() {
  const ev = event.value
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(ev.targetDate)

  if (ev.repeatType === 'NONE') {
    if (target > today) {
      uni.showToast({ title: '事件尚未开始', icon: 'none' })
      return
    }
    const dateStr = formatDateISO(target)
    const existing = photoOccurrences.value.find(o => o.date === dateStr)
    if (existing && existing.photos.length > 0) {
      selectOccurrence(existing)
      uni.showToast({ title: '该事件已有照片记录', icon: 'none' })
      return
    }
    openOccurrence(dateStr)
    return
  }

  const thisYear = today.getFullYear()
  const startYear = Math.max(target.getFullYear(), 2001)
  const years = []
  for (let y = thisYear; y >= startYear; y--) years.push(y)

  if (ev.repeatType === 'YEARLY') {
    // 过滤掉未来年份
    const validYears = years.filter(y => {
      const d = new Date(y, target.getMonth(), target.getDate())
      return d <= today
    })
    if (validYears.length === 0) {
      uni.showToast({ title: '暂无可补充的年份', icon: 'none' })
      return
    }
    showYearPicker(validYears, (year) => {
      const date = new Date(year, target.getMonth(), target.getDate())
      openOccurrence(formatDateISO(date))
    })
  } else if (ev.repeatType === 'MONTHLY') {
    showYearPicker(years, (year) => {
      const day = target.getDate()
      // 过滤掉未来月份
      const validMonths = []
      const monthIndices = []
      for (let m = 0; m < 12; m++) {
        const d = new Date(year, m, day)
        if (d.getMonth() === m && d <= today) {
          validMonths.push((m + 1) + '月')
          monthIndices.push(m)
        }
      }
      if (validMonths.length === 0) {
        uni.showToast({ title: '该年份暂无可补充的月份', icon: 'none' })
        return
      }
      uni.showActionSheet({
        itemList: validMonths,
        success: (res2) => {
          const month = monthIndices[res2.tapIndex]
          const date = new Date(year, month, day)
          openOccurrence(formatDateISO(date))
        },
      })
    })
  }
}

function openOccurrence(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // 如果已在列表中，直接选中
  const existing = photoOccurrences.value.find(o => o.date === dateStr)
  if (existing) {
    currentOcc.value = existing
    return
  }
  // 否则临时创建一个空记录用于上传
  currentOcc.value = {
    date: dateStr,
    daysAgo: Math.floor((today - new Date(dateStr)) / 86400000),
    photos: [],
  }
}

function showYearPicker(years, callback) {
  const hasMore = years.length > 5
  const recentYears = hasMore ? years.slice(0, 5) : years
  const items = recentYears.map(y => y + '年')
  if (hasMore) items.push('更早的年份...')

  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      if (hasMore && res.tapIndex === 5) {
        showYearPicker(years.slice(5), callback)
      } else {
        callback(recentYears[res.tapIndex])
      }
    },
  })
}

function formatDateISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getEventDays(event) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(event.targetDate)
  target.setHours(0, 0, 0, 0)

  if (event.repeatType === 'NONE') {
    const diff = Math.floor((today - target) / 86400000)
    if (diff >= 0) return { elapsed: diff, remaining: null }
    return { elapsed: null, remaining: -diff }
  }

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
    const thisMonth = getClampedDate(today.getFullYear(), today.getMonth(), target.getDate())
    if (thisMonth <= today) {
      lastOccurrence = thisMonth
      nextOccurrence = getClampedDate(today.getFullYear(), today.getMonth() + 1, target.getDate())
    } else {
      lastOccurrence = getClampedDate(today.getFullYear(), today.getMonth() - 1, target.getDate())
      nextOccurrence = thisMonth
    }
  }

  return {
    elapsed: Math.floor((today - lastOccurrence) / 86400000),
    remaining: Math.floor((nextOccurrence - today) / 86400000),
  }
}

function formatEventDate(event) {
  if (!event.targetDate) return ''
  const parts = event.targetDate.split('-')
  if (event.repeatType === 'MONTHLY') return `每月${parseInt(parts[2])}号`
  if (event.repeatType === 'YEARLY') return `每年${parseInt(parts[1])}月${parseInt(parts[2])}日`
  return formatDate(event.targetDate)
}

function formatOccurrenceDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function getOccLabel(dateStr) {
  const ev = event.value
  const d = new Date(dateStr)
  if (ev.repeatType === 'MONTHLY') {
    return `${d.getMonth() + 1}月`
  }
  return `${d.getFullYear()}`
}

// 背景编辑
function onCardTap() {
  if (editingBg.value) return
  editingBg.value = true
  tempBgUrl.value = ''
  bgBlurLevel.value = bgBlur.value || 0
  editBgPositionX.value = bgPositionX.value
  editBgPositionY.value = bgPositionY.value
  editBgScale.value = bgScale.value
  uni.showToast({ title: '已进入封面调整模式', icon: 'none', duration: 1500 })
}

function getImageRatio(src, cb) {
  // #ifdef MP-WEIXIN
  wx.getImageInfo({ src, success: (info) => cb(info.width / info.height), fail: () => cb(0) })
  // #endif
  // #ifndef MP-WEIXIN
  cb(0)
  // #endif
}

function pickBgImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: (res) => {
      const localPath = res.tempFilePaths[0]
      getImageRatio(localPath, (r) => { headerImageRatio.value = r })
      uni.showLoading({ title: '处理中...' })
      upload('/api/photo/upload', localPath).then((data) => {
        uni.hideLoading()
        tempBgUrl.value = data.url
        editBgPositionX.value = 50
        editBgPositionY.value = 50
        editBgScale.value = 100
      }).catch(() => {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'none' })
      })
    },
  })
}

function cancelBgEdit() {
  editingBg.value = false
  tempBgUrl.value = ''
  editBgPositionX.value = 50
  editBgPositionY.value = 50
  editBgScale.value = 100
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

function onHeaderTouchStart(e) {
  if (!editingBg.value || !hasEditingBgImage.value) return
  const ts = e.touches
  if (ts.length === 1) {
    touchStartX = ts[0].clientX
    touchStartY = ts[0].clientY
    touchStartPosX = editBgPositionX.value
    touchStartPosY = editBgPositionY.value
    lastDist = 0
  } else if (ts.length === 2) {
    lastDist = getTouchDist(ts)
    touchStartScale = editBgScale.value
  }
}

function onHeaderTouchMove(e) {
  if (!editingBg.value || !hasEditingBgImage.value) return
  e.preventDefault()
  const ts = e.touches
  if (ts.length === 1 && lastDist === 0) {
    const s = Math.max(editBgScale.value / 100, 1)
    const sens = 0.55 / (1 + (s - 1) * 3)
    const deltaX = (touchStartX - ts[0].clientX) * sens
    const deltaY = (touchStartY - ts[0].clientY) * sens
    editBgPositionX.value = Math.round(Math.max(0, Math.min(100, touchStartPosX + deltaX)))
    editBgPositionY.value = Math.round(Math.max(0, Math.min(100, touchStartPosY + deltaY)))
  } else if (ts.length === 2) {
    const dist = getTouchDist(ts)
    if (lastDist > 0) {
      const ratio = dist / lastDist
      const newScale = Math.round(Math.max(100, Math.min(500, touchStartScale * ratio)) / 5) * 5
      editBgScale.value = newScale
    }
  }
}

function onHeaderTouchEnd() {
  lastDist = 0
}

async function saveBackground() {
  const payload = {
    backgroundBlur: bgBlurLevel.value,
    backgroundPositionX: editBgPositionX.value,
    backgroundPositionY: editBgPositionY.value,
    backgroundScale: editBgScale.value,
  }
  if (tempBgUrl.value) payload.backgroundImage = tempBgUrl.value

  try {
    await request({ url: `/api/event/${eventId}`, method: 'PUT', data: payload })
    if (tempBgUrl.value) {
      bgImage.value = tempBgUrl.value
      event.value.backgroundImage = tempBgUrl.value
    }
    bgBlur.value = bgBlurLevel.value
    bgPositionX.value = editBgPositionX.value
    bgPositionY.value = editBgPositionY.value
    bgScale.value = editBgScale.value
    editingBg.value = false
    tempBgUrl.value = ''
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

function clearBackground() {
  uni.showModal({
    title: '恢复默认',
    content: '确定清除自定义背景吗？',
    confirmColor: '#C47A92',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await request({
          url: `/api/event/${eventId}`,
          method: 'PUT',
          data: { backgroundImage: '', backgroundBlur: 0, backgroundPositionX: 50, backgroundPositionY: 50, backgroundScale: 100 },
        })
        bgImage.value = ''
        bgBlur.value = 0
        bgPositionX.value = 50
        bgPositionY.value = 50
        bgScale.value = 100
        event.value.backgroundImage = ''
        event.value.backgroundBlur = 0
        editingBg.value = false
        tempBgUrl.value = ''
        uni.showToast({ title: '已恢复默认', icon: 'success' })
      } catch (e) {}
    },
  })
}

// 照片操作
function pickPhotos(occurrenceDate, currentCount) {
  const remaining = 4 - currentCount
  if (remaining <= 0) {
    uni.showToast({ title: '该日期最多4张照片', icon: 'none' })
    return
  }
  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      try {
        for (const path of res.tempFilePaths) {
          await upload('/api/event-photo/upload', path, {
            eventId: eventId,
            occurrenceDate: occurrenceDate,
          })
        }
        photos.value = await request({ url: `/api/event-photo/${eventId}` })
        buildOccurrences()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
  })
}

function previewPhoto(occPhotos, index) {
  uni.previewImage({
    urls: occPhotos.map(p => p.url),
    current: occPhotos[index].url,
  })
}

function onPhotoLongPress(photo) {
  uni.showActionSheet({
    itemList: ['保存图片', '删除照片'],
    success: (res) => {
      if (res.tapIndex === 0) {
        saveImage(photo.url)
      } else if (res.tapIndex === 1) {
        deletePhoto(photo.id)
      }
    },
  })
}

function saveImage(url) {
  uni.showLoading({ title: '保存中...' })
  uni.downloadFile({
    url,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => uni.showToast({ title: '已保存', icon: 'success' }),
          fail: () => uni.showToast({ title: '保存失败', icon: 'none' }),
        })
      }
    },
    complete: () => uni.hideLoading(),
  })
}

async function deletePhoto(photoId) {
  uni.showModal({
    title: '删除照片',
    content: '确定删除这张照片吗？',
    confirmColor: '#D4524A',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await request({ url: `/api/event-photo/${photoId}`, method: 'DELETE' })
        photos.value = photos.value.filter(p => p.id !== photoId)
        buildOccurrences()
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (e) {}
    },
  })
}

// 底部操作
function goEdit() {
  console.log('goEdit eventId:', eventId)
  uni.navigateTo({ url: `/pages/anniversary/edit?id=${eventId}` })
}

function onDeleteEvent() {
  uni.showModal({
    title: '删除事件',
    content: '确定删除该事件吗？所有照片记录将同时删除。',
    confirmColor: '#D4524A',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await request({ url: `/api/event/${eventId}`, method: 'DELETE' })
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1200)
      } catch (e) {}
    },
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #FAF5F7;
  padding-bottom: 100px;
}

/* 背景编辑面板 */
.bg-edit-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.4);
  z-index: 900;
}
.bg-edit-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 950;
  background: #FFFFFF;
  border-radius: 20px 20px 0 0;
  padding: 12px 24px 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}
.bg-edit-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #E0DCE0;
  margin: 0 auto 16px;
}
.bg-edit-pick {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 2px dashed #E8E0E5;
  border-radius: 12px;
  margin-bottom: 12px;
}
.bg-edit-pick-text {
  font-size: 14px;
  color: #A39DA8;
}
.bg-blur-section {
  margin-bottom: 12px;
}
.bg-blur-label {
  display: block;
  font-size: 13px;
  color: #2D2A2E;
  margin-bottom: 4px;
}
.bg-edit-actions {
  display: flex;
  gap: 12px;
  border-top: 1px solid #F3ECF0;
  padding-top: 16px;
}
.bg-edit-btn {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F3ECF0;
}
.bg-edit-btn-text {
  font-size: 15px;
}

/* 事件头部 */
.event-header {
  position: relative;
  margin: 16px;
  border-radius: 24px;
  overflow: hidden;
  min-height: 200px;
}
.header-bg-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.header-overlay {
  position: relative;
  z-index: 1;
  padding: 32px 24px;
  background: linear-gradient(135deg, rgba(232,160,180,0.92), rgba(196,122,146,0.88));
}
.header-bg-img ~ .header-overlay {
  background: linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.25));
}
.event-title {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
}
.header-tags {
  margin-bottom: 12px;
}
.tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.tag-primary {
  background: rgba(255,255,255,0.25);
  color: #FFFFFF;
}
.tag-secondary {
  background: rgba(255,255,255,0.25);
  color: #FFFFFF;
}
.event-date-text {
  display: block;
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  margin-bottom: 16px;
}
.event-days-row {
  display: flex;
  align-items: center;
  gap: 20px;
}
.days-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.days-num {
  font-size: 36px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1;
}
.days-unit {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
}
.days-divider {
  width: 1px;
  height: 30px;
  background: rgba(255,255,255,0.3);
}
.event-remark {
  display: block;
  margin-top: 16px;
  font-size: 13px;
  color: rgba(255,255,255,0.75);
  line-height: 1.5;
}

/* 照片记录 */
.section {
  margin: 0 16px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 4px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2D2A2E;
}

/* 横向时间线 */
.h-timeline-wrap {
  white-space: nowrap;
  margin-bottom: 16px;
  overflow: visible;
}
.h-timeline {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
}
.h-timeline-item {
  display: flex;
  align-items: center;
}
.h-dot-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.h-timeline-line {
  width: 24px;
  height: 2px;
  background: #E8E0E5;
  flex-shrink: 0;
  align-self: center;
}
.h-dot-label {
  font-size: 10px;
  color: #A39DA8;
  white-space: nowrap;
  margin-top: 4px;
  width: 30px;
  text-align: center;
}
.h-timeline-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(232,160,180,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  flex-shrink: 0;
}
.h-timeline-dot.add-dot {
  background: #F3ECF0;
  border: 2px dashed #D1CDD3;
}
.h-timeline-dot.future {
  background: rgba(159,197,232,0.15);
  border: 2px dashed #9FC5E8;
}
.h-timeline-dot.active {
  border-color: #C47A92;
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
}
.h-timeline-dot.active .h-dot-year {
  color: #FFFFFF;
}
.h-dot-year {
  font-size: 10px;
  font-weight: 600;
  color: #6B6570;
}

/* 记录卡片 */
.occ-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 4px 24px rgba(45,42,46,0.04);
}
.occ-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.occ-card-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.occ-card-date {
  font-size: 16px;
  font-weight: 600;
  color: #2D2A2E;
}
.occ-card-days {
  font-size: 12px;
  color: #A39DA8;
}
.occ-card-days.future {
  color: #9FC5E8;
}
.future-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: #F8F6F8;
  border-radius: 12px;
}
.future-tip-text {
  font-size: 13px;
  color: #A39DA8;
}
.occ-upload-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: rgba(232,160,180,0.1);
  border-radius: 20px;
}
.occ-upload-text {
  font-size: 13px;
  color: #C47A92;
  font-weight: 500;
}

/* 照片网格 */
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.photo-cell {
  width: calc(33.333% - 6px);
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
}
.photo-img {
  width: 100%;
  height: 100%;
  display: block;
}
.add-cell {
  border: 2px dashed #E8E0E5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.add-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 空照片 */
.empty-photos {
  padding: 16px 0;
  text-align: center;
}
.empty-photos-text {
  font-size: 13px;
  color: #D1CDD3;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}
.empty-add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 32px;
  border: 2px dashed #E8E0E5;
  border-radius: 16px;
}
.empty-add-text {
  font-size: 14px;
  color: #A39DA8;
}
.empty-title {
  font-size: 14px;
  color: #A39DA8;
  margin-top: 12px;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: rgba(250,245,247,0.92);
  border-top: 1px solid #F3ECF0;
}
.bottom-btn {
  flex: 1;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #F3ECF0;
  background: #FFFFFF;
}
.bottom-btn-text {
  font-size: 15px;
  font-weight: 500;
}
.edit-text {
  color: #C47A92;
}
.delete-text {
  color: #D4524A;
}
</style>
