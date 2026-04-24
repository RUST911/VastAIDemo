import { ref, shallowRef, onUnmounted } from 'vue'
import { streamChatMessage, stopChatMessage } from '@/api'
import type { DifySSEEvent, WorkflowNode } from '@/types'

interface UseStreamChatOptions {
  onChunk?: (delta: string, fullText: string) => void
  onFinish?: (fullText: string, conversationId: string, messageId?: string) => void
  onError?: (error: Error) => void
  onWorkflowFailed?: (error: string, nodes: WorkflowNode[]) => void
  userId?: string | (() => string)
}

const MAX_RETRIES = 5
const RETRY_DELAY = 3000
const RENDER_INTERVAL = 16 // ~60fps

export function useStreamChat(options: UseStreamChatOptions = {}) {
  const isStreaming = ref(false)
  const streamingText = ref('')
  const conversationId = ref('')
  const lastMessageId = ref<string | undefined>(undefined)
  const error = ref<Error | null>(null)
  const abortController = shallowRef<AbortController | null>(null)
  const currentTaskId = ref<string | null>(null)

  // Workflow tracking
  const workflowNodes = ref<WorkflowNode[]>([])
  const workflowRunning = ref(false)
  const workflowError = ref<string | null>(null)

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

  // Nodes whose type ends with 'agent' — they stay 'running' until node_finished
  const AGENT_NODE_TYPES = new Set(['agent', 'llm_agent', 'tool_agent'])
  const isAgentNode = (nodeType: string) =>
    AGENT_NODE_TYPES.has(nodeType) || nodeType?.toLowerCase().endsWith('agent')

  // Minimum time (ms) a node stays in 'running' before transitioning to succeeded/failed
  const MIN_RUNNING_MS = 400

  // nodeId → timestamp when node_started was processed
  const nodeStartTimes = new Map<string, number>()

  const applyNodeFinished = (d: any) => {
    const meta = d.execution_metadata || {}
    const rawStatus = d.status
    const statusColor = rawStatus === 'failed' || rawStatus === 'error' ? '#ef4444' : '#10b981'
    console.log(
      `%c[node_finished]%c %s  status: %c${rawStatus}%c  elapsed: ${d.elapsed_time != null ? (d.elapsed_time * 1000).toFixed(0) + 'ms' : '-'}`,
      'color:#f59e0b;font-weight:bold', 'color:inherit',
      d.node_id,
      `color:${statusColor};font-weight:bold`, 'color:inherit',
      d,
    )
    const status = rawStatus === 'failed' || rawStatus === 'error' ? 'failed' : 'succeeded'
    const nodeError = d.error || undefined
    const exists = workflowNodes.value.some(n => n.nodeId === d.node_id)
    if (exists) {
      workflowNodes.value = workflowNodes.value.map(n =>
        n.nodeId === d.node_id
          ? { ...n, status, error: nodeError, elapsedTime: d.elapsed_time, totalTokens: meta.total_tokens }
          : n
      )
    } else {
      workflowNodes.value = [...workflowNodes.value, {
        nodeId: d.node_id,
        nodeType: d.node_type,
        title: d.title,
        status,
        error: nodeError,
        elapsedTime: d.elapsed_time,
        totalTokens: meta.total_tokens,
      }]
    }
    nodeStartTimes.delete(d.node_id)
  }

  const handleWorkflowEvent = (event: any) => {
    const evtName = event.event

    if (evtName === 'workflow_started') {
      console.log('%c[workflow_started]', 'color:#7c3aed;font-weight:bold', event.data)
      workflowRunning.value = true
      workflowNodes.value = []
      nodeStartTimes.clear()

    } else if (evtName === 'node_started') {
      const d = event.data || {}
      console.log(
        '%c[node_started]%c %s  type: %s  title: %s',
        'color:#3b82f6;font-weight:bold', 'color:inherit',
        d.node_id, d.node_type, d.title,
        d,
      )
      const existing = workflowNodes.value.find(n => n.nodeId === d.node_id)
      if (!existing) {
        nodeStartTimes.set(d.node_id, performance.now())
        workflowNodes.value = [...workflowNodes.value, {
          nodeId: d.node_id,
          nodeType: d.node_type,
          title: d.title,
          status: 'running',
        }]
      }

    } else if (evtName === 'agent_log') {
      console.log('%c[agent_log]', 'color:#8b5cf6;font-weight:bold', event)

    } else if (evtName === 'node_finished') {
      const d = event.data || {}
      // Ensure the node has been visible as 'running' for at least MIN_RUNNING_MS
      const startedAt = nodeStartTimes.get(d.node_id) ?? performance.now()
      const elapsed = performance.now() - startedAt
      const delay = Math.max(0, MIN_RUNNING_MS - elapsed)
      setTimeout(() => applyNodeFinished(d), delay)

    } else if (evtName === 'workflow_finished') {
      const d = event.data || {}
      console.log(
        '%c[workflow_finished]%c  status: %s  elapsed: %s',
        'color:#7c3aed;font-weight:bold', 'color:inherit',
        d.status,
        d.elapsed_time != null ? (d.elapsed_time * 1000).toFixed(0) + 'ms' : '-',
        d,
      )
      workflowRunning.value = false
      if (d.status === 'failed') {
        const wfError = d.error || '工作流执行失败'
        console.error('%c[workflow_failed]%c %s', 'color:#ef4444;font-weight:bold', 'color:inherit', wfError)
        workflowError.value = wfError
        options.onWorkflowFailed?.(wfError, workflowNodes.value)
      }
    }
  }

  const sendMessage = async (
    query: string,
    existingConversationId?: string,
    files?: DifySSEEvent[],
  ) => {
    isStreaming.value = true
    error.value = null
    streamingText.value = ''
    lastMessageId.value = undefined
    workflowNodes.value = []
    workflowRunning.value = false
    workflowError.value = null
    pendingDelta = ''
    lastRenderTime = 0
    currentTaskId.value = null

    const convId = existingConversationId || conversationId.value || undefined
    console.log(
      '%c[chat:send]%c query: "%s"  conversationId: %s  files: %d',
      'color:#6366f1;font-weight:bold', 'color:inherit',
      query.length > 80 ? query.slice(0, 80) + '…' : query,
      convId || '(new)',
      files?.length ?? 0,
    )

    let retries = 0
    const t0 = performance.now()

    const attempt = async (): Promise<void> => {
      const controller = new AbortController()
      abortController.value = controller

      try {
        const resolvedUserId = typeof options.userId === 'function' ? options.userId() : options.userId
        const stream = streamChatMessage(
          query,
          convId,
          files as any,
          controller.signal,
          resolvedUserId,
        )

        let chunkCount = 0

        for await (const event of stream) {
          if (controller.signal.aborted) return

          if (event.conversation_id && !conversationId.value) {
            conversationId.value = event.conversation_id
            console.log('%c[chat:session]%c conversationId: %s', 'color:#6366f1;font-weight:bold', 'color:inherit', event.conversation_id)
          }

          if (event.task_id && !currentTaskId.value) {
            currentTaskId.value = event.task_id
            console.log('%c[chat:session]%c taskId: %s', 'color:#6366f1;font-weight:bold', 'color:inherit', event.task_id)
          }

          // Handle workflow events
          handleWorkflowEvent(event)

          if (event.event === 'message' && event.answer) {
            chunkCount++
            throttledAppend(event.answer)
          }

          if (event.event === 'message_end') {
            flushRemaining()
            if (event.message_id) lastMessageId.value = event.message_id
            console.log(
              '%c[chat:done]%c  chunks: %d  length: %d chars  elapsed: %dms',
              'color:#10b981;font-weight:bold', 'color:inherit',
              chunkCount, streamingText.value.length, Math.round(performance.now() - t0),
              event,
            )
            options.onFinish?.(streamingText.value, conversationId.value, lastMessageId.value)
            isStreaming.value = false
            return
          }

          // Log any unhandled event types for visibility
          const knownEvents = new Set(['message', 'message_end', 'workflow_started', 'workflow_finished', 'node_started', 'node_finished', 'agent_log'])
          if (event.event && !knownEvents.has(event.event)) {
            console.log('%c[chat:event]%c %s', 'color:#9ca3af;font-weight:bold', 'color:inherit', event.event, event)
          }
        }

        flushRemaining()
        options.onFinish?.(streamingText.value, conversationId.value, lastMessageId.value)
        isStreaming.value = false
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('%c[chat:aborted]%c stream cancelled by client', 'color:#f59e0b;font-weight:bold', 'color:inherit')
          flushRemaining()
          isStreaming.value = false
          return
        }

        retries++
        console.warn(
          `%c[chat:error]%c attempt ${retries}/${MAX_RETRIES} — %s`,
          'color:#ef4444;font-weight:bold', 'color:inherit',
          err?.message ?? err,
        )
        if (retries < MAX_RETRIES) {
          console.log('%c[chat:retry]%c waiting %dms before retry…', 'color:#f59e0b;font-weight:bold', 'color:inherit', RETRY_DELAY)
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
    console.log('%c[chat:cancel]%c stream cancelled', 'color:#f59e0b;font-weight:bold', 'color:inherit')
    abortController.value?.abort()
    flushRemaining()
    isStreaming.value = false
  }

  const stopStreaming = async () => {
    const taskId = currentTaskId.value
    const resolvedUserId = typeof options.userId === 'function' ? options.userId() : options.userId
    console.log('%c[chat:stop]%c taskId: %s', 'color:#f59e0b;font-weight:bold', 'color:inherit', taskId ?? '(none)')
    // Abort local stream first for immediate UI response
    abortController.value?.abort()
    flushRemaining()
    isStreaming.value = false
    // Then notify server to stop generation
    if (taskId) {
      try {
        await stopChatMessage(taskId, resolvedUserId)
        console.log('%c[chat:stop]%c server acknowledged stop', 'color:#f59e0b;font-weight:bold', 'color:inherit')
      } catch {
        // ignore stop errors — stream is already aborted locally
      }
    }
    currentTaskId.value = null
  }

  const reset = () => {
    cancel()
    streamingText.value = ''
    conversationId.value = ''
    lastMessageId.value = undefined
    error.value = null
    pendingDelta = ''
    workflowNodes.value = []
    workflowRunning.value = false
    workflowError.value = null
    currentTaskId.value = null
    nodeStartTimes.clear()
  }

  onUnmounted(() => {
    cancel()
  })

  return {
    isStreaming,
    streamingText,
    conversationId,
    lastMessageId,
    error,
    workflowNodes,
    workflowRunning,
    workflowError,
    sendMessage,
    cancel,
    stopStreaming,
    reset,
  }
}
