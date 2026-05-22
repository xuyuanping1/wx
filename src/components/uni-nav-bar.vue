<template>
  <!-- 占位元素，防止 fixed 导致内容被遮挡 -->
  <view :style="{ height: navHeight + 'px' }" />
  <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="nav-bar-content">
      <view v-if="showBack" class="nav-back" @tap="goBack">
        <uni-icons type="left" size="20" color="#2D2A2E" />
      </view>
      <text class="nav-title">{{ title }}</text>
      <view class="nav-right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
})

const sys = uni.getSystemInfoSync()
const statusBarHeight = sys.statusBarHeight || 44
const navHeight = statusBarHeight + 40

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}
</script>

<style scoped>
.nav-bar {
  width: 100%;
  background: #FFFFFF;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
}
.nav-bar-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  position: relative;
}
.nav-back {
  position: absolute;
  left: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
}
.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #2D2A2E;
}
.nav-right {
  position: absolute;
  right: 12px;
  height: 44px;
  display: flex;
  align-items: center;
}
</style>
