<template>
  <div class="fb-admin">
    <!-- Login screen -->
    <div v-if="!authed" class="fb-login-wrap">
      <div class="fb-login-card">
        <div class="fb-login-icon"><i class="fa fa-lock" /></div>
        <h2 class="fb-login-title">反馈管理</h2>
        <p class="fb-login-desc">请输入访问密钥</p>
        <input v-model="tokenInput" type="password" class="fb-login-input" placeholder="Admin Token" @keypress.enter="doLogin" />
        <p v-if="loginError" class="fb-login-error">{{ loginError }}</p>
        <button class="fb-login-btn" @click="doLogin">进入</button>
      </div>
    </div>

    <template v-else>
      <header class="fb-header">
        <div class="fb-header-inner">
          <span class="fb-header-title">
            <i class="fa fa-comments" style="color:var(--primary);margin-right:8px" />
            用户反馈管理
          </span>
          <span class="fb-header-count" v-if="total > 0">共 {{ total }} 个会话有反馈</span>
        </div>
      </header>

      <div class="fb-body">
        <!-- Left sidebar: conversation list -->
        <aside class="fb-sidebar">
          <div v-if="loadingList" class="fb-loading"><i class="fa fa-spinner fa-spin" /> 加载中...</div>
          <div v-else-if="groups.length === 0" class="fb-empty">暂无反馈数据</div>
          <template v-else>
            <div
              v-for="g in groups" :key="g.conversation_id"
              class="fb-conv-item" :class="{ active: selectedConvId === g.conversation_id }"
              @click="selectConversation(g.conversation_id)"
            >
              <div class="fb-conv-id">{{ shortId(g.conversation_id) }}</div>
              <div class="fb-conv-meta">
                <span class="fb-conv-time">{{ formatTime(g.last_feedback_at) }}</span>
                <span class="fb-conv-count">{{ g.feedback_count }} 条</span>
              </div>
            </div>
            <div class="fb-pagination" v-if="totalPages > 1">
              <button :disabled="page <= 1" @click="loadPage(page - 1)"><i class="fa fa-chevron-left" /></button>
              <span>{{ page }} / {{ totalPages }}</span>
              <button :disabled="page >= totalPages" @click="loadPage(page + 1)"><i class="fa fa-chevron-right" /></button>
            </div>
          </template>
        </aside>

        <!-- Right: full conversation + feedback -->
        <main class="fb-detail" ref="detailRef">
          <div v-if="!selectedConvId" class="fb-detail-empty">
            <i class="fa fa-arrow-left" style="margin-right:8px;opacity:0.4" />
            选择左侧会话查看详情
          </div>

          <template v-else>
            <div class="fb-detail-header">
              <span class="fb-detail-conv-id">
                <i class="fa fa-link" style="opacity:0.5;margin-right:6px" />
                会话 ID：{{ selectedConvId }}
              </span>
              <button class="fb-copy-btn" @click="copyText(selectedConvId)" title="复制"><i class="fa fa-copy" /></button>
            </div>

            <div v-if="loadingDetail" class="fb-loading"><i class="fa fa-spinner fa-spin" /> 加载中...</div>

            <div v-else-if="chatItems.length === 0 && detailRecords.length === 0" class="fb-empty">暂无数据</div>

            <template v-else>
              <!-- Chat-style message list (no feedback mixed in) -->
              <div class="fb-messages" v-if="chatItems.length > 0">
                <template v-for="item in chatItems" :key="item.key">
                  <div v-if="item.type === 'user'" class="fb-msg-row user">
                    <div class="fb-user-wrap">
                      <div class="fb-user-bubble">
                        <div class="fb-md" v-html="renderMd(item.content)" />
                      </div>
                      <div class="fb-user-avatar"><i class="fa fa-user" /></div>
                    </div>
                  </div>
                  <div v-else-if="item.type === 'assistant'" class="fb-msg-row assistant">
                    <div class="fb-assistant-wrap">
                      <div class="fb-bot-avatar"><img src="/avatar.png" alt="量仔" /></div>
                      <div class="fb-assistant-bubble">
                        <div class="fb-md" v-html="renderMd(item.content)" />
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Feedback section at the bottom -->
              <div class="fb-feedback-section" v-if="detailRecords.length > 0">
                <div class="fb-feedback-section-title">
                  <i class="fa fa-flag" style="color:var(--warning);margin-right:6px" />
                  用户反馈（{{ detailRecords.length }} 条）
                </div>
                <div class="fb-timeline">
                  <div v-for="(rec, idx) in detailRecords" :key="rec.id" class="fb-timeline-item">
                    <div class="fb-timeline-dot" :class="ratingDotClass(rec.rating)" />
                    <div class="fb-timeline-card">
                      <div class="fb-timeline-card-header">
                        <span class="fb-timeline-index">#{{ idx + 1 }}</span>
                        <span class="fb-rating-badge" :class="ratingBadgeClass(rec.rating)">
                          <i :class="ratingIcon(rec.rating)" />
                          {{ ratingLabel(rec.rating) }}
                        </span>
                        <span class="fb-timeline-time">{{ formatTime(rec.created_at) }}</span>
                      </div>
                      <div v-if="rec.content" class="fb-timeline-content">{{ rec.content }}</div>
                      <div v-else class="fb-timeline-no-content">（无文字说明）</div>
                      <div class="fb-timeline-meta">
                        <span v-if="rec.message_id">
                          <i class="fa fa-comment-o" style="opacity:0.5;margin-right:4px" />消息 ID：{{ rec.message_id }}
                        </span>
                        <span>
                          <i class="fa fa-user-o" style="opacity:0.5;margin-right:4px" />用户：{{ rec.user_id }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </main>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import { fetchFeedbackList, fetchFeedbacksByConversation, fetchAdminConversationMessages } from '@/api'
import type { FeedbackGroup, FeedbackRecord, DifyMessage } from '@/api'

marked.setOptions({ breaks: true, gfm: true })

const TOKEN_KEY = 'fb_admin_token'
const tokenInput = ref('')
const authed = ref(false)
const loginError = ref('')
const adminToken = ref('')

function doLogin() {
  if (!tokenInput.value.trim()) { loginError.value = '请输入密钥'; return }
  adminToken.value = tokenInput.value.trim()
  sessionStorage.setItem(TOKEN_KEY, adminToken.value)
  authed.value = true
  loginError.value = ''
  loadPage(1)
}

onMounted(() => {
  const saved = sessionStorage.getItem(TOKEN_KEY)
  if (saved) { adminToken.value = saved; authed.value = true; loadPage(1) }
})

// ── List ──────────────────────────────────────────────────────
const groups = ref<FeedbackGroup[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loadingList = ref(false)
const totalPages = computed(() => Math.ceil(total.value / limit))

async function loadPage(p: number) {
  loadingList.value = true
  try {
    const res = await fetchFeedbackList(p, limit, adminToken.value)
    groups.value = res.data
    total.value = res.total
    page.value = p
  } catch (e: any) {
    if (e.message.includes('401')) { authed.value = false; sessionStorage.removeItem(TOKEN_KEY) }
  } finally {
    loadingList.value = false
  }
}

// ── Detail ────────────────────────────────────────────────────
const selectedConvId = ref('')
const detailRecords = ref<FeedbackRecord[]>([])
const difyMessages = ref<DifyMessage[]>([])
const loadingDetail = ref(false)
const detailRef = ref<HTMLElement>()

// Chat messages only (no feedback mixed in)
type ChatItem =
  | { type: 'user'; key: string; content: string }
  | { type: 'assistant'; key: string; content: string }

const chatItems = computed<ChatItem[]>(() => {
  const items: ChatItem[] = []
  for (const msg of difyMessages.value) {
    if (msg.query?.trimStart().startsWith('{"type":"feedback"')) continue
    items.push({ type: 'user', key: `u-${msg.id}`, content: msg.query || '' })
    if (msg.answer?.trim()) {
      items.push({ type: 'assistant', key: `a-${msg.id}`, content: msg.answer })
    }
  }
  return items
})

async function selectConversation(convId: string) {
  selectedConvId.value = convId
  loadingDetail.value = true
  difyMessages.value = []
  detailRecords.value = []
  try {
    const group = groups.value.find(g => g.conversation_id === convId)
    const userId = group?.user_id || ''
    const [msgs, feedbacks] = await Promise.all([
      fetchAdminConversationMessages(convId, userId, adminToken.value),
      fetchFeedbacksByConversation(convId, adminToken.value),
    ])
    difyMessages.value = msgs
    detailRecords.value = feedbacks
  } catch (e: any) {
    if (e.message.includes('401')) { authed.value = false; sessionStorage.removeItem(TOKEN_KEY) }
  } finally {
    loadingDetail.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────
function renderMd(text: string): string {
  if (!text) return ''
  // Strip <think> blocks
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  try { return marked.parse(cleaned) as string } catch { return text }
}

function shortId(id: string) {
  if (!id) return '未知会话'
  return id.length > 20 ? id.slice(0, 8) + '...' + id.slice(-6) : id
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function ratingLabel(r: string | null) {
  if (r === 'like') return '有帮助'
  if (r === 'dislike') return '没帮助'
  return '未评分'
}

function ratingIcon(r: string | null) {
  if (r === 'like') return 'fa fa-thumbs-up'
  if (r === 'dislike') return 'fa fa-thumbs-down'
  return 'fa fa-minus'
}

function ratingBadgeClass(r: string | null) {
  if (r === 'like') return 'badge-like'
  if (r === 'dislike') return 'badge-dislike'
  return 'badge-null'
}

function ratingDotClass(r: string | null) {
  if (r === 'like') return 'tdot-like'
  if (r === 'dislike') return 'tdot-dislike'
  return 'tdot-null'
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}
</script>

<style scoped>
.fb-admin { min-height: 100vh; background: var(--surface-2); display: flex; flex-direction: column; font-family: inherit; }

/* Login */
.fb-login-wrap { flex: 1; display: flex; align-items: center; justify-content: center; }
.fb-login-card { background: white; border-radius: var(--radius-lg); padding: 40px 36px; box-shadow: var(--shadow-lg); width: 340px; text-align: center; }
.fb-login-icon { font-size: 32px; color: var(--primary); margin-bottom: 12px; }
.fb-login-title { font-size: 20px; font-weight: 700; color: var(--text-1); margin: 0 0 6px; }
.fb-login-desc { font-size: 13px; color: var(--text-3); margin: 0 0 20px; }
.fb-login-input { width: 100%; box-sizing: border-box; padding: 10px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-strong); font-size: 14px; outline: none; margin-bottom: 10px; }
.fb-login-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-dim); }
.fb-login-error { color: var(--danger); font-size: 12px; margin: 0 0 10px; }
.fb-login-btn { width: 100%; padding: 10px; border-radius: var(--radius-sm); border: none; cursor: pointer; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; font-size: 14px; font-weight: 600; }

/* Header */
.fb-header { background: white; border-bottom: 1px solid var(--border); padding: 0 24px; height: 56px; display: flex; align-items: center; flex-shrink: 0; }
.fb-header-inner { display: flex; align-items: center; gap: 16px; width: 100%; }
.fb-header-title { font-size: 16px; font-weight: 700; color: var(--text-1); }
.fb-header-count { font-size: 12px; color: var(--text-3); background: var(--surface-3); padding: 2px 10px; border-radius: 20px; }

/* Layout */
.fb-body { flex: 1; display: flex; overflow: hidden; height: calc(100vh - 56px); }

/* Sidebar */
.fb-sidebar { width: 280px; min-width: 240px; background: white; border-right: 1px solid var(--border); overflow-y: auto; display: flex; flex-direction: column; flex-shrink: 0; }
.fb-conv-item { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.15s; }
.fb-conv-item:hover { background: var(--surface-2); }
.fb-conv-item.active { background: var(--primary-dim); border-left: 3px solid var(--primary); }
.fb-conv-id { font-size: 12px; font-weight: 600; color: var(--text-1); font-family: monospace; margin-bottom: 4px; }
.fb-conv-meta { display: flex; align-items: center; gap: 8px; }
.fb-conv-time { font-size: 11px; color: var(--text-3); flex: 1; }
.fb-conv-badges { display: flex; gap: 3px; }
.fb-rating-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot-like { background: var(--success); }
.dot-dislike { background: var(--danger); }
.dot-null { background: var(--text-3); }
.fb-conv-count { font-size: 11px; color: var(--text-3); background: var(--surface-3); padding: 1px 6px; border-radius: 10px; }
.fb-pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px; margin-top: auto; border-top: 1px solid var(--border); }
.fb-pagination button { background: none; border: 1px solid var(--border-strong); border-radius: 6px; padding: 4px 10px; cursor: pointer; color: var(--text-2); }
.fb-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.fb-pagination span { font-size: 12px; color: var(--text-3); }

/* Detail panel */
.fb-detail { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.fb-detail-empty { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-3); font-size: 14px; }
.fb-detail-header { display: flex; align-items: center; gap: 8px; padding: 16px 24px; border-bottom: 1px solid var(--border); background: white; position: sticky; top: 0; z-index: 10; flex-shrink: 0; }
.fb-detail-conv-id { font-size: 12px; color: var(--text-2); font-family: monospace; }
.fb-copy-btn { background: none; border: 1px solid var(--border-strong); border-radius: 6px; padding: 3px 8px; cursor: pointer; color: var(--text-3); font-size: 12px; }
.fb-copy-btn:hover { color: var(--primary); border-color: var(--primary); }

/* Messages */
.fb-messages { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

.fb-msg-row { display: flex; }
.fb-msg-row.user { justify-content: flex-end; }
.fb-msg-row.assistant { justify-content: flex-start; }
.fb-msg-row.feedback { justify-content: flex-end; }

/* User bubble */
.fb-user-wrap { display: flex; align-items: flex-start; gap: 10px; max-width: 72%; }
.fb-user-bubble { background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; border-radius: 16px 4px 16px 16px; padding: 12px 16px; font-size: 14px; line-height: 1.6; }
.fb-user-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--surface-3); display: flex; align-items: center; justify-content: center; color: var(--text-3); font-size: 14px; flex-shrink: 0; }

/* Assistant bubble */
.fb-assistant-wrap { display: flex; align-items: flex-start; gap: 10px; max-width: 80%; }
.fb-bot-avatar { width: 34px; height: 34px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
.fb-bot-avatar img { width: 100%; height: 100%; object-fit: cover; }
.fb-assistant-bubble { background: white; border: 1px solid var(--border); border-radius: 4px 16px 16px 16px; padding: 12px 16px; font-size: 14px; line-height: 1.6; box-shadow: var(--shadow-sm); }

/* Feedback card */
.fb-feedback-card { background: white; border: 1.5px solid var(--primary-glow); border-radius: var(--radius-md); padding: 12px 16px; max-width: 480px; box-shadow: var(--shadow-sm); }
.fb-feedback-card-header { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-2); margin-bottom: 8px; }
.fb-rating-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 20px; }
.badge-like { background: rgba(0,180,42,0.1); color: var(--success); }
.badge-dislike { background: rgba(245,63,63,0.1); color: var(--danger); }
.badge-null { background: var(--surface-3); color: var(--text-3); }
.fb-feedback-time { font-size: 11px; color: var(--text-3); margin-left: auto; font-weight: 400; }
.fb-feedback-content { font-size: 13px; color: var(--text-1); line-height: 1.6; background: var(--surface-2); border-radius: var(--radius-sm); padding: 8px 10px; }
.fb-feedback-no-content { font-size: 12px; color: var(--text-3); font-style: italic; }

/* Feedback section (bottom) */
.fb-feedback-section { margin: 0 24px 24px; border-top: 2px dashed var(--border-strong); padding-top: 20px; }
.fb-feedback-section-title { font-size: 13px; font-weight: 700; color: var(--text-2); margin-bottom: 16px; display: flex; align-items: center; }
.fb-timeline { display: flex; flex-direction: column; position: relative; }
.fb-timeline::before { content: ''; position: absolute; left: 11px; top: 12px; bottom: 12px; width: 2px; background: var(--border); }
.fb-timeline-item { display: flex; gap: 16px; position: relative; padding-bottom: 16px; }
.fb-timeline-dot { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; border: 3px solid white; z-index: 1; }
.tdot-like { background: var(--success); box-shadow: 0 0 0 2px rgba(0,180,42,0.3); }
.tdot-dislike { background: var(--danger); box-shadow: 0 0 0 2px rgba(245,63,63,0.3); }
.tdot-null { background: var(--text-3); box-shadow: 0 0 0 2px var(--border); }
.fb-timeline-card { flex: 1; background: white; border-radius: var(--radius-md); padding: 12px 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
.fb-timeline-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.fb-timeline-index { font-size: 11px; color: var(--text-3); background: var(--surface-3); padding: 1px 7px; border-radius: 10px; }
.fb-timeline-time { font-size: 11px; color: var(--text-3); margin-left: auto; }
.fb-timeline-content { font-size: 14px; color: var(--text-1); line-height: 1.6; padding: 8px 10px; background: var(--surface-2); border-radius: var(--radius-sm); margin-bottom: 8px; }
.fb-timeline-no-content { font-size: 13px; color: var(--text-3); font-style: italic; margin-bottom: 8px; }
.fb-timeline-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 11px; color: var(--text-3); font-family: monospace; }

/* Markdown */
.fb-md :deep(p) { margin: 0 0 8px; }
.fb-md :deep(p:last-child) { margin: 0; }
.fb-md :deep(pre) { background: rgba(0,0,0,0.06); border-radius: 6px; padding: 10px 12px; overflow-x: auto; font-size: 12px; margin: 8px 0; }
.fb-user-bubble .fb-md :deep(pre) { background: rgba(255,255,255,0.15); }
.fb-md :deep(code) { font-family: monospace; font-size: 12px; }
.fb-md :deep(ul), .fb-md :deep(ol) { padding-left: 20px; margin: 4px 0; }
.fb-md :deep(li) { margin: 2px 0; }
.fb-md :deep(a) { color: var(--primary); text-decoration: underline; }
.fb-user-bubble .fb-md :deep(a) { color: rgba(255,255,255,0.9); }

.fb-loading { padding: 24px; text-align: center; color: var(--text-3); font-size: 14px; }
.fb-empty { padding: 40px 24px; text-align: center; color: var(--text-3); font-size: 14px; }
</style>
