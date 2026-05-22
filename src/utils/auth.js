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
