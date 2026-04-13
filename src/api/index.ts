import type { DifyChatRequest, DifySSEEvent, MvsSubmitRequest, MvsSubmitResponse } from '@/types'

const DIFY_BASE = '/api/dify/v1'
const DIFY_USER_ID = 'mvs-user'

export async function* streamChatMessage(
  query: string,
  conversationId?: string,
  files?: DifyChatRequest['files'],
  signal?: AbortSignal,
): AsyncGenerator<DifySSEEvent> {
  const body: DifyChatRequest = {
    inputs: {},
    query,
    response_mode: 'streaming',
    user: DIFY_USER_ID,
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

export async function fetchConversationMessages(conversationId: string): Promise<unknown[]> {
  const res = await fetch(
    `${DIFY_BASE}/messages?conversation_id=${conversationId}&user=${DIFY_USER_ID}&limit=100`,
  )
  if (!res.ok) throw new Error(`Fetch messages failed: ${res.status}`)
  const data = await res.json()
  return data.data || []
}

export async function fetchConversations(): Promise<unknown[]> {
  const res = await fetch(`${DIFY_BASE}/conversations?user=${DIFY_USER_ID}&limit=100&sort_by=-updated_at`)
  if (!res.ok) throw new Error(`Fetch conversations failed: ${res.status}`)
  const data = await res.json()
  return data.data || []
}

export async function renameConversation(conversationId: string, name: string): Promise<void> {
  const res = await fetch(`${DIFY_BASE}/conversations/${conversationId}/name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, user: DIFY_USER_ID }),
  })
  if (!res.ok) throw new Error(`Rename conversation failed: ${res.status}`)
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const res = await fetch(`${DIFY_BASE}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: DIFY_USER_ID }),
  })
  if (!res.ok) throw new Error(`Delete conversation failed: ${res.status}`)
}

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('user', DIFY_USER_ID)

  const res = await fetch(`${DIFY_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`Upload file failed: ${res.status}`)
  const data = await res.json()
  return data.id
}

export async function submitMvsTicket(data: MvsSubmitRequest): Promise<MvsSubmitResponse> {
  const res = await fetch('/api/mvs/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`MVS submit failed: ${res.status}`)
  return res.json()
}
