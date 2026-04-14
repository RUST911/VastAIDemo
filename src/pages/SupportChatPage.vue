<template>
  <div class="chat-page">
    <AppHeader />

    <!-- Sidebar overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="closeSidebar" />

    <div class="chat-layout">
      <!-- Sidebar -->
      <aside class="sidebar" :class="{ open: sidebarOpen }">
        <div class="sidebar-top">
          <button class="new-chat-btn" @click="handleNewChat" :disabled="isStreaming">
            <i class="fa fa-plus" />
            <span>开启新对话</span>
          </button>
        </div>

        <div class="conv-list">
          <div v-if="loadingConversations" class="conv-loading">
            <i class="fa fa-spinner fa-spin" />
            <span>加载中...</span>
          </div>
          <div v-else-if="conversations.length === 0" class="conv-empty">
            <div class="conv-empty-icon">
              <i class="fa fa-comments" />
            </div>
            <p>暂无对话记录</p>
            <span>点击上方按钮开启新对话</span>
          </div>
          <template v-else>
            <div
              v-for="conv in conversations"
              :key="conv.id"
              class="conv-item"
              :class="{ active: chatStore.currentConversationId === conv.id }"
              @click="handleSwitchConversation(conv.id)"
            >
              <div class="conv-dot" />
              <div class="conv-meta">
                <div class="conv-title">{{ conv.title || '未命名对话' }}</div>
                <div class="conv-time">{{ formatConvTime(conv.updatedAt || conv.createdAt) }}</div>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <!-- Main chat area -->
      <div class="chat-main">
        <!-- Chat header -->
        <header class="chat-header">
          <div class="chat-header-left">
            <button class="icon-btn sidebar-toggle" @click="toggleSidebar" title="对话列表">
              <i class="fa fa-bars" />
            </button>
            <div class="agent-info">
              <div class="agent-avatar">
                <img src="/avatar.png" alt="量仔" />
                <span class="agent-status-dot" :class="statusDotClass" />
              </div>
              <div class="agent-meta">
                <span class="agent-name">量仔 · vastbase 智能助手</span>
                <span class="agent-status" :class="statusColor">{{ statusText }}</span>
              </div>
            </div>
          </div>
          <div class="chat-header-right">
            <button 
              class="export-btn" 
              @click="exportConversation" 
              :disabled="chatStore.messages.length === 0"
              title="导出对话报告"
            >
              <i class="fa fa-download" />
              <span>导出报告</span>
            </button>
            <router-link to="/" class="back-home-btn">
              <i class="fa fa-home" />
              <span>返回首页</span>
            </router-link>
          </div>
        </header>

        <!-- Messages -->
        <div ref="messagesContainerRef" class="messages-area">
          <!-- Welcome screen -->
          <div v-if="chatStore.messages.length === 0 && !isStreaming" class="welcome-screen">
            <div class="welcome-avatar">
              <img src="/avatar.png" alt="量仔" />
            </div>
            <h2 class="welcome-title">你好，我是量仔</h2>
            <p class="welcome-desc">vastbase 智能助手，随时为您解答数据库相关问题</p>
            <div class="welcome-suggestions">
              <button
                v-for="s in suggestions"
                :key="s"
                class="suggestion-chip"
                @click="useSuggestion(s)"
              >
                <i class="fa fa-comment-o" />
                {{ s }}
              </button>
            </div>
          </div>

          <!-- Message list -->
          <template v-else>
            <div
              v-for="msg in chatStore.messages"
              :key="msg.id"
              class="message-row"
              :class="msg.role"
            >
              <!-- User message -->
              <template v-if="msg.role === 'user'">
                <div class="user-msg-wrap">
                  <div class="user-bubble" :class="{ 'ticket-bubble': msg.ticketData }">
                    <MvsTicketCard v-if="msg.ticketData" :ticket="msg.ticketData" />
                    <div v-else class="markdown-content" v-html="renderContent(msg.content)" />
                    <div v-if="msg.files && msg.files.length" class="msg-files">
                      <div v-for="(f, idx) in msg.files" :key="idx" class="msg-file-tag">
                        <i class="fa fa-file-o" />
                        <span>{{ f.name }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="user-avatar">
                    <img src="@/assets/images/用户.png" alt="用户" />
                  </div>
                </div>
              </template>

              <!-- Assistant message -->
              <template v-else>
                <div class="assistant-msg-wrap">
                  <img src="/avatar.png" alt="量仔" class="assistant-avatar" />
                  <div class="assistant-content">
                    <WorkflowPanel
                      v-if="msg.workflowNodes && msg.workflowNodes.length"
                      :nodes="msg.workflowNodes"
                      :running="false"
                      class="mb-2"
                    />
                    <div class="assistant-bubble">
                      <div v-if="msg.beforeThink" v-html="renderMarkdown(msg.beforeThink)" class="mb-2" />
                      <ThinkBlock
                        v-if="msg.thinkContent"
                        :content="msg.thinkContent"
                        :streaming="false"
                        :class="msg.content ? 'mb-2' : ''"
                      />
                      <div v-if="msg.content" class="markdown-content" v-html="renderContent(msg.content)" />
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Streaming message -->
            <div v-if="isStreaming" class="message-row assistant">
              <div class="assistant-msg-wrap">
                <img src="/avatar.png" alt="量仔" class="assistant-avatar" />
                <div class="assistant-content">
                  <WorkflowPanel
                    v-if="workflowNodes.length"
                    :nodes="workflowNodes"
                    :running="workflowRunning"
                    class="mb-2"
                  />
                  <div class="assistant-bubble">
                    <div v-if="streamingParts.before" v-html="renderMarkdown(streamingParts.before)" :class="streamingParts.think ? 'mb-2' : ''" />
                    <ThinkBlock
                      v-if="streamingParts.think"
                      :content="streamingParts.think"
                      :streaming="streamingParts.thinkOpen"
                      :class="streamingParts.after ? 'mb-2' : ''"
                    />
                    <div v-if="streamingParts.after" v-html="renderMarkdown(streamingParts.after)" />
                    <div v-if="!streamingParts.before && !streamingParts.think && !streamingParts.after" class="typing-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Input area -->
        <div class="input-area">
          <!-- File previews -->
          <div v-if="uploadedFiles.length" class="file-previews">
            <div v-for="(file, index) in uploadedFiles" :key="index" class="file-preview-tag">
              <i class="fa fa-file-text-o" />
              <span>{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <button class="file-remove" @click="removeFile(index)">
                <i class="fa fa-times" />
              </button>
            </div>
          </div>

          <!-- Attach popup -->
          <div v-if="attachPanelOpen" class="attach-panel" ref="attachPanelRef" @click.stop>
            <div class="attach-panel-inner">
              <div class="attach-url-row">
                <input
                  v-model="fileUrlInput"
                  type="text"
                  placeholder="输入文件链接"
                  class="attach-url-input"
                  @keypress.enter="handleUrlAttach"
                />
                <button class="attach-url-btn" @click="handleUrlAttach">好的</button>
              </div>
              <div class="attach-or">OR</div>
              <label class="attach-local-btn">
                <i class="fa fa-cloud-upload" />
                <span>从本地上传</span>
                <input type="file" multiple class="hidden" accept="*/*" @change="handleFileSelect" />
              </label>
            </div>
          </div>

          <div class="input-row">
            <input
              ref="inputRef"
              v-model="inputText"
              type="text"
              placeholder="和 Bot 聊天"
              class="chat-input"
              @keypress.enter.exact="handleSend"
            />
            <button ref="attachToggleRef" class="attach-toggle-btn" title="上传文件" @click.stop="toggleAttachPanel">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <button
              class="send-btn"
              :class="{ active: inputText.trim() && !isStreaming }"
              :disabled="isStreaming || !inputText.trim()"
              @click="handleSend"
            >
              <svg v-if="!isStreaming" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
              <i v-else class="fa fa-stop" />
            </button>
          </div>
          <div class="input-hint">按 Enter 发送 · 支持上传日志、截图等文件</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import AppHeader from '@/components/AppHeader.vue'
import WorkflowPanel from '@/components/WorkflowPanel.vue'
import ThinkBlock from '@/components/ThinkBlock.vue'
import MvsTicketCard from '@/components/MvsTicketCard.vue'
import { useChatStore } from '@/stores/chat'
import { useStreamChat } from '@/composables/useStreamChat'
import {
  fetchConversationMessages,
  fetchConversations,
  uploadFile,
  DEFAULT_USER_ID,
} from '@/api'
import { generateId, formatTime, exportCurrentConversation } from '@/utils'
import type { ChatMessage, Conversation, DifyFile } from '@/types'

const route = useRoute()
const chatStore = useChatStore()

// Determine userId: MVS sessions use the session_id as user, others use default
const userId = computed(() => {
  const sessionId = route.query.session_id as string
  return sessionId ? sessionId : DEFAULT_USER_ID
})

const suggestions = [
  '如何排查 vastbase 连接超时问题？',
  '迁移时遇到字符集不兼容怎么处理？',
  '数据库性能突然下降如何定位？',
  '存储过程迁移报错怎么解决？',
]

const {
  isStreaming,
  streamingText,
  conversationId: streamConversationId,
  workflowNodes,
  workflowRunning,
  sendMessage: streamSend,
  reset: streamReset,
} = useStreamChat({
  userId: userId.value,
  onFinish(fullText) {
    const parsed = parseAnswer(fullText)
    chatStore.addMessage({
      id: generateId(),
      role: 'assistant',
      content: parsed.content,
      timestamp: Date.now(),
      thinkContent: parsed.thinkContent,
      beforeThink: parsed.beforeThink,
      workflowNodes: workflowNodes.value.length ? [...workflowNodes.value] : undefined,
    })
    loadConversations()
    setStatus('在线', 'online')
  },
  onError(err) {
    chatStore.addMessage({
      id: generateId(),
      role: 'assistant',
      content: `抱歉，发生了错误：${err.message}`,
      timestamp: Date.now(),
    })
    setStatus('连接错误', 'error')
  },
})

const inputText = ref('')
const inputRef = ref<HTMLInputElement>()
const messagesContainerRef = ref<HTMLDivElement>()
const uploadedFiles = ref<File[]>([])
const conversations = ref<Conversation[]>([])
const loadingConversations = ref(false)
const sidebarOpen = ref(false)
const attachPanelOpen = ref(false)
const attachPanelRef = ref<HTMLDivElement>()
const fileUrlInput = ref('')

function toggleAttachPanel() {
  attachPanelOpen.value = !attachPanelOpen.value
  fileUrlInput.value = ''
}

function handleUrlAttach() {
  const url = fileUrlInput.value.trim()
  if (!url) return
  // Use a special File with type 'text/uri-list' to mark URL attachments
  // We store the URL in a Blob so File.name holds the URL
  const blob = new Blob([url], { type: 'text/uri-list' })
  const urlFile = new File([blob], url, { type: 'text/uri-list' })
  if (uploadedFiles.value.length < 5) {
    uploadedFiles.value.push(urlFile)
  }
  fileUrlInput.value = ''
  attachPanelOpen.value = false
}

function handleClickOutsideAttach(e: MouseEvent) {
  if (attachPanelRef.value && !attachPanelRef.value.contains(e.target as Node)) {
    attachPanelOpen.value = false
  }
}

type StatusType = 'online' | 'thinking' | 'error' | 'loading'
const statusText = ref('在线')
const statusType = ref<StatusType>('online')

const statusColor = computed(() => {
  const map: Record<StatusType, string> = {
    online: 'status-online',
    thinking: 'status-thinking',
    error: 'status-error',
    loading: 'status-thinking',
  }
  return map[statusType.value]
})

const statusDotClass = computed(() => {
  const map: Record<StatusType, string> = {
    online: 'dot-online',
    thinking: 'dot-thinking',
    error: 'dot-error',
    loading: 'dot-thinking',
  }
  return map[statusType.value]
})

function setStatus(text: string, type: StatusType) {
  statusText.value = text
  statusType.value = type
}

const streamingParts = computed(() => {
  const text = streamingText.value
  const thinkStart = text.indexOf('<think>')
  if (thinkStart === -1) {
    return { before: cleanWhitespace(text).trim(), think: '', after: '', thinkOpen: false }
  }
  const before = cleanWhitespace(text.slice(0, thinkStart)).trim()
  const thinkEnd = text.indexOf('</think>', thinkStart)
  if (thinkEnd === -1) {
    return { before, think: text.slice(thinkStart + 7), after: '', thinkOpen: true }
  }
  const think = text.slice(thinkStart + 7, thinkEnd)
  const after = cleanWhitespace(text.slice(thinkEnd + 8)).trim()
  return { before, think, after, thinkOpen: false }
})

// Polling state
const pollingTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const pollingTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const pollingStatusTimer = ref<ReturnType<typeof setInterval> | null>(null)
const pollingStartTime = ref<number | null>(null)
const pollingRetryCount = ref(0)
const pollingCurrentInterval = ref(2000)
const POLLING_MAX_DURATION = 600000
const POLLING_MAX_RETRIES = 5
const POLLING_INTERVALS = [2000, 5000, 10000, 30000, 60000]

marked.setOptions({ breaks: true, gfm: true })

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function cleanImageTags(text: string): string {
  return text
    .replace(/<img\s+[^>]*?src\s*=\s*(?:&quot;|["'])([^"'>]+?)(?:&quot;|["'])[^>]*?\/?>/gi, '[图片链接]($1)')
    .replace(/<img\s+[^>]*?src\s*=\s*([^\s>"']+)[^>]*?\/?>/gi, '[图片链接]($1)')
    .replace(/<img\s+[^>]*><\/img>/gi, '')
}

function cleanWhitespace(text: string): string {
  const codeBlockRegex = /```[\s\S]*?```/g
  const codeBlocks: string[] = []
  let cleaned = text
  let match: RegExpExecArray | null
  let idx = 0
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push(match[0])
    cleaned = cleaned.replace(match[0], `__CODE_BLOCK_${idx}__`)
    idx++
  }
  cleaned = cleaned.replace(/\t/g, ' ')
  cleaned = cleaned.replace(/^[ \t]+/gm, '')
  cleaned = cleaned.replace(/[ \t]+$/gm, '')
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  cleaned = cleaned.replace(/[ ]{2,}/g, ' ')
  cleaned = cleaned.replace(/^\s*$/gm, '')
  codeBlocks.forEach((block, i) => {
    cleaned = cleaned.replace(`__CODE_BLOCK_${i}__`, block)
  })
  return cleaned.trim()
}

function parseAnswer(raw: string): { beforeThink?: string; thinkContent?: string; content: string } {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi
  const thinkParts: string[] = []
  let match: RegExpExecArray | null
  const firstThinkIdx = raw.search(/<think>/i)
  const beforeThink = firstThinkIdx > 0 ? cleanWhitespace(raw.slice(0, firstThinkIdx)).trim() : undefined
  while ((match = thinkRegex.exec(raw)) !== null) {
    const t = match[1].trim()
    if (t) thinkParts.push(t)
  }
  let content = raw.replace(/<think>[\s\S]*?<\/think>/gi, '')
  content = content.replace(/<think&gt;[\s\S]*?<\/think&gt;/gi, '')
  content = cleanImageTags(content)
  content = cleanWhitespace(content).trim()
  return {
    beforeThink: beforeThink || undefined,
    thinkContent: thinkParts.length ? thinkParts.join('\n\n---\n\n') : undefined,
    content,
  }
}

function renderMarkdown(text: string): string {
  if (!text) return ''
  let processed = cleanWhitespace(text)
  processed = processed.replace(/～(\d{1,2}:\d{2})/g, '~$1')
  try {
    return marked.parse(processed) as string
  } catch {
    return escapeHtml(text)
  }
}

function renderContent(content: string): string {
  return renderMarkdown(content)
}

function scrollToBottom() {
  nextTick(() => {
    const el = messagesContainerRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
function closeSidebar() { sidebarOpen.value = false }

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatConvTime(ts: string | number): string {
  if (!ts) return ''
  // Dify returns Unix timestamps in seconds (number or numeric string)
  let ms: number
  const num = typeof ts === 'number' ? ts : Number(ts)
  if (!isNaN(num) && num < 1e12) {
    // seconds-based Unix timestamp
    ms = num * 1000
  } else if (!isNaN(num)) {
    // already milliseconds
    ms = num
  } else {
    ms = new Date(ts as string).getTime()
  }
  const date = new Date(ms)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  Array.from(target.files || []).forEach((file) => {
    if (uploadedFiles.value.length < 5) uploadedFiles.value.push(file)
  })
  target.value = ''
  attachPanelOpen.value = false
}

function removeFile(index: number) { uploadedFiles.value.splice(index, 1) }

function useSuggestion(text: string) {
  inputText.value = text
  nextTick(() => inputRef.value?.focus())
}

async function handleSend() {
  const query = inputText.value.trim()
  if (!query || isStreaming.value) return

  inputText.value = ''
  const currentFiles = [...uploadedFiles.value]
  uploadedFiles.value = []

  chatStore.addMessage({
    id: generateId(),
    role: 'user',
    content: cleanWhitespace(query),
    timestamp: Date.now(),
    files: currentFiles.map((f) => ({ name: f.name })),
  })

  scrollToBottom()
  setStatus('正在思考...', 'thinking')

  try {
    let difyFiles: DifyFile[] = []
    if (currentFiles.length > 0) {
      setStatus('上传文件中...', 'loading')
      for (const file of currentFiles) {
        if (file.type === 'text/uri-list') {
          // URL-based attachment
          difyFiles.push({
            type: 'document',
            transfer_method: 'remote_url',
            url: file.name,
          } as any)
        } else {
          const fileId = await uploadFile(file, userId.value)
          if (fileId) difyFiles.push({ type: 'document', transfer_method: 'local_file', upload_file_id: fileId })
        }
      }
      setStatus('正在思考...', 'thinking')
    }

    await streamSend(
      cleanWhitespace(query),
      chatStore.currentConversationId || undefined,
      difyFiles.length > 0 ? (difyFiles as any) : undefined,
    )

    if (streamConversationId.value && !chatStore.currentConversationId) {
      chatStore.setConversationId(streamConversationId.value)
    }
  } catch (err: any) {
    chatStore.addMessage({
      id: generateId(),
      role: 'assistant',
      content: `抱歉，发生了错误：${err.message}`,
      timestamp: Date.now(),
    })
    setStatus('连接错误', 'error')
  }
}

function handleNewChat() {
  if (isStreaming.value) return
  stopMessagePolling()
  streamReset()
  chatStore.reset()
  closeSidebar()
  setStatus('在线', 'online')
  nextTick(() => inputRef.value?.focus())
}

function exportConversation() {
  const currentConv = conversations.value.find(
    conv => conv.id === chatStore.currentConversationId
  )
  exportCurrentConversation(chatStore.messages, currentConv)
}

async function loadConversations() {
  loadingConversations.value = true
  try {
    const data = await fetchConversations(userId.value)
    conversations.value = (data as any[]).map((c: any) => ({
      id: c.id,
      title: c.name || c.intro || '未命名对话',
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    })) as Conversation[]
  } catch {
    conversations.value = []
  } finally {
    loadingConversations.value = false
  }
}

async function handleSwitchConversation(convId: string) {
  if (isStreaming.value) return
  stopMessagePolling()
  chatStore.reset()
  chatStore.setConversationId(convId)
  streamReset()
  streamConversationId.value = convId
  closeSidebar()

  try {
    setStatus('加载中...', 'loading')
    const data = await fetchConversationMessages(convId, userId.value)
    const msgs = (data as any[]).reverse()
    let assistantCount = 0
    let userCount = 0

    msgs.forEach((msg: any) => {
      if (msg.query) {
        chatStore.addMessage({ id: generateId(), role: 'user', content: cleanWhitespace(msg.query), timestamp: Date.now() })
        userCount++
      }
      if (msg.answer && msg.answer.trim()) {
        const parsed = parseAnswer(msg.answer)
        chatStore.addMessage({ id: generateId(), role: 'assistant', content: parsed.content, timestamp: Date.now(), thinkContent: parsed.thinkContent, beforeThink: parsed.beforeThink })
        assistantCount++
      }
    })

    const isFromRedirect = route.query.conversation_id
    if (isFromRedirect && userCount > 0 && assistantCount === 0) {
      startMessagePolling(convId, 0)
    } else if (isFromRedirect && userCount > assistantCount) {
      startMessagePolling(convId, assistantCount)
    } else {
      setStatus('在线', 'online')
    }
    scrollToBottom()
  } catch {
    setStatus('连接错误', 'error')
  }
}

function stopMessagePolling() {
  if (pollingTimer.value) { clearTimeout(pollingTimer.value); pollingTimer.value = null }
  if (pollingTimeout.value) { clearTimeout(pollingTimeout.value); pollingTimeout.value = null }
  if (pollingStatusTimer.value) { clearInterval(pollingStatusTimer.value); pollingStatusTimer.value = null }
  pollingStartTime.value = null
  pollingRetryCount.value = 0
  pollingCurrentInterval.value = 2000
}

async function checkForNewMessages(convId: string, lastCount: number): Promise<boolean> {
  try {
    const data = await fetchConversationMessages(convId, userId.value)
    const msgs = (data as any[]).reverse()
    const allAssistant = msgs.filter((m: any) => m.answer && m.answer.trim())
    const newMessages = allAssistant.slice(lastCount)
    if (newMessages.length > 0) {
      stopMessagePolling()
      newMessages.forEach((msg: any) => {
        const parsed = parseAnswer(msg.answer)
        chatStore.addMessage({ id: generateId(), role: 'assistant', content: parsed.content, timestamp: Date.now(), thinkContent: parsed.thinkContent, beforeThink: parsed.beforeThink })
      })
      scrollToBottom()
      setStatus('在线', 'online')
      return true
    }
    pollingRetryCount.value = 0
    return false
  } catch {
    pollingRetryCount.value++
    if (pollingRetryCount.value >= POLLING_MAX_RETRIES) {
      stopMessagePolling()
      setStatus('轮询失败，请刷新重试', 'error')
      return false
    }
    pollingCurrentInterval.value = POLLING_INTERVALS[Math.min(pollingRetryCount.value, POLLING_INTERVALS.length - 1)]
    return false
  }
}

async function fetchTicketAndStream(sessionId: string) {
  try {
    const res = await fetch(`/api/mvs/ticket/${sessionId}`)
    if (!res.ok) {
      setStatus('工单不存在或已过期', 'error')
      return
    }
    const data = await res.json()
    if (!data.success || !data.query) {
      setStatus('工单内容为空', 'error')
      return
    }

    // 展示用户消息
    chatStore.addMessage({
      id: generateId(),
      role: 'user',
      content: data.query,
      timestamp: Date.now(),
      ticketData: data.ticketData || null,
    })
    scrollToBottom()
    setStatus('正在思考...', 'thinking')

    // 直接发起流式请求
    await streamSend(data.query, undefined, undefined)

    if (streamConversationId.value && !chatStore.currentConversationId) {
      chatStore.setConversationId(streamConversationId.value)
    }
    await loadConversations()
  } catch (err: any) {
    chatStore.addMessage({
      id: generateId(),
      role: 'assistant',
      content: `抱歉，发生了错误：${err.message}`,
      timestamp: Date.now(),
    })
    setStatus('连接错误', 'error')
  }
}

function startMessagePolling(convId: string, lastCount: number) {
  stopMessagePolling()
  pollingStartTime.value = Date.now()
  pollingRetryCount.value = 0
  pollingCurrentInterval.value = POLLING_INTERVALS[0]

  pollingTimeout.value = setTimeout(() => {
    stopMessagePolling()
    setStatus('AI思考超时，请重新发送', 'error')
  }, POLLING_MAX_DURATION)

  updatePollingStatus()
  pollingStatusTimer.value = setInterval(updatePollingStatus, 1000)

  const poll = async () => {
    const hasNew = await checkForNewMessages(convId, lastCount)
    if (hasNew) { stopMessagePolling(); return }
    pollingTimer.value = setTimeout(poll, pollingCurrentInterval.value)
  }
  poll()
}

function updatePollingStatus() {
  if (!pollingStartTime.value) return
  const elapsed = Date.now() - pollingStartTime.value
  const remaining = Math.max(0, POLLING_MAX_DURATION - elapsed)
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  statusText.value = `等待回复... (${minutes}:${seconds.toString().padStart(2, '0')})`
  statusType.value = 'thinking'
}

watch(() => chatStore.messages.length, () => scrollToBottom())
watch(streamingText, () => scrollToBottom())

onMounted(async () => {
  document.addEventListener('click', handleClickOutsideAttach)
  const convIdFromUrl = route.query.conversation_id as string
  const sessionIdFromUrl = route.query.session_id as string

  if (sessionIdFromUrl) {
    // MVS 工单场景：拉取工单内容，直接在前端发起流式请求
    setStatus('加载工单中...', 'loading')
    await loadConversations()
    await fetchTicketAndStream(sessionIdFromUrl)
  } else if (convIdFromUrl) {
    chatStore.setConversationId(convIdFromUrl)
    streamConversationId.value = convIdFromUrl
    await handleSwitchConversation(convIdFromUrl)
    await loadConversations()
  } else {
    await loadConversations()
    setStatus('在线', 'online')
  }
  nextTick(() => inputRef.value?.focus())
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideAttach)
})
</script>

<style scoped>
/* ─── Layout ─────────────────────────────────────────────────── */
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #F7F8FC;
}

.chat-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.user-bubble.ticket-bubble {
  background: transparent;
  border: none;
  padding: 0;
  max-width: 700px;
  box-shadow: none;
}
.sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.sidebar-top {
  padding: 14px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.new-chat-btn {
  width: 100%;
  padding: 11px 16px;
  background: linear-gradient(135deg, #165DFF, #4080FF);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.25);
}

.new-chat-btn:hover:not(:disabled) {
  filter: brightness(1.08);
  box-shadow: 0 6px 18px rgba(22, 93, 255, 0.35);
}

.new-chat-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.conv-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #86909C;
  font-size: 13px;
}

.conv-empty {
  text-align: center;
  padding: 40px 16px;
  color: #86909C;
}

.conv-empty-icon {
  width: 52px;
  height: 52px;
  background: #F2F3F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 22px;
  color: #C9CDD4;
}

.conv-empty p {
  font-size: 14px;
  font-weight: 500;
  color: #4E5969;
  margin: 0 0 4px;
}

.conv-empty span {
  font-size: 12px;
  color: #86909C;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 2px;
  transition: all 0.15s;
}

.conv-item:hover { background: #F7F8FC; }

.conv-item.active {
  background: rgba(22, 93, 255, 0.08);
}

.conv-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #C9CDD4;
  flex-shrink: 0;
  transition: background 0.15s;
}

.conv-item.active .conv-dot { background: #165DFF; }

.conv-meta { flex: 1; min-width: 0; }

.conv-title {
  font-size: 13px;
  font-weight: 500;
  color: #1D2129;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-item.active .conv-title { color: #165DFF; }

.conv-time {
  font-size: 11px;
  color: #86909C;
  margin-top: 2px;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 99;
  backdrop-filter: blur(2px);
}

/* ─── Chat Main ──────────────────────────────────────────────── */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: white;
}

/* ─── Chat Header ────────────────────────────────────────────── */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  background: white;
  flex-shrink: 0;
  gap: 12px;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #4E5969;
  font-size: 15px;
  transition: all 0.15s;
  text-decoration: none;
  flex-shrink: 0;
}

.icon-btn:hover { background: #F2F3F5; color: #165DFF; }

.sidebar-toggle { display: none; }

.agent-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.agent-avatar {
  position: relative;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
}

.agent-avatar img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(22, 93, 255, 0.15);
}

.agent-status-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid white;
}

.dot-online { background: #00B42A; }
.dot-thinking { background: #165DFF; animation: pulse-dot 1.2s infinite; }
.dot-error { background: #F53F3F; }

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.agent-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.agent-name {
  font-size: 14px;
  font-weight: 700;
  color: #1D2129;
  line-height: 1;
}

.agent-status {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

.status-online { color: #00B42A; }
.status-thinking { color: #165DFF; }
.status-error { color: #F53F3F; }

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #165DFF;
  background: #F2F3F5;
  border: 1px solid #E5E6EB;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  text-decoration: none;
  border: none;
  font-family: inherit;
  font-size: 13px;
}

.export-btn:hover {
  background: #E5E6EB;
  color: #165DFF;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-btn:disabled:hover {
  background: #F2F3F5;
  color: #4E5969;
}

.back-home-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #4E5969;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.back-home-btn:hover { background: #F2F3F5; color: #165DFF; }

/* ─── Messages ───────────────────────────────────────────────── */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Welcome screen */
.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.welcome-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(22, 93, 255, 0.15);
  box-shadow: 0 8px 24px rgba(22, 93, 255, 0.15);
  margin-bottom: 16px;
}

.welcome-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.welcome-title {
  font-size: 22px;
  font-weight: 800;
  color: #1D2129;
  margin: 0 0 8px;
}

.welcome-desc {
  font-size: 14px;
  color: #86909C;
  margin: 0 0 28px;
  line-height: 1.6;
}

.welcome-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 560px;
}

.suggestion-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #F7F8FC;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 100px;
  font-size: 13px;
  color: #4E5969;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.suggestion-chip:hover {
  background: rgba(22, 93, 255, 0.06);
  border-color: rgba(22, 93, 255, 0.2);
  color: #165DFF;
}

.suggestion-chip i { font-size: 11px; opacity: 0.6; }

/* Message rows */
.message-row {
  display: flex;
  animation: msg-in 0.25s ease;
}

@keyframes msg-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* User */
.user-msg-wrap {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-left: auto;
  max-width: 75%;
}

.user-bubble {
  background: #E8F0FE;
  color: #1D2129;
  padding: 10px 14px;
  border-radius: 18px 18px 4px 18px;
  font-size: 13px;
  line-height: 1.6;
  box-shadow: none;
  word-break: break-word;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(22, 93, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #165DFF;
  font-size: 13px;
  flex-shrink: 0;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Assistant */
.assistant-msg-wrap {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 85%;
}

.assistant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1.5px solid rgba(22, 93, 255, 0.12);
  margin-top: 2px;
}

.assistant-content {
  flex: 1;
  min-width: 0;
}

.assistant-bubble {
  background: #F7F8FC;
  border: 1px solid rgba(0,0,0,0.06);
  padding: 12px 16px;
  border-radius: 4px 18px 18px 18px;
  font-size: 14px;
  line-height: 1.6;
  color: #1D2129;
  word-break: break-word;
}

/* File attachments */
.msg-files {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.msg-file-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: rgba(255,255,255,0.2);
  border-radius: 6px;
  font-size: 12px;
}

/* Typing dots */
.typing-dots {
  display: inline-flex;
  gap: 5px;
  padding: 4px 2px;
}

.typing-dots span {
  width: 7px;
  height: 7px;
  background: #165DFF;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
  opacity: 0.7;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Markdown content */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  font-weight: 700;
  margin: 1rem 0 0.5rem;
  color: #1D2129;
}
.markdown-content :deep(h1) { font-size: 1.4rem; }
.markdown-content :deep(h2) { font-size: 1.2rem; }
.markdown-content :deep(h3) { font-size: 1.05rem; }
.markdown-content :deep(p) { margin: 0.5rem 0; }
.markdown-content :deep(ul),
.markdown-content :deep(ol) { margin: 0.5rem 0; padding-left: 1.5rem; }
.markdown-content :deep(li) { margin: 0.25rem 0; }
.markdown-content :deep(code) {
  background: rgba(22, 93, 255, 0.07);
  color: #165DFF;
  padding: 2px 6px;
  border-radius: 5px;
  font-size: 0.85em;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.markdown-content :deep(pre) {
  background: #1a1d2e;
  color: #e2e8f0;
  padding: 14px 16px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 0.75rem 0;
  border: 1px solid rgba(255,255,255,0.06);
}
.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.85em;
}
.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0;
  font-size: 13px;
}
.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #E5E6EB;
  padding: 8px 12px;
  text-align: left;
}
.markdown-content :deep(th) {
  background: #F7F8FC;
  font-weight: 600;
  color: #4E5969;
}
.markdown-content :deep(blockquote) {
  border-left: 3px solid #165DFF;
  padding-left: 12px;
  margin: 0.5rem 0;
  color: #4E5969;
  background: rgba(22, 93, 255, 0.04);
  border-radius: 0 8px 8px 0;
  padding: 8px 12px;
}
.markdown-content :deep(a) { color: #165DFF; text-decoration: underline; }
.markdown-content :deep(strong) { font-weight: 700; color: #1D2129; }
.markdown-content :deep(hr) { border: none; border-top: 1px solid #E5E6EB; margin: 1rem 0; }

/* User bubble markdown overrides */
.user-bubble .markdown-content :deep(code) {
  background: rgba(22, 93, 255, 0.1);
  color: #165DFF;
}
.user-bubble .markdown-content :deep(strong) { color: #1D2129; }
.user-bubble .markdown-content :deep(a) { color: #165DFF; }

/* ─── Input Area ─────────────────────────────────────────────── */
.input-area {
  border-top: 1px solid rgba(0,0,0,0.06);
  padding: 14px 20px 16px;
  background: white;
  flex-shrink: 0;
  position: relative;
}

.file-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.file-preview-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: #F7F8FC;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 8px;
  font-size: 12px;
  color: #4E5969;
}

.file-size { color: #86909C; }

.file-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: #86909C;
  padding: 0;
  font-size: 11px;
  line-height: 1;
  transition: color 0.15s;
}

.file-remove:hover { color: #F53F3F; }

.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #F7F8FC;
  border: 1.5px solid rgba(0,0,0,0.08);
  border-radius: 16px;
  padding: 6px 6px 6px 14px;
  transition: all 0.2s;
}

.input-row:focus-within {
  border-color: #165DFF;
  background: white;
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.08);
}

.attach-btn {
  color: #86909C;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.15s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.attach-btn:hover { color: #165DFF; }

/* Attach toggle button */
.attach-toggle-btn {
  background: #F2F3F5;
  border: 1.5px solid transparent;
  border-radius: 12px;
  color: #4E5969;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.attach-toggle-btn:hover {
  color: #165DFF;
  border-color: #165DFF;
  background: white;
}

.attach-toggle-btn:active {
  color: #165DFF;
  border-color: #165DFF;
  background: rgba(22, 93, 255, 0.06);
}

/* Attach panel popup */
.attach-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  width: 300px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  border: 1px solid rgba(0,0,0,0.07);
  z-index: 50;
  overflow: hidden;
}

.attach-panel-inner {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attach-url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F7F8FC;
  border: 1.5px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  padding: 4px 4px 4px 12px;
}

.attach-url-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 13px;
  color: #1D2129;
  padding: 6px 0;
  min-width: 0;
}

.attach-url-input::placeholder { color: #C9CDD4; }

.attach-url-btn {
  padding: 6px 14px;
  background: rgba(22, 93, 255, 0.1);
  color: #165DFF;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.attach-url-btn:hover { background: rgba(22, 93, 255, 0.18); }

.attach-or {
  text-align: center;
  font-size: 12px;
  color: #C9CDD4;
  position: relative;
}

.attach-or::before,
.attach-or::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 38%;
  height: 1px;
  background: #E5E6EB;
}

.attach-or::before { left: 0; }
.attach-or::after { right: 0; }

.attach-local-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px;
  border: 1.5px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  font-size: 14px;
  color: #165DFF;
  cursor: pointer;
  transition: all 0.15s;
  background: white;
}

.attach-local-btn:hover {
  background: rgba(22, 93, 255, 0.04);
  border-color: rgba(22, 93, 255, 0.25);
}

.chat-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1D2129;
  padding: 6px 0;
  min-width: 0;
}

.chat-input::placeholder { color: #86909C; }

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
  flex-shrink: 0;
  background: #165DFF;
  color: white;
  opacity: 0.35;
}

.send-btn.active {
  opacity: 1;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.35);
}

.send-btn.active:hover {
  filter: brightness(1.1);
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.45);
}

.send-btn:disabled:not(.active) { cursor: not-allowed; }

.input-hint {
  font-size: 11px;
  color: #C9CDD4;
  text-align: center;
  margin-top: 8px;
}

/* ─── Responsive ─────────────────────────────────────────────── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -260px;
    top: 0;
    height: 100vh;
    z-index: 100;
  }

  .sidebar.open { left: 0; }
  .sidebar-overlay { display: block; }
  .sidebar-toggle { display: flex; }
  .back-home-btn span, .export-btn span { display: none; }
  .agent-name { font-size: 13px; }

  .messages-area { padding: 16px 12px; }
  .user-msg-wrap { max-width: 90%; }
  .assistant-msg-wrap { max-width: 95%; }
  .input-area { padding: 10px 12px 12px; }
  .welcome-suggestions { flex-direction: column; align-items: stretch; }
  .suggestion-chip { justify-content: center; }
}
</style>
