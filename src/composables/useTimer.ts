import { ref, watch, onUnmounted } from 'vue'

export function useTimer(startTimestamp: () => number | null | undefined, isInUse: () => boolean | undefined) {
  const elapsedTime = ref(0)
  const timerTick = ref(0)
  let timer: number | null = null

  const getElapsedSeconds = () => {
    const ts = startTimestamp()
    if (ts) return Math.max(0, Math.round((Date.now() - ts) / 1000))
    return 0
  }

  const updateElapsed = () => {
    elapsedTime.value = getElapsedSeconds()
    timerTick.value++
  }

  const initTimer = () => {
    updateElapsed()
    if (timer) clearInterval(timer)
    timer = window.setInterval(updateElapsed, 1000)
  }

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  watch(
    () => isInUse(),
    (active) => {
      if (active) initTimer()
      else {
        stopTimer()
        elapsedTime.value = 0
      }
    },
    { immediate: true },
  )

  onUnmounted(stopTimer)

  const getSessionElapsed = (session: { startTimestamp: number }) => {
    void timerTick.value // force reactivity
    return Math.max(0, Math.round((Date.now() - session.startTimestamp) / 1000))
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return { elapsedTime, timerTick, getElapsedSeconds, getSessionElapsed, formatTime, initTimer, stopTimer }
}
