export interface DifyChatRequest {
  inputs: Record<string, unknown>
  query: string
  response_mode: 'streaming' | 'blocking'
  user: string
  conversation_id?: string
  files?: DifyFile[]
}

export interface DifyFile {
  type: 'image' | 'document'
  transfer_method: 'remote_url' | 'local_file'
  url?: string
  upload_file_id?: string
}

export interface DifySSEEvent {
  event: string
  conversation_id?: string
  message_id?: string
  answer?: string
  delta?: string
  finish_reason?: string | null
  metadata?: Record<string, unknown>
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  loading?: boolean
  files?: { name: string }[]
}

export interface MvsSubmitRequest {
  [key: string]: unknown
}

export interface MvsSubmitResponse {
  success: boolean
  message: string
  sessionId: string
  conversationId: string
  redirectUrl: string
}

export interface ChartConfig {
  type: string
  data: Record<string, unknown>
  options?: Record<string, unknown>
}

export interface NavItem {
  label: string
  target: string
  route?: string
}

export interface FeatureItem {
  title: string
  description: string
}

export interface ModuleConfig {
  id: string
  icon: string
  title: string
  description: string
  features: FeatureItem[]
  route: string
  linkText: string
}
