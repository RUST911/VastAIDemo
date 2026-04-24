import type { DifyChatRequest, DifySSEEvent } from '@/types'

const DIFY_BASE = '/api/dify/v1'

const STORAGE_KEY = 'chat_user_id'

// Generate or retrieve a unique userId per browser session
// Uses sessionStorage so each session (including incognito) gets a fresh ID
function getOrCreateUserId(): string {
  let id = sessionStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

// Default user for regular chat page — unique per browser
export const DEFAULT_USER_ID = getOrCreateUserId()

export async function* streamChatMessage(
  query: string,
  conversationId?: string,
  files?: DifyChatRequest['files'],
  signal?: AbortSignal,
  userId: string = DEFAULT_USER_ID,
): AsyncGenerator<DifySSEEvent> {
  const body: DifyChatRequest = {
    inputs: {},
    query,
    response_mode: 'streaming',
    user: userId,
    ...(conversationId ? { conversation_id: conversationId } : {}),
    ...(files?.length ? { files } : {}),
  }

  const response = await fetch(`${DIFY_BASE}/chat-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Dify API error: ${response.status} ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No readable stream')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (trimmed.startsWith('event:')) continue

      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.slice(5).trim()
        if (!jsonStr) continue
        try {
          const event: DifySSEEvent = JSON.parse(jsonStr)
          yield event
        } catch {
          // skip malformed JSON
        }
      }
    }
  }

  if (buffer.trim()) {
    const trimmed = buffer.trim()
    if (trimmed.startsWith('data:')) {
      const jsonStr = trimmed.slice(5).trim()
      if (jsonStr) {
        try {
          yield JSON.parse(jsonStr)
        } catch {
          // skip
        }
      }
    }
  }
}

export async function fetchConversationMessages(conversationId: string, userId: string = DEFAULT_USER_ID): Promise<unknown[]> {
  const res = await fetch(
    `${DIFY_BASE}/messages?conversation_id=${conversationId}&user=${userId}&limit=100`,
  )
  if (!res.ok) throw new Error(`Fetch messages failed: ${res.status}`)
  const data = await res.json()
  return data.data || []
}

export async function fetchConversations(userId: string = DEFAULT_USER_ID): Promise<unknown[]> {
  const res = await fetch(`${DIFY_BASE}/conversations?user=${userId}&limit=100&sort_by=-updated_at`)
  if (!res.ok) throw new Error(`Fetch conversations failed: ${res.status}`)
  const data = await res.json()
  return data.data || []
}

export async function renameConversation(conversationId: string, name: string, userId: string = DEFAULT_USER_ID): Promise<void> {
  const res = await fetch(`${DIFY_BASE}/conversations/${conversationId}/name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, user: userId }),
  })
  if (!res.ok) throw new Error(`Rename conversation failed: ${res.status}`)
}

export async function deleteConversation(conversationId: string, userId: string = DEFAULT_USER_ID): Promise<void> {
  const res = await fetch(`${DIFY_BASE}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: userId }),
  })
  if (!res.ok) throw new Error(`Delete conversation failed: ${res.status}`)
}

export async function stopChatMessage(taskId: string, userId: string = DEFAULT_USER_ID): Promise<void> {
  const res = await fetch(`${DIFY_BASE}/chat-messages/${taskId}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: userId }),
  })
  if (!res.ok) throw new Error(`Stop chat failed: ${res.status}`)
}

export async function submitMessageFeedback(
  messageId: string,
  rating: 'like' | 'dislike' | null,
  content: string,
  userId: string = DEFAULT_USER_ID,
): Promise<void> {
  const res = await fetch(`${DIFY_BASE}/messages/${messageId}/feedbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, user: userId, content }),
  })
  if (!res.ok) throw new Error(`Submit feedback failed: ${res.status}`)
}

export interface FeedbackPayload {
  type: 'feedback'
  rating: 'like' | 'dislike' | null
  content: string
  messageId?: string
  conversationId?: string
  userId: string
  timestamp: string
}

export async function sendFeedbackAsChat(
  payload: FeedbackPayload,
  userId: string = DEFAULT_USER_ID,
): Promise<void> {
  const body = {
    inputs: {},
    query: JSON.stringify(payload),
    response_mode: 'blocking',
    user: userId,
  }
  const res = await fetch(`${DIFY_BASE}/chat-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Send feedback failed: ${res.status}`)
}

// ── Feedback Admin API ────────────────────────────────────────

export async function saveFeedbackToDB(payload: FeedbackPayload): Promise<void> {
  const res = await fetch('/api/feedbacks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: payload.conversationId,
      message_id: payload.messageId,
      user_id: payload.userId,
      rating: payload.rating,
      content: payload.content,
    }),
  })
  if (!res.ok) throw new Error(`Save feedback failed: ${res.status}`)
}

export interface FeedbackGroup {
  conversation_id: string
  feedback_count: string
  last_feedback_at: string
  user_id: string
  like_count: string
  dislike_count: string
}

export async function fetchFeedbackList(page = 1, limit = 20, token: string, rating?: 'like' | 'dislike'): Promise<{ data: FeedbackGroup[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (rating) params.set('rating', rating)
  const res = await fetch(`/api/feedbacks?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Fetch feedbacks failed: ${res.status}`)
  return res.json()
}

export interface FeedbackStats {
  totalFeedbacks: number
  totalConversations: number
  likeCount: number
  dislikeCount: number
  nullRatingCount: number
  withContentCount: number
  recentWeekCount: number
  todayCount: number
  totalUsers: number
  dailyTrend: { date: string; count: string }[]
}

export async function fetchFeedbackStats(token: string): Promise<FeedbackStats> {
  const res = await fetch('/api/feedbacks/stats', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Fetch feedback stats failed: ${res.status}`)
  const json = await res.json()
  return json.data
}

export interface FeedbackRecord {
  id: number
  conversation_id: string
  message_id: string | null
  user_id: string
  rating: 'like' | 'dislike' | null
  content: string | null
  created_at: string
}

export async function fetchFeedbacksByConversation(conversationId: string, token: string): Promise<FeedbackRecord[]> {
  const res = await fetch(`/api/feedbacks/conversation/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Fetch conversation feedbacks failed: ${res.status}`)
  const data = await res.json()
  return data.data
}

export interface DifyMessage {
  id: string
  query: string
  answer: string
  created_at: number
}

export async function fetchAdminConversationMessages(conversationId: string, userId: string, token: string): Promise<DifyMessage[]> {
  const res = await fetch(`/api/admin/conversation-messages/${conversationId}?user_id=${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Fetch admin messages failed: ${res.status}`)
  const data = await res.json()
  return data.data || []
}

export async function uploadFile(file: File, userId: string = DEFAULT_USER_ID): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('user', userId)

  const res = await fetch(`${DIFY_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`Upload file failed: ${res.status}`)
  const data = await res.json()
  return data.id
}
