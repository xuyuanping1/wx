<template>
  <view class="page">
    <uni-nav-bar title="新建相册" :showBack="true" />
    <scroll-view class="form-card">
      <view class="form-group">
        <text class="form-label">相册名称</text>
        <input v-model="form.name"
               placeholder="给相册起个名字"
               placeholder-class="placeholder"
               class="form-input" />
      </view>

      <view class="form-divider" />

      <view class="form-group">
        <text class="form-label">备注</text>
        <textarea v-model="form.description"
                  placeholder="写点什么..."
                  placeholder-class="placeholder"
                  class="form-textarea"
                  :maxlength="200" />
      </view>

      <view class="form-divider" />

      <view class="form-group">
        <text class="form-label">封面</text>
        <view class="cover-area" @tap="chooseCover">
          <image v-if="coverUrl" :src="coverUrl" mode="aspectFill" class="cover-preview"
                 :style="blurEnabled && blurLevel > 0 ? { filter: `blur(${blurLevel}px)` } : {}" />
          <view v-else class="cover-placeholder">
            <text class="cover-icon">+</text>
            <text class="cover-hint">选择封面</text>
          </view>
        </view>
        <text v-if="coverUrl" class="cover-tip pressable" @tap="clearCover">移除封面（将使用首张照片）</text>
        <text v-else class="cover-tip">不选择则自动使用相册第一张照片</text>
      </view>

      <view class="form-divider" v-if="coverUrl" />

      <!-- 高斯模糊 -->
      <view class="form-group" v-if="coverUrl">
        <view class="blur-toggle" @tap="blurEnabled = !blurEnabled">
          <view class="checkbox" :class="{ checked: blurEnabled }">
            <text v-if="blurEnabled" class="check-icon">✓</text>
          </view>
          <text class="blur-toggle-text">封面高斯模糊</text>
        </view>
        <view v-if="blurEnabled" class="blur-slider-wrap">
          <slider :value="blurLevel" :min="1" :max="10" :step="1"
                  activeColor="#C47A92" backgroundColor="#F3ECF0"
                  block-size="10" block-color="#C47A92"
                  @change="onBlurChange" @changing="onBlurChange" />
          <text class="blur-value">{{ blurLevel }}px</text>
        </view>
      </view>
    </scroll-view>

    <view class="submit-wrap">
      <button class="submit-btn pressable" :disabled="uploading" @tap="submit">
        {{ uploading ? '上传中...' : '创建相册' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { request, upload } from '@/utils/request'

const form = reactive({
  name: '',
  description: '',
})
const coverUrl = ref('')
const uploading = ref(false)
const blurEnabled = ref(false)
const blurLevel = ref(8)

function onBlurChange(e) {
  blurLevel.value = e.detail.value
}

function chooseCover() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      uploading.value = true
      try {
        const data = await upload('/api/photo/upload', filePath)
        coverUrl.value = data.url
      } catch (e) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uploading.value = false
      }
    },
  })
}

function clearCover() {
  coverUrl.value = ''
}

async function submit() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入相册名称', icon: 'none' })
    return
  }
  try {
    await request({
      url: '/api/album',
      method: 'POST',
      data: {
        ...form,
        coverImage: coverUrl.value || '',
        coverBlur: blurEnabled.value ? blurLevel.value : 0,
      },
    })
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1200)
  } catch (e) {}
}
</script>

<style scoped>
.page {
  background: #FAF5F7;
  padding: 20px;
  padding-bottom: 40px;
  box-sizing: border-box;
}

.form-card {
  background: #FFFFFF;
  border-radius: 20px;
  min-height: 600px !important;
  padding: 4px 0;
  overflow: scroll !important;
  box-shadow: 0 2px 16px rgba(45, 42, 46, 0.04);
}

.form-group {
  padding: 16px 24px;
}
.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #A39DA8;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.form-input {
  font-size: 16px;
  color: #2D2A2E;
  padding: 8px 0;
  border: none;
  width: 100%;
}
.form-textarea {
  font-size: 15px;
  color: #2D2A2E;
  padding: 8px 0;
  border: none;
  width: 100%;
  min-height: 80px;
  line-height: 1.6;
}
.placeholder {
  color: #D1CDD3;
  font-weight: 300;
}
.form-divider {
  height: 1px;
  margin: 0 24px;
  background: #F3ECF0;
}

/* Cover */
.cover-area {
  width: 160px;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
  background: #F8F5F8;
}
.cover-preview {
  width: 100%;
  height: 100%;
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.cover-icon {
  font-size: 32px;
  color: #C47A92;
  font-weight: 300;
}
.cover-hint {
  font-size: 12px;
  color: #A39DA8;
}
.cover-tip {
  display: block;
  font-size: 12px;
  color: #A39DA8;
  margin-top: 8px;
}

/* Blur toggle */
.blur-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
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
.blur-toggle-text {
  font-size: 14px;
  color: #2D2A2E;
}
.blur-slider-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.blur-slider-wrap slider {
  flex: 1;
}
.blur-value {
  font-size: 13px;
  color: #A39DA8;
  min-width: 36px;
  text-align: right;
}

.submit-wrap {
  margin-top: 32px;
  padding: 0 8px;
}
.submit-btn {
  width: 100%;
  height: 52px;
  border-radius: 28px;
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(232, 160, 180, 0.25);
}
.submit-btn[disabled] {
  opacity: 0.6;
}
</style>
