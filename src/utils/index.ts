export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen) + '...'
}

export function sanitizeJsonString(str: string): string {
  const escapeMap: Record<string, string> = {
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\b': '\\b',
    '\f': '\\f',
  }
  let result = ''
  let inString = false
  let i = 0
  while (i < str.length) {
    const ch = str[i]
    if (inString) {
      if (ch === '\\') {
        result += ch + str[i + 1]
        i += 2
        continue
      }
      if (ch === '"') {
        inString = false
        result += ch
        i++
        continue
      }
      if (ch.charCodeAt(0) < 0x20) {
        result += escapeMap[ch] || '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')
        i++
        continue
      }
      result += ch
      i++
    } else {
      if (ch === '"') inString = true
      result += ch
      i++
    }
  }
  return result
}

export function optimizeJsonForMarkdown(jsonStr: string): string {
  return jsonStr.replace(/~(\d{1,2}:\d{2})/g, '～$1')
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as any
}
export * from './exportReport'