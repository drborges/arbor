export default function debounce(
  func: Function,
  wait = 500,
  immediate = false
) {
  let timeout: NodeJS.Timeout

  return function debounced(...args: unknown[]) {
    const callNow = immediate && !timeout
    const later = function delayed() {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(this, args)
  }
}
