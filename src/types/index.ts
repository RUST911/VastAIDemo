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
  task_id?: string
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

export interface WorkflowNode {
  nodeId: string
  nodeType: string
  title: string
  status: 'running' | 'succeeded' | 'failed'
  error?: string
  elapsedTime?: number
  totalTokens?: number
}

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'think'; content: string }

export interface FeedbackData {
  type: 'feedback'
  rating: 'like' | 'dislike' | null
  content: string
  messageId?: string
  conversationId?: string
  userId: string
  timestamp: string
}

export interface MessageFile {
  id: string
  filename: string
  type: 'image' | 'document' | string
  url: string
  mime_type: string
  size?: number
  belongs_to: 'user' | 'assistant'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  loading?: boolean
  files?: { name: string; previewUrl?: string }[]
  messageFiles?: MessageFile[]
  thinkContent?: string
  thinkBlocks?: string[]
  beforeThink?: string
  segments?: MessageSegment[]
  workflowNodes?: WorkflowNode[]
  ticketData?: Record<string, any> | null
  feedbackData?: FeedbackData | null
  messageId?: string
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
