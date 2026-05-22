// H5 模式走 vite proxy，不需要前缀；小程序需要完整地址
const BASE_URL = 'https://couple-api.xijiangjing.asia'
const isH5 = process.env.UNI_PLATFORM === 'h5'
const getBaseUrl = () => isH5 ? '' : BASE_URL

export function request(options) {
  return new Promise((resolve, reject) => {
    const userId = uni.getStorageSync('userId')

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
          uni.reLaunch({ url: '/pages/login/index' })
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
