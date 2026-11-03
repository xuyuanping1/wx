<template>
  <view class="page">
    <uni-nav-bar title="相册详情" :showBack="true" />
    <!-- Album header -->
    <view class="album-header">
      <view class="album-name-row">
        <text class="album-name">{{ album.name }}</text>
        <uni-icons type="compose" size="20" color="#A39DA8" @tap="goEdit" />
      </view>
      <text v-if="album.description" class="album-desc">{{ album.description }}</text>
      <text class="album-count">{{ photos.length }} 张照片</text>
    </view>

    <!-- Photo grid -->
    <view v-if="photos.length > 0" class="photo-grid">
      <view v-for="(photo, index) in photos" :key="photo.id"
            class="photo-cell pressable"
            @tap="preview(index)" @longpress="onPhotoLongPress(photo)">
        <image :src="photo._src || photo.thumbnailUrl || photo.url" mode="aspectFill" class="photo-img"
               @error="onImgError(photo)" />
      </view>
    </view>

    <view v-else class="empty-state">
      <uni-icons type="image" size="48" color="#A39DA8" style="opacity:0.6" />
      <text class="empty-title">还没有照片</text>
      <text class="empty-desc">点击下方按钮添加回忆</text>
    </view>

    <!-- Add photo button -->
    <view class="bottom-bar">
      <button class="add-btn pressable" @tap="addPhoto">
        <text class="add-btn-icon">+</text>
        <text class="add-btn-text">添加照片</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request, upload } from '@/utils/request'
import { isLoggedIn, requireLogin } from '@/utils/auth'

const album = ref({})
const photos = ref([])
let albumId = null

onShow(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const id = page.$page?.options?.id || page.options?.id
  if (id) {
    albumId = id
    loadAlbum()
    loadPhotos()
  }
})

async function loadAlbum() {
  try {
    const list = await request({ url: '/api/album/list' })
    album.value = list.find(a => a.id == albumId) || {}
  } catch (e) {}
}

async function loadPhotos() {
  try {
    photos.value = await request({ url: `/api/album/${albumId}/photos` })
  } catch (e) {
    photos.value = []
  }
}

function preview(index) {
  uni.previewImage({
    urls: photos.value.map(p => p.url),
    current: photos.value[index].url,
  })
}

function onPhotoLongPress(photo) {
  uni.showActionSheet({
    itemList: ['保存图片'],
    success: (res) => {
      if (res.tapIndex === 0) {
        saveImage(photo.url)
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
          success: () => {
            uni.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail: (e) => {
            if (e.errMsg && e.errMsg.indexOf('deny') !== -1) {
              uni.showToast({ title: '请授权相册权限', icon: 'none' })
            } else {
              uni.showToast({ title: '保存失败', icon: 'none' })
            }
          },
        })
      }
    },
    fail: () => {
      uni.showToast({ title: '下载失败', icon: 'none' })
    },
    complete: () => {
      uni.hideLoading()
    },
  })
}

function onImgError(photo) {
  photo._src = photo.url
}

function goEdit() {
  if (!requireLogin()) return
  uni.navigateTo({ url: `/pages/album/edit?id=${albumId}` })
}

function addPhoto() {
  if (!requireLogin('登录后即可上传照片到相册，是否前往登录？')) return
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
</script>

<style scoped>
.page {
  height: 100vh;
  background: #FAF5F7;
  overflow-y: auto;
  padding-bottom: 100px;
  box-sizing: border-box;
}

/* Header */
.album-header {
  padding: 20px 24px 16px;
}
.album-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.album-name {
  font-size: 24px;
  font-weight: 700;
  color: #2D2A2E;
  letter-spacing: -0.3px;
}
.edit-icon {
  font-size: 18px;
  padding: 4px;
}
.album-desc {
  display: block;
  font-size: 14px;
  color: #A39DA8;
  margin-top: 4px;
  font-weight: 300;
}
.album-count {
  display: block;
  font-size: 12px;
  color: #D1CDD3;
  margin-top: 8px;
  font-weight: 400;
}

/* Photo grid */
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  padding: 0 3px;
}
.photo-cell {
  width: calc(33.333% - 2px);
  aspect-ratio: 1;
}
.photo-img {
  width: 100%;
  height: 100%;
  display: block;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}
.empty-title {
  font-size: 17px;
  font-weight: 500;
  color: #6B6570;
}
.empty-desc {
  font-size: 13px;
  color: #A39DA8;
  margin-top: 8px;
}

/* Bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: rgba(250, 245, 247, 0.92);
  border-top: 1px solid #F3ECF0;
}
.add-btn {
  width: 100%;
  height: 52px;
  border-radius: 28px;
  background: linear-gradient(135deg, #E8A0B4, #C47A92);
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(232, 160, 180, 0.25);
}
.add-btn-icon {
  font-size: 22px;
  font-weight: 300;
}
.add-btn-text {
  letter-spacing: 2px;
}
</style>
