<template>
  <view v-if="showDialog" class="dialog-mask">
    <view class="dialog-card">
      <uni-icons type="calendar" size="40" color="#C47A92" />
      <text class="dialog-title">设置在一起的日期</text>

      <!-- 滚轮日期选择器 -->
      <DatePicker v-model="dateStr" />

      <view class="dialog-actions">
        <view class="dialog-btn skip" @tap="onSkip">
          <text class="btn-text skip-text">暂不设置</text>
        </view>
        <view class="dialog-btn confirm" @tap="onSave">
          <text class="btn-text confirm-text">确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { request } from '@/utils/request'
// #ifdef H5
import { bindNativeClick } from '@/utils/bindClick'
// #endif
import DatePicker from '@/components/DatePicker.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  force: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'saved'])

const showDialog = ref(false)
let shownAt = 0

const today = new Date()
const dateStr = ref('')

watch(() => props.visible, (val) => {
  if (val) {
    if (props.force || !isDismissed()) {
      showDialog.value = true
      shownAt = Date.now()
      uni.hideTabBar()
      // #ifdef H5
      lockScroll()
      setTimeout(() => {
        const mask = document.querySelector('.dialog-mask')
        if (mask && !mask._nclick) {
          mask._nclick = true
          mask.addEventListener('click', (e) => {
            if (e.target === mask) onSkip()
          })
        }
      }, 50)
      bindNativeClick('.dialog-btn.skip', () => onSkip())
      bindNativeClick('.dialog-btn.confirm', () => onSave())
      // #endif
    }
  }
})

// #ifdef H5
function lockScroll() {
  const page = document.querySelector('.page')
  if (page) page.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
}
function unlockScroll() {
  const page = document.querySelector('.page')
  if (page) page.style.overflow = 'auto'
  document.body.style.overflow = ''
}
// #endif

function isDismissed() {
  return uni.getStorageSync('anniversary_prompt_dismissed') === 'true'
}

function dismiss() {
  uni.setStorageSync('anniversary_prompt_dismissed', 'true')
  showDialog.value = false
  uni.showTabBar()
  // #ifdef H5
  unlockScroll()
  // #endif
  emit('update:visible', false)
}

function onSkip() {
  dismiss()
}

async function onSave() {
  const ds = dateStr.value
  if (ds > today.toISOString().split('T')[0]) {
    uni.showToast({ title: '不能选择未来日期', icon: 'none' })
    return
  }
  try {
    await request({
      url: '/api/user/start-date',
      method: 'PUT',
      data: { startDate: ds },
    })
    dismiss()
    uni.showToast({ title: '设置成功', icon: 'success' })
    emit('saved', ds)
  } catch (e) {
    uni.showToast({ title: '设置失败', icon: 'none' })
  }
}
</script>

<style scoped>
.dialog-mask {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3000 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-card {
  width: 300px;
  background: #FFFFFF;
  border-radius: 24px;
  padding: 28px 24px 0;
  text-align: center;
}
.dialog-icon {
  display: block;
  font-size: 40px;
  margin-bottom: 10px;
}
.dialog-title {
  display: block;
  font-size: 17px;
  font-weight: 600;
  color: #2D2A2E;
  margin-bottom: 16px;
}

.dialog-actions {
  display: flex;
  border-top: 1px solid #F3ECF0;
}
.dialog-btn {
  flex: 1;
  padding: 14px 0;
  text-align: center;
}
.dialog-btn:first-child {
  border-right: 1px solid #F3ECF0;
}
.btn-text {
  font-size: 15px;
}
.skip-text {
  color: #6B6570;
}
.confirm-text {
  color: #C47A92;
  font-weight: 600;
}
</style>
