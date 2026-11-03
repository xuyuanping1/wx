<template>
  <view class="page">
    <uni-nav-bar title="相册" />
    <view class="page-header">
      <text class="page-title">相册</text>
      <text class="page-subtitle">记录我们的每一刻</text>
    </view>

    <view v-if="albums.length > 0" class="album-list">
      <view v-for="album in albums" :key="album.id"
            class="album-card pressable"
            @tap="goDetail(album)"
            @longpress="onAlbumAction(album)">
        <view class="album-cover-wrap">
          <image v-if="album.coverImage" :src="album.coverImage" mode="aspectFill" class="album-cover"
                 :style="album.coverBlur > 0 ? { filter: `blur(${album.coverBlur}px)` } : {}" />
          <view v-else class="album-cover-empty">
            <uni-icons type="image" size="40" color="#C4BFC8" />
          </view>
        </view>
        <view class="album-info">
          <text class="album-name">{{ album.name }}</text>
          <text v-if="album.description" class="album-desc">{{ album.description }}</text>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <uni-icons type="camera-filled" size="48" color="#A39DA8" />
      <text class="empty-title">还没有相册</text>
      <text class="empty-desc">创建第一个相册，开始记录甜蜜时光</text>
    </view>

    <!-- FAB -->
    <view class="fab pressable" @tap="goCreate">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import { isLoggedIn, requireLogin } from '@/utils/auth'

const albums = ref([])

const mockAlbums = [
  { id: 'mock-1', name: '第一次约会 🌹 (示例)', description: '初见时的怦然心动', isMock: true },
  { id: 'mock-2', name: '浪漫旅行 ✈️ (示例)', description: '看遍世间美好的风景', isMock: true },
  { id: 'mock-3', name: '日常点滴 ☕️ (示例)', description: '平淡生活里的小确幸', isMock: true },
]

onShow(async () => {
  if (!isLoggedIn()) {
    albums.value = mockAlbums
    return
  }
  try {
    const list = await request({ url: '/api/album/list' })
    albums.value = list && list.length > 0 ? list : []
  } catch (e) {
    albums.value = []
  }
})

function goDetail(album) {
  if (album.isMock) {
    requireLogin('登录后即可创建和管理属于你们的专属相册，是否前往登录？')
    return
  }
  uni.navigateTo({ url: `/pages/album/detail?id=${album.id}` })
}

function onAlbumAction(album) {
  if (album.isMock) return
  if (!requireLogin()) return
  uni.showActionSheet({
    itemList: ['删除'],
    itemColor: '#D4524A',
    success: (res) => {
      if (res.tapIndex === 0) deleteAlbum(album.id)
    },
  })
}

async function deleteAlbum(id) {
  uni.showModal({
    title: '删除相册',
    content: '确定删除该相册吗？相册下的所有照片将同时删除。',
    confirmColor: '#D4524A',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await request({ url: `/api/album/${id}`, method: 'DELETE' })
        albums.value = albums.value.filter(a => a.id !== id)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (e) {}
    },
  })
}

function goCreate() {
  if (!requireLogin('登录后即可创建属于你们的专属相册，是否前往登录？')) return
  uni.navigateTo({ url: '/pages/album/create' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #FAF5F7;
  overflow-y: auto;
  padding-bottom: 40rpx;
}

.page-header {
  padding: 8px 24px 8px;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2D2A2E;
  letter-spacing: -0.5px;
}
.page-subtitle {
  display: block;
  font-size: 14px;
  color: #A39DA8;
  margin-top: 4px;
  font-weight: 300;
}

/* Album list */
.album-list {
  padding: 16px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.album-card {
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 20px rgba(45, 42, 46, 0.06);
}
.album-cover-wrap {
  position: relative;
  width: 100%;
  height: 220px;
}
.album-cover {
  width: 100%;
  height: 100%;
}
.album-cover-empty {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #F2C8D4, #E8A0B4, #C4DDF2, #9FC5E8);
  display: flex;
  align-items: center;
  justify-content: center;
}
.album-cover-icon {
  font-size: 40px;
  opacity: 0.4;
}
.album-cover-overlay {
  display: none;
}
.album-info {
  padding: 16px 20px;
}
.album-name {
  font-size: 17px;
  font-weight: 600;
  color: #2D2A2E;
}
.album-desc {
  display: block;
  font-size: 13px;
  color: #A39DA8;
  margin-top: 4px;
  font-weight: 300;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
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
  text-align: center;
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
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(232, 160, 180, 0.35);
}
.fab-icon {
  font-size: 28px;
  color: #FFFFFF;
  font-weight: 300;
  margin-top: -2px;
}
</style>
