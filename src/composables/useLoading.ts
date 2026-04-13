import { ref, computed } from 'vue'

export function useLoading(initial = false) {
  const loading = ref(initial)
  const start = () => { loading.value = true }
  const stop = () => { loading.value = false }
  const toggle = () => { loading.value = !loading.value }
  const isLoading = computed(() => loading.value)

  return { loading, isLoading, start, stop, toggle }
}
