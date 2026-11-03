export function isLoggedIn() {
  const uid = uni.getStorageSync('userId')
  return !!uid && uid !== 'undefined' && uid !== 'null'
}

export function getUserId() {
  return uni.getStorageSync('userId')
}

export function setLoginInfo(user) {
  uni.setStorageSync('userId', String(user.id))
  uni.setStorageSync('userInfo', JSON.stringify(user))
}

export function logout() {
  uni.removeStorageSync('userId')
  uni.removeStorageSync('userInfo')
}

export function getUserInfo() {
  const info = uni.getStorageSync('userInfo')
  return info ? JSON.parse(info) : null
}

/**
 * 拦截未登录操作，提示并引导去登录
 * @param {string} tip 提示文案
 * @returns {boolean} true 已登录，false 未登录已弹窗
 */
export function requireLogin(tip = '该功能需要登录后使用，是否前往登录？') {
  if (isLoggedIn()) return true
  uni.showModal({
    title: '温馨提示',
    content: tip,
    confirmText: '去登录',
    cancelText: '再看看',
    confirmColor: '#E8A0B4',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({ url: '/pages/login/index' })
      }
    },
  })
  return false
}
