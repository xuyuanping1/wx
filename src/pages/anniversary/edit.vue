<template>
  <view class="page">
    <uni-nav-bar title="编辑纪念日" :showBack="true" />
    <!-- 事件类型选择 -->
    <view class="type-selector">
      <view class="type-option pressable"
            :class="eventCategory === 'repeat' ? 'type-active' : ''"
            @tap="eventCategory = 'repeat'; form.repeatType = 'YEARLY'">
        <text class="type-icon">🔄</text>
        <text class="type-label" :class="eventCategory === 'repeat' ? 'type-label-active' : ''">循环事件</text>
        <text class="type-desc">每年/每月重复</text>
      </view>
      <view class="type-option pressable"
            :class="eventCategory === 'once' ? 'type-active' : ''"
            @tap="eventCategory = 'once'; form.repeatType = 'NONE'">
        <text class="type-icon">📌</text>
        <text class="type-label" :class="eventCategory === 'once' ? 'type-label-active' : ''">单次事件</text>
        <text class="type-desc">仅记录一次</text>
      </view>
    </view>

    <view class="form-card">
      <!-- 事件名称 -->
      <view class="form-group">
        <text class="form-label">事件名称</text>
        <input v-model="form.name"
               placeholder="如：第一次旅行"
               placeholder-class="placeholder"
               class="form-input" />
      </view>

      <view class="form-divider" />

      <!-- 循环类型（仅循环事件显示） -->
      <template v-if="eventCategory === 'repeat'">
        <view class="form-group">
          <text class="form-label">重复频率</text>
          <view class="repeat-options">
            <view class="repeat-option pressable"
                  :class="form.repeatType === 'YEARLY' ? 'repeat-active' : ''"
                  @tap="form.repeatType = 'YEARLY'">
              <text class="repeat-text" :class="form.repeatType === 'YEARLY' ? 'repeat-text-active' : ''">每年</text>
            </view>
            <view class="repeat-option pressable"
                  :class="form.repeatType === 'MONTHLY' ? 'repeat-active' : ''"
                  @tap="form.repeatType = 'MONTHLY'">
              <text class="repeat-text" :class="form.repeatType === 'MONTHLY' ? 'repeat-text-active' : ''">每月</text>
            </view>
          </view>
        </view>
        <view class="form-divider" />
      </template>

      <!-- 日期选择 -->
      <view class="form-group">
        <text class="form-label">
          {{ eventCategory === 'once' ? '目标日' : form.repeatType === 'YEARLY' ? '每年几月几日' : '每月几号' }}
        </text>

        <!-- 单次事件：完整日期选择 -->
        <picker v-if="eventCategory === 'once'" mode="date" :value="form.targetDate" @change="onDateChange">
          <view class="picker-display">
            <text :class="form.targetDate ? 'picker-value' : 'picker-placeholder'">
              {{ form.targetDate || '选择一个日期' }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>

        <!-- 每年：选月+日 -->
        <view v-else-if="form.repeatType === 'YEARLY'" class="picker-row">
          <picker mode="multiSelector" :range="monthDayRange" :value="monthDayValue" @change="onMonthDayChange">
            <view class="picker-display">
              <text :class="form.targetDate ? 'picker-value' : 'picker-placeholder'">
                {{ monthDayLabel || '选择月和日' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>

        <!-- 每月：选日 -->
        <view v-else class="picker-row">
          <picker :range="dayRange" :value="dayIndex" @change="onDayChange">
            <view class="picker-display">
              <text :class="form.targetDate ? 'picker-value' : 'picker-placeholder'">
                {{ dayLabel || '选择几号' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
      </view>

      <view class="form-divider" />

      <!-- 备注 -->
      <view class="form-group">
        <text class="form-label">备注（选填）</text>
        <textarea v-model="form.remark"
                  placeholder="记录一些细节..."
                  placeholder-class="placeholder"
                  class="form-textarea"
                  :maxlength="100" />
      </view>
    </view>

    <view class="submit-wrap">
      <button class="submit-btn pressable" @tap="submit">
        {{ isEdit ? '保存修改' : '创建纪念日' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'

const isEdit = ref(false)
const editId = ref(null)
const eventCategory = ref('repeat')

const form = reactive({
  name: '',
  targetDate: '',
  repeatType: 'YEARLY',
  remark: '',
})

// 编辑模式：加载已有数据
onLoad((options) => {
  console.log('edit onLoad options:', options)
  if (options.id) {
    isEdit.value = true
    editId.value = options.id
    loadEvent(options.id)
  }
})

async function loadEvent(id) {
  try {
    const events = await request({ url: '/api/event/list' })
    const event = events.find(e => String(e.id) === String(id))
    console.log('loadEvent id:', id, 'found:', event)
    if (event) {
      form.name = event.name
      form.targetDate = event.targetDate
      form.repeatType = event.repeatType
      form.remark = event.remark || ''
      eventCategory.value = event.repeatType === 'NONE' ? 'once' : 'repeat'
      console.log('form after load:', JSON.stringify(form))
    }
  } catch (e) { console.error('loadEvent error:', e) }
}

// 月+日选择器（每年）
const months = Array.from({length: 12}, (_, i) => `${i + 1}月`)
const monthDayRange = [months, Array.from({length: 31}, (_, i) => `${i + 1}日`)]
const monthDayValue = ref([4, 19]) // 默认 5月20日
const monthDayLabel = computed(() => {
  if (!form.targetDate) return ''
  const parts = form.targetDate.split('-')
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`
})

// 日选择器（每月）
const dayRange = Array.from({length: 31}, (_, i) => `${i + 1}号`)
const dayIndex = ref([19]) // 默认 20号
const dayLabel = computed(() => {
  if (!form.targetDate) return ''
  const parts = form.targetDate.split('-')
  return `${parseInt(parts[2])}号`
})

function onMonthDayChange(e) {
  const [m, d] = e.detail.value
  monthDayValue.value = [m, d]
  const month = String(m + 1).padStart(2, '0')
  const day = String(d + 1).padStart(2, '0')
  // 用当前年份作为占位，后端只需要月日
  form.targetDate = `2000-${month}-${day}`
}

function onDayChange(e) {
  const d = e.detail.value[0]
  dayIndex.value = [d]
  const day = String(d + 1).padStart(2, '0')
  form.targetDate = `2000-01-${day}`
}

function onDateChange(e) {
  form.targetDate = e.detail.value
}

async function submit() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入事件名称', icon: 'none' })
    return
  }
  if (!form.targetDate) {
    uni.showToast({ title: '请选择目标日', icon: 'none' })
    return
  }
  try {
    if (isEdit.value) {
      await request({ url: `/api/event/${editId.value}`, method: 'PUT', data: form })
    } else {
      await request({ url: '/api/event', method: 'POST', data: form })
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1200)
  } catch (e) {}
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #FAF5F7;
  padding: 24rpx;
}

/* Type selector */
.type-selector {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}
.type-option {
  flex: 1;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx 20rpx;
  text-align: center;
  border: 3rpx solid transparent;
  box-shadow: 0 4rpx 24rpx rgba(45, 42, 46, 0.04);
  transition: all 0.2s ease;
}
.type-active {
  border-color: #E8A0B4;
  background: linear-gradient(135deg, rgba(232, 160, 180, 0.06), rgba(196, 122, 146, 0.04));
  box-shadow: 0 4rpx 20rpx rgba(232, 160, 180, 0.15);
}
.type-icon {
  display: block;
  font-size: 40rpx;
  margin-bottom: 10rpx;
}
.type-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #2D2A2E;
  margin-bottom: 6rpx;
}
.type-label-active {
  color: #C47A92;
}
.type-desc {
  display: block;
  font-size: 22rpx;
  color: #A39DA8;
}

/* Form card */
.form-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 8rpx 0;
  box-shadow: 0 4rpx 24rpx rgba(45, 42, 46, 0.04);
}

.form-group {
  padding: 28rpx 40rpx;
}
.form-label {
  display: block;
  font-size: 22rpx;
  font-weight: 500;
  color: #A39DA8;
  letter-spacing: 2rpx;
  text-transform: uppercase;
  margin-bottom: 14rpx;
}
.form-input {
  font-size: 30rpx;
  color: #2D2A2E;
  padding: 12rpx 0;
  border: none;
  width: 100%;
}
.form-textarea {
  font-size: 28rpx;
  color: #2D2A2E;
  padding: 12rpx 0;
  border: none;
  width: 100%;
  min-height: 120rpx;
  line-height: 1.6;
}
.placeholder {
  color: #D1CDD3;
  font-weight: 300;
}
.form-divider {
  height: 2rpx;
  margin: 0 40rpx;
  background: #F3ECF0;
}

/* Date picker */
.picker-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
}
.picker-value {
  font-size: 30rpx;
  color: #2D2A2E;
}
.picker-placeholder {
  font-size: 28rpx;
  color: #D1CDD3;
  font-weight: 300;
}
.picker-arrow {
  font-size: 36rpx;
  color: #D1CDD3;
  font-weight: 300;
}

/* Repeat options */
.repeat-options {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}
.repeat-option {
  flex: 1;
  height: 72rpx;
  border-radius: 16rpx;
  background: #F3ECF0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.repeat-active {
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
  box-shadow: 0 8rpx 20rpx rgba(232, 160, 180, 0.3);
}
.repeat-text {
  font-size: 26rpx;
  color: #6B6570;
  font-weight: 500;
}
.repeat-text-active {
  color: #FFFFFF;
}

/* Submit */
.submit-wrap {
  margin-top: 48rpx;
  padding: 0 16rpx;
}
.submit-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
  color: #FFFFFF;
  font-size: 30rpx;
  font-weight: 500;
  letter-spacing: 4rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 40rpx rgba(232, 160, 180, 0.3);
}
</style>
