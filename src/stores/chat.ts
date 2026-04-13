import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage, Conversation } from '@/types'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref('')
  const sidebarOpen = ref(false)

  function addMessage(msg: ChatMessage) {
    messages.value.push(msg)
  }

  function updateLastAssistant(content: string) {
    const last = messages.value.filter((m) => m.role === 'assistant').pop()
    if (last) last.content = content
  }

  function setMessages(msgs: ChatMessage[]) {
    messages.value = msgs
  }

  function clearMessages() {
    messages.value = []
  }

  function setConversationId(id: string) {
    currentConversationId.value = id
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setConversations(list: Conversation[]) {
    conversations.value = list
  }

  function reset() {
    messages.value = []
    currentConversationId.value = ''
  }

  return {
    messages,
    conversations,
    currentConversationId,
    sidebarOpen,
    addMessage,
    updateLastAssistant,
    setMessages,
    clearMessages,
    setConversationId,
    toggleSidebar,
    setConversations,
    reset,
  }
})
