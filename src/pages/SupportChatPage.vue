<template>
  <div class="chat-page">
    <AppHeader />

    <div v-if="sidebarOpen" class="sidebar-overlay" @click="closeSidebar" />

    <div class="main-container">
      <aside class="sidebar" :class="{ open: sidebarOpen }">
        <div class="sidebar-header">
          <button class="new-chat-btn" @click="handleNewChat">
            <i class="fa fa-plus" />
            <span>开启新对话</span>
          </button>
        </div>
        <div class="conversations-list">
          <div v-if="loadingConversations" class="loading-indicator">
            <i class="fa fa-spinner fa-spin" /> 加载中...
          </div>
          <div v-else-if="conversations.length === 0" class="empty-state">
            <i class="fa fa-comments" />
            <p>暂无对话记录</p>
            <p class="text-xs mt-1">点击上方按钮开启新对话</p>
          </div>
          <template v-else>
            <div
              v-for="conv in conversations"
              :key="conv.id"
              class="conversation-item"
              :class="{ active: chatStore.currentConversationId === conv.id }"
              @click="handleSwitchConversation(conv.id)"
            >
              <div class="conv-icon">
                <i class="fa fa-comment-o" />
              </div>
              <div class="conv-info">
                <div class="conv-title">{{ conv.title || '未命名对话' }}</div>
                <div class="conv-time">{{ formatConvTime(conv.updatedAt || conv.createdAt) }}</div>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <div class="chat-container">
        <header class="chat-header">
          <div class="flex items-center gap-3">
            <button class="toggle-sidebar-btn" @click="toggleSidebar">
              <i class="fa fa-bars" />
            </button>
            <router-link to="/" class="text-primary hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <i class="fa fa-arrow-left" />
            </router-link>
            <div class="flex items-center gap-2">
              <img src="/avatar.png" alt="量仔" class="w-10 h-10 rounded-full object-cover" />
              <div>
                <h1 class="font-bold text-gray-800 text-base m-0">vastbase 智能助手 - 量仔</h1>
                <p class="text-xs m-0" :class="statusColor">{{ statusText }}</p>
              </div>
            </div>
          </div>
          <router-link
            to="/"
            class="text-gray-500 hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm no-underline"
          >
            <i class="fa fa-home mr-1" />返回首页
          </router-link>
        </header>

        <div ref="messagesContainerRef" class="messages-container">
          <div
            v-for="msg in chatStore.messages"
            :key="msg.id"
            class="message"
            :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'"
          >
            <template v-if="msg.role === 'user'">
              <div class="flex items-end gap-2 max-w-[80%]">
                <div class="user-bubble">
                  <div class="markdown-content user-message-text" v-html="renderContent(msg.content)" />
                  <div v-if="msg.files && msg.files.length" class="mt-2">
                    <div v-for="(f, idx) in msg.files" :key="idx" class="message-file">
                      <i class="fa fa-file-o" />
                      <span>{{ f.name }}</span>
                    </div>
                  </div>
                </div>
                <div class="w-8 h-8 bg-[#E8F3FF] rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="fa fa-user text-[#165DFF] text-sm" />
                </div>
              </div>
            </template>
            <template v-else>
              <div class="max-w-[85%]">
                <div class="flex items-start gap-2 mb-1">
                  <img src="/avatar.png" alt="量仔" class="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <span class="text-sm text-gray-500 font-medium">量仔</span>
                </div>
                <div class="assistant-bubble markdown-content assistant-message-text" v-html="renderContent(msg.content)" />
              </div>
            </template>
          </div>

          <div v-if="isStreaming && streamingText" class="message flex justify-start">
            <div class="max-w-[85%]">
              <div class="flex items-start gap-2 mb-1">
                <img src="/avatar.png" alt="量仔" class="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                <span class="text-sm text-gray-500 font-medium">量仔</span>
              </div>
              <div class="assistant-bubble markdown-content assistant-message-text" v-html="renderMarkdown(streamingText)" />
            </div>
          </div>

          <div v-if="isStreaming && !streamingText" class="message flex justify-start">
            <div class="bg-gray-100 px-3 py-2 rounded-2xl">
              <div class="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <div v-if="uploadedFiles.length" class="file-preview-container">
            <div v-for="(file, index) in uploadedFiles" :key="index" class="file-preview">
              <i class="fa fa-file-o text-gray-500" />
              <span class="text-gray-700">{{ file.name }}</span>
              <span class="text-gray-400 text-xs">{{ formatFileSize(file.size) }}</span>
              <span class="remove-file" @click="removeFile(index)">
                <i class="fa fa-times" />
              </span>
            </div>
          </div>
          <div class="flex gap-3 file-upload-area">
            <label class="file-upload-btn" title="上传文件">
              <i class="fa fa-paperclip" />
              <input type="file" multiple class="hidden" accept="*/*" @change="handleFileSelect" />
            </label>
            <input
              ref="inputRef"
              v-model="inputText"
              type="text"
              placeholder="输入您的问题..."
              class="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              @keypress.enter.exact="handleSend"
            />
            <button
              class="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isStreaming || !inputText.trim()"
              @click="handleSend"
            >
              <i class="fa fa-paper-plane" />
              <span>发送</span>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import AppHeader from '@/components/AppHeader.vue'
import { useChatStore } from '@/stores/chat'
import { useStreamChat } from '@/composables/useStreamChat'
import {
  streamChatMessage,
  fetchConversationMessages,
  fetchConversations,
  uploadFile,
} from '@/api'
import { generateId, formatTime, isMvsTicketJson } from '@/utils'
import type { ChatMessage, Conversation, DifyFile } from '@/types'

const route = useRoute()
const chatStore = useChatStore()

const {
  isStreaming,
  streamingText,
  conversationId: streamConversationId,
  sendMessage: streamSend,
  cancel: streamCancel,
  reset: streamReset,
} = useStreamChat({
  onFinish(fullText) {
    let clean = fullText
    clean = clean.replace(/<think[\s\S]*?<\/think>/g, '')
    clean = clean.replace(/<think&gt;[\s\S]*?<\/think&gt;/g, '')
    clean = cleanImageTags(clean)
    clean = cleanWhitespace(clean)
    clean = clean.trim()

    chatStore.addMessage({
      id: generateId(),
      role: 'assistant',
      content: clean,
      timestamp: Date.now(),
    })
    loadConversations()
    setStatus('在线', 'text-green-500')
  },
  onError(err) {
    chatStore.addMessage({
      id: generateId(),
      role: 'assistant',
      content: `抱歉，发生了错误：${err.message}`,
      timestamp: Date.now(),
    })
    setStatus('错误', 'text-red-500')
  },
})

const inputText = ref('')
const inputRef = ref<HTMLInputElement>()
const messagesContainerRef = ref<HTMLDivElement>()
const uploadedFiles = ref<File[]>([])
const conversations = ref<Conversation[]>([])
const loadingConversations = ref(false)
const sidebarOpen = ref(false)

const statusText = ref('在线')
const statusColor = ref('text-green-500')

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

function setStatus(text: string, color: string) {
  statusText.value = text
  statusColor.value = color
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
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

const SECTION_ICONS: Record<string, string> = {
  '问题信息': 'fa-exclamation-circle',
  '客户信息': 'fa-user',
  '产品信息': 'fa-cube',
}

const TICKET_FIELD_LABELS: Record<string, string> = {
  '工单编号': '工单编号',
  '问题概要': '问题概要',
  '问题描述': '问题描述',
  '公司名称': '公司名称',
  '客户级别': '客户级别',
  '是否TOP客户': '是否TOP客户',
  '客户经理': '客户经理',
  '产品版本': '产品版本',
  '模块': '模块',
  '硬件平台': '硬件平台',
  '操作系统': '操作系统',
  '部署方式': '部署方式',
}

function renderTicketFields(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([, v]) => typeof v === 'string')
    .map(([key, value]) => {
      const cleanValue = stripHtml(value as string).trim()
      return `<div class="ticket-field">
        <span class="ticket-field-label">${escapeHtml(TICKET_FIELD_LABELS[key] || key)}</span>
        <span class="ticket-field-value">${escapeHtml(cleanValue)}</span>
      </div>`
    })
    .join('')
}

function isLegacyMvsTicketJson(content: string): boolean {
  try {
    const trimmed = content.trim()
    if (!trimmed.startsWith('{')) return false
    const data = JSON.parse(trimmed)
    return !!(data['问题信息'] || data['客户信息'] || data['产品信息'] || data['沟通记录'])
  } catch {
    return false
  }
}

function renderMvsTicketForm(content: string): string {
  try {
    const data = JSON.parse(content.trim())
    let html = '<div class="mvs-ticket-form">'

    const sections = [
      { key: '问题信息', title: '问题信息' },
      { key: '客户信息', title: '客户信息' },
      { key: '产品信息', title: '产品信息' },
    ]

    sections.forEach((sec) => {
      if (data[sec.key]) {
        const icon = SECTION_ICONS[sec.key] || 'fa-info-circle'
        html += `<div class="ticket-section">
          <div class="ticket-section-header">
            <i class="fa ${icon}"></i>
            ${escapeHtml(sec.title)}
          </div>
          <div class="ticket-section-body">
            ${renderTicketFields(data[sec.key])}
          </div>
        </div>`
      }
    })

    if (data['沟通记录'] && Array.isArray(data['沟通记录']) && data['沟通记录'].length > 0) {
      html += `<div class="ticket-section">
        <div class="ticket-section-header">
          <i class="fa fa-comments"></i>
          沟通记录 (${data['沟通记录'].length}条)
        </div>
        <div class="ticket-section-body">`

      data['沟通记录'].forEach((record: Record<string, string>) => {
        const isUser = record['记录类型'] === '用户发送消息'
        const typeClass = isUser ? 'user-type' : 'engineer-type'
        const typeLabel = isUser ? '用户' : '工程师'
        let rawContent = record['内容'] || ''
        rawContent = rawContent.replace(/<img\s+[^>]*?src\s*=\s*["']([^"']+)["'][^>]*?\/?>/gi, '[图片: $1]')
        rawContent = rawContent.replace(/<img\s+[^>]*?src\s*=\s*([^\s>"']+)[^>]*?\/?>/gi, '[图片: $1]')
        const cleanContent = stripHtml(rawContent).trim()
        const tag = record['流程标识'] ? `<span class="ticket-record-tag">${escapeHtml(record['流程标识'])}</span>` : ''

        html += `<div class="ticket-record">
          <div class="ticket-record-header">
            <span class="ticket-record-type ${typeClass}">${typeLabel}</span>
            <span>${escapeHtml(record['时间'] || '')}</span>
            ${tag}
          </div>
          <div class="ticket-record-content">${renderMarkdown(cleanContent)}</div>
        </div>`
      })

      html += '</div></div>'
    }

    html += '</div>'
    return html
  } catch {
    return renderMarkdown(content)
  }
}

function renderContent(content: string): string {
  if (isLegacyMvsTicketJson(content) || isMvsTicketJson(content)) {
    return renderMvsTicketForm(content)
  }
  return renderMarkdown(content)
}

function scrollToBottom() {
  nextTick(() => {
    const el = messagesContainerRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatConvTime(ts: string): string {
  if (!ts) return ''
  const date = new Date(typeof ts === 'string' && ts.length <= 10 ? parseInt(ts) * 1000 : new Date(ts).getTime())
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  files.forEach((file) => {
    if (uploadedFiles.value.length < 5) {
      uploadedFiles.value.push(file)
    }
  })
  target.value = ''
}

function removeFile(index: number) {
  uploadedFiles.value.splice(index, 1)
}

async function handleSend() {
  const query = inputText.value.trim()
  if (!query || isStreaming.value) return

  inputText.value = ''
  const currentFiles = [...uploadedFiles.value]
  uploadedFiles.value = []

  const cleanedQuery = cleanWhitespace(query)
  chatStore.addMessage({
    id: generateId(),
    role: 'user',
    content: cleanedQuery,
    timestamp: Date.now(),
    files: currentFiles.map((f) => ({ name: f.name })),
  })

  scrollToBottom()
  setStatus('正在思考...', 'text-blue-500')

  try {
    let difyFiles: DifyFile[] = []
    if (currentFiles.length > 0) {
      setStatus('上传文件中...', 'text-blue-500')
      for (const file of currentFiles) {
        const fileId = await uploadFile(file)
        if (fileId) {
          difyFiles.push({ type: 'document', transfer_method: 'local_file', upload_file_id: fileId })
        }
      }
      setStatus('正在思考...', 'text-blue-500')
    }

    await streamSend(
      cleanedQuery,
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
    setStatus('错误', 'text-red-500')
  }
}

function handleNewChat() {
  if (isStreaming.value) return
  stopMessagePolling()
  streamReset()
  chatStore.reset()
  closeSidebar()
  setStatus('在线', 'text-green-500')
  nextTick(() => inputRef.value?.focus())
}

async function loadConversations() {
  loadingConversations.value = true
  try {
    const data = await fetchConversations()
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
  renderConversationList()

  try {
    setStatus('加载中...', 'text-blue-500')
    const data = await fetchConversationMessages(convId)
    const msgs = (data as any[]).reverse()

    let assistantCount = 0
    let userCount = 0

    msgs.forEach((msg: any) => {
      if (msg.query) {
        chatStore.addMessage({
          id: generateId(),
          role: 'user',
          content: cleanWhitespace(msg.query),
          timestamp: Date.now(),
        })
        userCount++
      }
      if (msg.answer && msg.answer.trim()) {
        let clean = msg.answer
        clean = clean.replace(/<think[\s\S]*?<\/think>/g, '')
        clean = clean.replace(/<think&gt;[\s\S]*?<\/think&gt;/g, '')
        clean = cleanImageTags(clean)
        clean = cleanWhitespace(clean)
        clean = clean.trim()
        chatStore.addMessage({
          id: generateId(),
          role: 'assistant',
          content: clean,
          timestamp: Date.now(),
        })
        assistantCount++
      }
    })

    const isFromRedirect = route.query.conversation_id

    if (isFromRedirect && userCount > 0 && assistantCount === 0) {
      startMessagePolling(convId, 0)
    } else if (isFromRedirect && userCount > assistantCount) {
      startMessagePolling(convId, assistantCount)
    } else {
      setStatus('在线', 'text-green-500')
    }

    scrollToBottom()
  } catch {
    setStatus('错误', 'text-red-500')
  }
}

function renderConversationList() {
  // conversations is reactive, template handles rendering
}

function stopMessagePolling() {
  if (pollingTimer.value) {
    clearTimeout(pollingTimer.value)
    pollingTimer.value = null
  }
  if (pollingTimeout.value) {
    clearTimeout(pollingTimeout.value)
    pollingTimeout.value = null
  }
  if (pollingStatusTimer.value) {
    clearInterval(pollingStatusTimer.value)
    pollingStatusTimer.value = null
  }
  pollingStartTime.value = null
  pollingRetryCount.value = 0
  pollingCurrentInterval.value = 2000
}

async function checkForNewMessages(convId: string, lastCount: number): Promise<boolean> {
  try {
    const data = await fetchConversationMessages(convId)
    const msgs = (data as any[]).reverse()
    const allAssistant = msgs.filter((m: any) => m.answer && m.answer.trim())
    const newMessages = allAssistant.slice(lastCount)

    if (newMessages.length > 0) {
      stopMessagePolling()
      newMessages.forEach((msg: any) => {
        let clean = msg.answer
        clean = clean.replace(/<think[\s\S]*?<\/think>/g, '')
        clean = clean.replace(/<think&gt;[\s\S]*?<\/think&gt;/g, '')
        clean = cleanImageTags(clean)
        clean = cleanWhitespace(clean)
        clean = clean.trim()
        chatStore.addMessage({
          id: generateId(),
          role: 'assistant',
          content: clean,
          timestamp: Date.now(),
        })
      })
      scrollToBottom()
      setStatus('在线', 'text-green-500')
      return true
    }

    pollingRetryCount.value = 0
    return false
  } catch {
    pollingRetryCount.value++
    if (pollingRetryCount.value >= POLLING_MAX_RETRIES) {
      stopMessagePolling()
      setStatus('轮询失败，请刷新页面重试', 'text-red-500')
      return false
    }
    pollingCurrentInterval.value = POLLING_INTERVALS[Math.min(pollingRetryCount.value, POLLING_INTERVALS.length - 1)]
    return false
  }
}

function startMessagePolling(convId: string, lastCount: number) {
  stopMessagePolling()
  pollingStartTime.value = Date.now()
  pollingRetryCount.value = 0
  pollingCurrentInterval.value = POLLING_INTERVALS[0]

  pollingTimeout.value = setTimeout(() => {
    stopMessagePolling()
    setStatus('AI思考超时，请重新发送问题', 'text-yellow-500')
  }, POLLING_MAX_DURATION)

  updatePollingStatus()
  pollingStatusTimer.value = setInterval(updatePollingStatus, 1000)

  const poll = async () => {
    const hasNew = await checkForNewMessages(convId, lastCount)
    if (hasNew) {
      stopMessagePolling()
      return
    }
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
  let text = `等待AI回复... (${minutes}:${seconds.toString().padStart(2, '0')})`
  if (pollingRetryCount.value > 0) {
    text += ` (重试 ${pollingRetryCount.value}/${POLLING_MAX_RETRIES})`
  }
  setStatus(text, 'text-blue-500')
}

watch(
  () => chatStore.messages.length,
  () => scrollToBottom(),
)

watch(streamingText, () => scrollToBottom())

onMounted(async () => {
  const convIdFromUrl = route.query.conversation_id as string

  if (convIdFromUrl) {
    chatStore.setConversationId(convIdFromUrl)
    streamConversationId.value = convIdFromUrl
    await handleSwitchConversation(convIdFromUrl)
    await loadConversations()
  } else {
    await loadConversations()
    setStatus('在线', 'text-green-500')
  }

  nextTick(() => inputRef.value?.focus())
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f3f4f6;
}

.main-container {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.new-chat-btn {
  width: 100%;
  padding: 12px;
  background: #165dff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;
}

.new-chat-btn:hover {
  background: #0d4fd8;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.conversation-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.conversation-item:hover {
  background: #f3f4f6;
}

.conversation-item.active {
  background: #e8f3ff;
  color: #165dff;
}

.conv-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.conversation-item.active .conv-icon {
  background: #165dff;
  color: white;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-time {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  min-height: 0;
}

.chat-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  min-height: 0;
}

.message {
  margin-bottom: 1rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-bubble {
  background: #e8f3ff;
  color: #1f2937;
  padding: 8px 12px;
  border-radius: 16px 16px 4px 16px;
}

.assistant-bubble {
  background: #f3f4f6;
  padding: 8px 12px;
  border-radius: 16px 16px 16px 4px;
}

.typing-indicator {
  display: inline-flex;
  gap: 4px;
  padding: 8px 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #165dff;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  font-weight: bold;
  margin: 1rem 0 0.5rem;
}

.markdown-content :deep(h1) {
  font-size: 1.5rem;
}

.markdown-content :deep(h2) {
  font-size: 1.25rem;
}

.markdown-content :deep(h3) {
  font-size: 1.1rem;
}

.markdown-content :deep(p) {
  margin: 0.5rem 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin: 0.25rem 0;
}

.markdown-content :deep(code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875em;
}

.markdown-content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: left;
}

.markdown-content :deep(th) {
  background: #f9fafb;
  font-weight: 600;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid #165dff;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #6b7280;
}

.user-message-text,
.assistant-message-text {
  font-size: 14px;
  line-height: 1.5;
}

.chat-input-area {
  border-top: 1px solid #e5e7eb;
  padding: 16px;
  background: #f9fafb;
  flex-shrink: 0;
}

.file-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 13px;
}

.remove-file {
  cursor: pointer;
  color: #ef4444;
  margin-left: auto;
}

.file-upload-area {
  position: relative;
}

.file-upload-btn {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
}

.file-upload-btn:hover {
  color: #165dff;
}

.message-file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  margin-top: 8px;
  font-size: 12px;
}

.mvs-ticket-form {
  font-size: 13px;
  line-height: 1.5;
  max-width: 520px;
}

.mvs-ticket-form :deep(.ticket-section) {
  margin-bottom: 10px;
  border: 1px solid #d0e3ff;
  border-radius: 8px;
  overflow: hidden;
}

.mvs-ticket-form :deep(.ticket-section:last-child) {
  margin-bottom: 0;
}

.mvs-ticket-form :deep(.ticket-section-header) {
  background: #e8f3ff;
  padding: 6px 12px;
  font-weight: 600;
  font-size: 13px;
  color: #165dff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mvs-ticket-form :deep(.ticket-section-body) {
  padding: 8px 12px;
}

.mvs-ticket-form :deep(.ticket-field) {
  display: flex;
  padding: 4px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.mvs-ticket-form :deep(.ticket-field:last-child) {
  border-bottom: none;
}

.mvs-ticket-form :deep(.ticket-field-label) {
  color: #6b7280;
  min-width: 80px;
  flex-shrink: 0;
  font-size: 12px;
}

.mvs-ticket-form :deep(.ticket-field-value) {
  color: #1f2937;
  word-break: break-all;
  font-size: 12px;
}

.mvs-ticket-form :deep(.ticket-record) {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 6px;
  overflow: hidden;
}

.mvs-ticket-form :deep(.ticket-record:last-child) {
  margin-bottom: 0;
}

.mvs-ticket-form :deep(.ticket-record-header) {
  background: #f9fafb;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  border-bottom: 1px solid #e5e7eb;
}

.mvs-ticket-form :deep(.ticket-record-type) {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}

.mvs-ticket-form :deep(.ticket-record-type.user-type) {
  background: #dbeafe;
  color: #1d4ed8;
}

.mvs-ticket-form :deep(.ticket-record-type.engineer-type) {
  background: #dcfce7;
  color: #15803d;
}

.mvs-ticket-form :deep(.ticket-record-content) {
  padding: 6px 10px;
  font-size: 12px;
  color: #374151;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.mvs-ticket-form :deep(.ticket-record-tag) {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  background: #fef3c7;
  color: #92400e;
}

.toggle-sidebar-btn {
  display: none;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #165dff;
  border-radius: 6px;
}

.toggle-sidebar-btn:hover {
  background: #f3f4f6;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s;
  }

  .sidebar.open {
    left: 0;
  }

  .sidebar-overlay {
    display: block;
  }

  .toggle-sidebar-btn {
    display: flex;
  }
}
</style>
