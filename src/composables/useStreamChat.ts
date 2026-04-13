import { ref, shallowRef, onUnmounted } from 'vue'
import { streamChatMessage } from '@/api'
import type { DifySSEEvent } from '@/types'

interface UseStreamChatOptions {
  onChunk?: (delta: string, fullText: string) => void
  onFinish?: (fullText: string, conversationId: string) => void
  onError?: (error: Error) => void
}

const MAX_RETRIES = 5
const RETRY_DELAY = 3000
const RENDER_INTERVAL = 16 // ~60fps

export function useStreamChat(options: UseStreamChatOptions = {}) {
  const isStreaming = ref(false)
  const streamingText = ref('')
  const conversationId = ref('')
  const error = ref<Error | null>(null)
  const abortController = shallowRef<AbortController | null>(null)

  let renderTimer: ReturnType<typeof requestAnimationFrame> | null = null
  let pendingDelta = ''
  let lastRenderTime = 0

  const flushRender = () => {
    if (pendingDelta) {
      streamingText.value += pendingDelta
      options.onChunk?.(pendingDelta, streamingText.value)
      pendingDelta = ''
    }
    renderTimer = null
  }

  const throttledAppend = (delta: string) => {
    pendingDelta += delta
    const now = performance.now()
    if (now - lastRenderTime >= RENDER_INTERVAL) {
      lastRenderTime = now
      if (renderTimer) cancelAnimationFrame(renderTimer)
      flushRender()
    } else if (!renderTimer) {
      renderTimer = requestAnimationFrame(() => {
        lastRenderTime = performance.now()
        flushRender()
      })
    }
  }

  const flushRemaining = () => {
    if (renderTimer) cancelAnimationFrame(renderTimer)
    flushRender()
  }

  const sendMessage = async (
    query: string,
    existingConversationId?: string,
    files?: DifySSEEvent[],
  ) => {
    isStreaming.value = true
    error.value = null
    streamingText.value = ''
    pendingDelta = ''
    lastRenderTime = 0

    let retries = 0

    const attempt = async (): Promise<void> => {
      const controller = new AbortController()
      abortController.value = controller

      try {
        const stream = streamChatMessage(
          query,
          existingConversationId || conversationId.value || undefined,
          files as any,
          controller.signal,
        )

        for await (const event of stream) {
          if (controller.signal.aborted) return

          if (event.conversation_id && !conversationId.value) {
            conversationId.value = event.conversation_id
          }

          if (event.delta) {
            throttledAppend(event.delta)
          }

          if (event.answer && !event.delta) {
            throttledAppend(event.answer)
          }

          if (event.finish_reason === 'stop') {
            flushRemaining()
            options.onFinish?.(streamingText.value, conversationId.value)
            isStreaming.value = false
            return
          }
        }

        flushRemaining()
        options.onFinish?.(streamingText.value, conversationId.value)
        isStreaming.value = false
      } catch (err: any) {
        if (err.name === 'AbortError') {
          flushRemaining()
          isStreaming.value = false
          return
        }

        retries++
        if (retries < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY))
          return attempt()
        }

        flushRemaining()
        error.value = err instanceof Error ? err : new Error(String(err))
        options.onError?.(error.value)
        isStreaming.value = false
      }
    }

    await attempt()
  }

  const cancel = () => {
    abortController.value?.abort()
    flushRemaining()
    isStreaming.value = false
  }

  const reset = () => {
    cancel()
    streamingText.value = ''
    conversationId.value = ''
    error.value = null
    pendingDelta = ''
  }

  onUnmounted(() => {
    cancel()
  })

  return {
    isStreaming,
    streamingText,
    conversationId,
    error,
    sendMessage,
    cancel,
    reset,
  }
}
