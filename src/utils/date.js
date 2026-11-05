export function daysBetween(dateStr) {
  if (!dateStr) return 0
  const parts = typeof dateStr === 'string' ? dateStr.split(/[-/]/) : null
  let target
  if (parts && parts.length >= 3) {
    target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  } else {
    target = new Date(dateStr)
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24))
  // 恋爱起始日当天即为第 1 天（在一起 1 天）
  if (diffDays >= 0) {
    return diffDays + 1
  }
  return 0
}

export function daysUntil(dateStr) {
  return -daysBetween(dateStr)
}

/**
 * 获取受月份实际天数限制的安全日期（如2月无30/31号自动取最后一天）
 */
export function getClampedDate(year, month, day) {
  const maxDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, maxDay))
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
