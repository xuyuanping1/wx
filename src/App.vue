<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { isLoggedIn, setLoginInfo } from '@/utils/auth'
import { request } from '@/utils/request'

onLaunch(() => {
  // #ifdef MP-WEIXIN
  uni.login({
    provider: 'weixin',
    success: (loginRes) => {
      const code = loginRes.code
      request({
        url: '/api/user/silent-wx-login',
        method: 'POST',
        data: { code },
      }).then((user) => {
        if (user && user.id) {
          setLoginInfo(user)
          uni.switchTab({ url: '/pages/index/index' })
        }
      }).catch(() => {})
    },
    fail: () => {},
  })
  // #endif

  // #ifdef H5
  if (!isLoggedIn()) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
  // #endif
})
</script>

<style>
/* #ifdef H5 */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
/* #endif */

page {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  background-color: #FAF5F7;
  color: #2D2A2E;
  -webkit-font-smoothing: antialiased;
}

/* #ifdef H5 */
/* 去掉导航栏横线（兼容不同 DPI 机型） */
uni-page-head,
.uni-page-head,
uni-page-head::before,
.uni-page-head::after,
uni-page-head .uni-page-head__header,
.uni-page-head .uni-page-head__header::before,
.uni-page-head .uni-page-head__header::after {
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
  background-image: none !important;
  outline: none !important;
}
/* #endif */

/* #ifdef H5 */
/* tabbar 占位元素不拦截点击 */
.uni-placeholder {
  pointer-events: none !important;
}

/* 修复 H5 下 tabbar 定位到顶部的问题 */
.uni-tabbar-bottom {
  top: auto !important;
  bottom: 0 !important;
}

/* #ifdef H5 */
/* 防止 body 出现滚动条，页面自己管理滚动 */
uni-app {
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}
uni-page {
  flex: 1 !important;
  overflow: hidden !important;
}
uni-page-body {
  height: 100% !important;
  overflow: hidden !important;
}
body {
  overflow: hidden !important;
}
/* #endif */
/* #endif */

/* Glass card (WeChat doesn't support backdrop-filter, use layered overlay) */
.glass {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.glass-heavy {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* Frosted overlay for dark backgrounds */
.glass-dark {
  background: rgba(0, 0, 0, 0.25);
}

/* Subtle separator line */
.separator {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #E8E4E8 50%, transparent 100%);
}

/* Smooth press feedback */
.pressable {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.pressable:active {
  opacity: 0.85;
  transform: scale(0.98);
}

/* Tag pill */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.tag-primary {
  background: rgba(232, 160, 180, 0.15);
  color: #C47A92;
}

.tag-secondary {
  background: rgba(159, 197, 232, 0.15);
  color: #6BA3D4;
}
</style>
