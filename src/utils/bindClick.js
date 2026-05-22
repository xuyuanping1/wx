// UniApp H5: <uni-view> 不可靠地处理 Vue @click
// 用原生 addEventListener 作为统一后备方案
export function bindNativeClick(selector, handler, elOrRoot) {
  setTimeout(() => {
    let el
    if (!selector && elOrRoot) {
      el = elOrRoot
    } else if (elOrRoot) {
      el = elOrRoot.querySelector(selector)
    } else {
      el = document.querySelector(selector)
    }
    if (el && !el._nclick) {
      el._nclick = true
      el.style.cursor = 'pointer'
      el.addEventListener('click', handler)
    }
  }, 100)
}
