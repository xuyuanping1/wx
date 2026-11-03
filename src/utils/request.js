// 微信云托管配置
const CLOUD_ENV = 'prod-d6gq4hetq0ef0087b'
const CLOUD_SERVICE = 'springboot-g0im'

// 默认公网地址（作为 H5 模式或 fallback 备用）
const BASE_URL = 'https://springboot-g0im-262052-10-1436789345.sh.run.tcloudbase.com'
const isH5 = process.env.UNI_PLATFORM === 'h5'
const getBaseUrl = () => isH5 ? '' : BASE_URL

export function request(options) {
  return new Promise((resolve, reject) => {
    const userId = uni.getStorageSync('userId')

    // #ifdef MP-WEIXIN
    // 微信小程序环境下，优先使用云托管原生免域名通道 wx.cloud.callContainer
    if (typeof wx !== 'undefined' && wx.cloud && typeof wx.cloud.callContainer === 'function') {
      wx.cloud.callContainer({
        config: {
          env: CLOUD_ENV,
        },
        path: options.url,
        method: options.method || 'GET',
        header: {
          'X-WX-SERVICE': CLOUD_SERVICE,
          'Content-Type': 'application/json',
          'X-User-Id': userId ? String(userId) : '',
          ...options.header,
        },
        data: options.data,
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.code === 200) {
            resolve(res.data.data)
          } else if (res.statusCode === 401) {
            uni.removeStorageSync('userId')
            uni.removeStorageSync('userInfo')
            if (options.needLogin) {
              uni.navigateTo({ url: '/pages/login/index' })
            }
            reject(new Error('未授权'))
          } else if (res.statusCode === 404 && res.data && res.data.code === 'INVALID_HOST') {
            console.warn('callContainer 返回 INVALID_HOST，自动降级为公网 HTTPS 请求:', res.data)
            doUniRequest(options, userId, resolve, reject)
          } else if (res.statusCode === 200 && res.data) {
            // 后端业务错误
            const msg = res.data.message || '请求失败'
            uni.showToast({ title: msg, icon: 'none' })
            reject(new Error(msg))
          } else {
            console.warn(`callContainer 返回异常 (HTTP ${res.statusCode})，尝试普通请求:`, res.data)
            doUniRequest(options, userId, resolve, reject)
          }
        },
        fail: (err) => {
          console.warn('callContainer 请求失败，尝试 fallback 普通请求:', err)
          doUniRequest(options, userId, resolve, reject)
        },
      })
      return
    }
    // #endif

    doUniRequest(options, userId, resolve, reject)
  })
}

function doUniRequest(options, userId, resolve, reject) {
  uni.request({
    url: getBaseUrl() + options.url,
    method: options.method || 'GET',
    data: options.data,
    header: {
      'Content-Type': 'application/json',
      'X-User-Id': userId || '',
      ...options.header,
    },
    success: (res) => {
      if (res.statusCode === 200 && res.data.code === 200) {
        resolve(res.data.data)
      } else if (res.statusCode === 401) {
        uni.removeStorageSync('userId')
        uni.removeStorageSync('userInfo')
        if (options.needLogin) {
          uni.navigateTo({ url: '/pages/login/index' })
        }
        reject(new Error('未授权'))
      } else {
        const msg = res.data?.message || '请求失败'
        uni.showToast({ title: msg, icon: 'none' })
        reject(new Error(msg))
      }
    },
    fail: (err) => {
      uni.showToast({ title: '网络错误', icon: 'none' })
      reject(err)
    },
  })
}

export function upload(url, filePath, formData = {}) {
  return new Promise((resolve, reject) => {
    const userId = uni.getStorageSync('userId')
    const formDataStr = Object.entries(formData)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    uni.uploadFile({
      url: getBaseUrl() + url,
      filePath,
      name: 'file',
      formData,
      header: {
        'X-User-Id': userId || '',
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data.data)
          } else {
            uni.showToast({ title: data.message || '上传失败', icon: 'none' })
            reject(new Error(data.message))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '上传失败', icon: 'none' })
        reject(err)
      },
    })
  })
}
