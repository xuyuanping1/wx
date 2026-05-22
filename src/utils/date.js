export function daysBetween(dateStr) {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.floor((today - target) / (1000 * 60 * 60 * 24))
}

export function daysUntil(dateStr) {
  return -daysBetween(dateStr)
}

export function formatDate(dateStr, format = 'YYYY.MM.DD') {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
}

export function getRepeatLabel(type) {
  const map = {
    NONE: '仅一次',
    YEARLY: '每年',
    MONTHLY: '每月',
  }
  return map[type] || type
}
