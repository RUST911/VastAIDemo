import type { ChatMessage, Conversation } from '@/types'
import { formatDate } from './index'

/**
 * 导出对话报告为Markdown格式
 * @param messages 聊天消息列表
 * @param conversation 对话信息
 * @returns Markdown格式的字符串
 */
export function exportConversationToMarkdown(
  messages: ChatMessage[],
  conversation?: Conversation
): string {
  const title = conversation?.title || '对话分析报告'
  const date = new Date()
  const formattedDate = formatDate(date.getTime())
  
  let md = `# ${title}\n\n`
  md += `**生成时间**: ${formattedDate}\n\n`
  
  if (conversation) {
    md += `**对话ID**: ${conversation.id}\n`
    md += `**创建时间**: ${formatDate(new Date(conversation.createdAt).getTime())}\n`
    md += `**最后更新**: ${formatDate(new Date(conversation.updatedAt).getTime())}\n\n`
  }
  
  md += `---\n\n`
  
  // 统计信息
  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  
  md += `## 对话概览\n\n`
  md += `- **总消息数**: ${messages.length} 条\n`
  md += `- **用户提问**: ${userMessages.length} 条\n`
  md += `- **助手回复**: ${assistantMessages.length} 条\n\n`
  
  md += `---\n\n`
  
  // 对话内容
  md += `## 对话详情\n\n`
  
  messages.forEach((msg, index) => {
    const time = formatDate(msg.timestamp)
    const role = msg.role === 'user' ? '👤 用户' : '🤖 助手'
    
    md += `### ${role} · ${time}\n\n`
    
    // 处理思考过程
    if (msg.role === 'assistant' && msg.thinkContent) {
      md += `#### 思考过程\n\n`
      md += `${msg.thinkContent}\n\n`
    }
    
    // 处理前置内容
    if (msg.role === 'assistant' && msg.beforeThink) {
      md += `${msg.beforeThink}\n\n`
    }
    
    // 处理主内容
    if (msg.content) {
      // 清理Markdown中的特殊字符
      const cleanContent = msg.content
        .replace(/```/g, '```')
        .replace(/`/g, '`')
      
      md += `${cleanContent}\n\n`
    }
    
    // 处理附件
    if (msg.files && msg.files.length > 0) {
      md += `**附件**:\n`
      msg.files.forEach(file => {
        md += `- ${file.name}\n`
      })
      md += `\n`
    }
    
    // 处理工单数据
    if (msg.ticketData) {
      md += `#### 工单信息\n\n`
      md += `\`\`\`json\n${JSON.stringify(msg.ticketData, null, 2)}\n\`\`\`\n\n`
    }
    
    // 处理工作流节点
    if (msg.workflowNodes && msg.workflowNodes.length > 0) {
      md += `#### 工作流执行\n\n`
      msg.workflowNodes.forEach(node => {
        const statusIcon = node.status === 'succeeded' ? '✅' : 
                          node.status === 'failed' ? '❌' : '⏳'
        md += `- ${statusIcon} **${node.title}** (${node.nodeType})\n`
        if (node.elapsedTime) {
          md += `  - 耗时: ${node.elapsedTime}ms\n`
        }
        if (node.totalTokens) {
          md += `  - 令牌数: ${node.totalTokens}\n`
        }
      })
      md += `\n`
    }
    
    md += `---\n\n`
  })
  
  // 分析总结
  md += `## 分析总结\n\n`
  
  if (assistantMessages.length > 0) {
    const lastAssistant = assistantMessages[assistantMessages.length - 1]
    md += `### 最后一次分析结论\n\n`
    md += `${lastAssistant.content}\n\n`
    
    if (lastAssistant.thinkContent) {
      md += `### 分析思路\n\n`
      md += `${lastAssistant.thinkContent}\n\n`
    }
  }
  
  // 建议和后续步骤
  md += `## 建议与后续步骤\n\n`
  md += `1. **问题解决**: 根据上述分析，确认问题是否已解决\n`
  md += `2. **验证方案**: 在测试环境中验证建议的解决方案\n`
  md += `3. **监控效果**: 实施后监控系统性能和稳定性\n`
  md += `4. **文档更新**: 如有必要，更新相关技术文档\n\n`
  
  md += `---\n\n`
  md += `*报告由 Vastbase 智能助手生成*\n`
  
  return md
}

/**
 * 下载Markdown文件
 * @param content Markdown内容
 * @param filename 文件名
 */
export function downloadMarkdownFile(content: string, filename: string = 'vastbase-analysis-report.md'): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 导出当前对话为Markdown文件
 * @param messages 聊天消息
 * @param conversation 对话信息
 */
export function exportCurrentConversation(
  messages: ChatMessage[],
  conversation?: Conversation
): void {
  if (messages.length === 0) {
    alert('当前没有对话内容可导出')
    return
  }
  
  const mdContent = exportConversationToMarkdown(messages, conversation)
  const filename = conversation 
    ? `vastbase-analysis-${conversation.id.slice(0, 8)}.md`
    : 'vastbase-analysis-report.md'
  
  downloadMarkdownFile(mdContent, filename)
}