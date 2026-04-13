import { ref, onUnmounted } from 'vue'

export function usePolling(
  fn: () => Promise<void>,
  intervals: number[] = [2000, 5000, 10000, 30000, 60000],
) {
  const isPolling = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let retryCount = 0
  let startTime = 0
  const MAX_DURATION = 600000

  const start = () => {
    isPolling.value = true
    startTime = Date.now()
    retryCount = 0
    poll()
  }

  const stop = () => {
    isPolling.value = false
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const poll = async () => {
    if (!isPolling.value) return
    if (Date.now() - startTime > MAX_DURATION) {
      stop()
      return
    }

    try {
      await fn()
    } catch {
      // continue polling on error
    }

    if (!isPolling.value) return
    const interval = intervals[Math.min(retryCount, intervals.length - 1)]
    retryCount++
    timer = setTimeout(poll, interval)
  }

  onUnmounted(() => stop())

  return { isPolling, start, stop }
}
