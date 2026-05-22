<template>
  <scroll-view class="page" scroll-y :style="{ height: pageH + 'px' }">
    <uni-nav-bar title="编辑相册" :showBack="true" />
    <!-- 相册信息表单 -->
    <view class="form-card">
      <view class="form-group">
        <text class="form-label">相册名称</text>
        <input v-model="form.name" placeholder="给相册起个名字" placeholder-class="ph" class="form-input" />
      </view>
      <view class="form-divider" />
      <view class="form-group">
        <text class="form-label">备注</text>
        <textarea v-model="form.description" placeholder="写点什么..." placeholder-class="ph" class="form-textarea" :maxlength="200" />
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
        <view v-if="coverUrl" class="remove-cover-btn pressable" @tap="clearCover">
          <text class="remove-cover-text">移除封面</text>
        </view>
        <text v-else class="cover-tip">不选择则自动使用相册第一张照片</text>
      </view>
      <view class="form-divider" v-if="coverUrl" />
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
    </view>

    <!-- 照片管理 -->
    <view class="section-header">
      <text class="section-title">照片管理</text>
      <text class="section-count">{{ photos.length }} 张</text>
    </view>

    <view v-if="photos.length > 0" class="photo-manage-grid">
      <view v-for="(photo, index) in photos" :key="photo.id" class="photo-manage-cell">
        <image :src="photo._src || photo.thumbnailUrl || photo.url" mode="aspectFill" class="photo-manage-img"
               @error="onImgError(photo)" />
        <!-- 删除按钮 -->
        <view class="photo-delete-btn" @tap.stop="deletePhoto(photo, index)">
          <uni-icons type="closeempty" size="14" color="#FFFFFF" />
        </view>
        <!-- 排序按钮 -->
        <view class="photo-sort-btns">
          <view v-if="index > 0" class="sort-btn" @tap.stop="movePhoto(index, -1)">
            <uni-icons type="left" size="12" color="#FFFFFF" />
          </view>
          <view v-if="index < photos.length - 1" class="sort-btn sort-btn-right" @tap.stop="movePhoto(index, 1)">
            <uni-icons type="right" size="12" color="#FFFFFF" />
          </view>
        </view>
      </view>
    </view>
    <view v-else class="empty-photos">
      <text class="empty-text">暂无照片</text>
    </view>

    <view class="add-photo-btn pressable" @tap="addPhoto">
      <text class="add-photo-text">+ 添加照片</text>
    </view>

    <!-- 保存按钮 -->
    <view class="submit-wrap">
      <button class="submit-btn pressable" :disabled="saving" @tap="save">
        {{ saving ? '保存中...' : '保存修改' }}
      </button>
    </view>
  </scroll-view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request, upload } from '@/utils/request'

const pageH = ref(600)
const form = reactive({ name: '', description: '' })
const coverUrl = ref('')
const blurEnabled = ref(false)
const blurLevel = ref(0)
const photos = ref([])
const saving = ref(false)
let albumId = null
let loaded = false

pageH.value = uni.getSystemInfoSync().windowHeight

onShow(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const id = page.$page?.options?.id || page.options?.id
  if (id && !loaded) {
    albumId = id
    loaded = true
    loadAlbum()
    loadPhotos()
  }
})

async function loadAlbum() {
  try {
    const list = await request({ url: '/api/album/list' })
    const album = list.find(a => a.id == albumId)
    if (album) {
      form.name = album.name || ''
      form.description = album.description || ''
      coverUrl.value = album.coverImage || ''
      if (album.coverBlur && album.coverBlur > 0) {
        blurEnabled.value = true
        blurLevel.value = album.coverBlur
      }
    }
  } catch (e) {}
}

async function loadPhotos() {
  try {
    photos.value = await request({ url: `/api/album/${albumId}/photos` })
  } catch (e) {
    photos.value = []
  }
}

function onImgError(photo) {
  photo._src = photo.url
}

function onBlurChange(e) {
  blurLevel.value = e.detail.value
}

function chooseCover() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      saving.value = true
      try {
        const data = await upload('/api/photo/upload', res.tempFilePaths[0])
        coverUrl.value = data.url
      } catch (e) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        saving.value = false
      }
    },
  })
}

function clearCover() {
  coverUrl.value = ''
  blurEnabled.value = false
}

function deletePhoto(photo, index) {
  uni.showModal({
    title: '删除照片',
    content: '确定要删除这张照片吗？',
    confirmColor: '#D4524A',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await request({ url: `/api/photo/${photo.id}`, method: 'DELETE' })
        photos.value.splice(index, 1)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
  })
}

function movePhoto(index, direction) {
  const newIndex = index + direction
  const arr = [...photos.value]
  const temp = arr[index]
  arr[index] = arr[newIndex]
  arr[newIndex] = temp
  photos.value = arr
}

async function addPhoto() {
  uni.chooseImage({
    count: 9,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      for (const path of res.tempFilePaths) {
        try {
          await upload('/api/photo/upload', path, { albumId })
        } catch (e) {}
      }
      uni.hideLoading()
      loadPhotos()
      uni.showToast({ title: '上传完成', icon: 'success' })
    },
  })
}

async function save() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入相册名称', icon: 'none' })
    return
  }
  saving.value = true
  try {
    // 更新相册信息
    await request({
      url: `/api/album/${albumId}`,
      method: 'PUT',
      data: {
        name: form.name,
        description: form.description,
        coverImage: coverUrl.value || '',
        coverBlur: blurEnabled.value ? blurLevel.value : 0,
      },
    })
    // 更新照片排序
    if (photos.value.length > 0) {
      const orders = photos.value.map((p, i) => ({ id: p.id, sortOrder: i }))
      await request({
        url: '/api/photo/reorder',
        method: 'PUT',
        data: orders,
      })
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1200)
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page {
  background: #FAF5F7;
  padding: 16px;
  padding-bottom: 40px;
  box-sizing: border-box;
}

/* Form */
.form-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 4px 0;
  box-shadow: 0 2px 16px rgba(45, 42, 46, 0.04);
}
.form-group { padding: 16px 24px; }
.form-label {
  display: block; font-size: 12px; font-weight: 500;
  color: #A39DA8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;
}
.form-input {
  font-size: 16px; color: #2D2A2E; padding: 8px 0; border: none; width: 100%;
}
.form-textarea {
  font-size: 15px; color: #2D2A2E; padding: 8px 0; border: none;
  width: 100%; min-height: 60px; line-height: 1.6;
}
.ph { color: #D1CDD3; font-weight: 300; }
.form-divider { height: 1px; margin: 0 24px; background: #F3ECF0; }

/* Cover */
.cover-area {
  width: 120px; height: 120px; border-radius: 12px;
  overflow: hidden; background: #F8F5F8;
}
.cover-preview { width: 100%; height: 100%; }
.cover-placeholder {
  width: 100%; height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 6px;
}
.cover-icon { font-size: 28px; color: #C47A92; font-weight: 300; }
.cover-hint { font-size: 11px; color: #A39DA8; }
.cover-tip { display: block; font-size: 12px; color: #A39DA8; margin-top: 8px; }
.remove-cover-btn {
  display: inline-block;
  margin-top: 10px;
  padding: 6px 16px;
  border-radius: 16px;
  background: rgba(212, 82, 74, 0.08);
}
.remove-cover-text {
  font-size: 13px;
  color: #D4524A;
  font-weight: 500;
}

/* Blur */
.blur-toggle {
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
}
.checkbox {
  width: 18px; height: 18px; border-radius: 4px;
  border: 2px solid #D1CDD3; display: flex;
  align-items: center; justify-content: center;
}
.checkbox.checked { background: #C47A92; border-color: #C47A92; }
.check-icon { font-size: 12px; color: #FFFFFF; font-weight: 700; }
.blur-toggle-text { font-size: 14px; color: #2D2A2E; }
.blur-slider-wrap { display: flex; align-items: center; gap: 12px; }
.blur-slider-wrap slider { flex: 1; }
.blur-value { font-size: 13px; color: #A39DA8; min-width: 36px; text-align: right; }

/* Section header */
.section-header {
  display: flex; justify-content: space-between; align-items: baseline;
  margin: 24px 0 12px;
}
.section-title { font-size: 16px; font-weight: 600; color: #2D2A2E; }
.section-count { font-size: 12px; color: #A39DA8; }

/* Photo manage grid */
.photo-manage-grid {
  display: flex; flex-wrap: wrap; gap: 3px; padding: 0 3px;
}
.photo-manage-cell {
  position: relative;
  width: calc(33.333% - 2px); aspect-ratio: 1;
}
.photo-manage-img { width: 100%; height: 100%; display: block; }

.photo-delete-btn {
  position: absolute; top: 2px; right: 2px;
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex; align-items: center; justify-content: center;
}
.photo-delete-icon { font-size: 16px; color: #FFFFFF; font-weight: 300; line-height: 1; }

.photo-sort-btns {
  position: absolute; bottom: 2px; left: 2px; right: 2px;
  display: flex;
}
.sort-btn {
  width: 22px; height: 22px; border-radius: 4px;
  background: rgba(0, 0, 0, 0.45);
  display: flex; align-items: center; justify-content: center;
}
.sort-btn-right {
  margin-left: auto;
}
.sort-icon { font-size: 10px; color: #FFFFFF; }

.empty-photos { text-align: center; padding: 24px 0; }
.empty-text { font-size: 14px; color: #A39DA8; }

/* Add photo */
.add-photo-btn {
  margin-top: 12px; padding: 14px 0; text-align: center;
  background: #FFFFFF; border-radius: 16px;
  box-shadow: 0 2px 12px rgba(45, 42, 46, 0.04);
}
.add-photo-text { font-size: 15px; color: #C47A92; font-weight: 500; }

/* Submit */
.submit-wrap { margin-top: 24px; padding: 0 4px; }
.submit-btn {
  width: 100%; height: 50px; border-radius: 28px;
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
  color: #FFFFFF; font-size: 16px; font-weight: 500;
  letter-spacing: 2px; border: none;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(232, 160, 180, 0.25);
}
.submit-btn[disabled] { opacity: 0.6; }
</style>
