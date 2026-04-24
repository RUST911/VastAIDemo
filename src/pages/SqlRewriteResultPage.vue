<template>
  <div class="page-wrapper">
    <AppHeader />
    <main class="page-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="min-h-[60vh] flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-20 w-20 border-8 border-primary/20 border-t-primary mb-8"></div>
        <h2 class="text-2xl font-bold text-gray-800 mb-3">正在进行SQL智能改写中</h2>
        <p class="text-gray-500">AI正在分析SQL语法、优化执行计划，请稍候...</p>
        <p class="text-sm text-gray-400 mt-4">执行可能需要较长时间，请勿关闭页面</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="errorMessage" class="min-h-[60vh] flex flex-col items-center justify-center">
        <div class="rounded-full h-20 w-20 bg-red-100 flex items-center justify-center mb-8">
          <i class="fa fa-exclamation-triangle text-4xl text-red-500"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-3">执行出错</h2>
        <p class="text-gray-500 text-center max-w-md">{{ errorMessage }}</p>
        <button class="btn-primary mt-8" @click="goBack">
          <i class="fa fa-arrow-left mr-2"></i>
          返回重新提交
        </button>
      </div>

      <!-- 结果状态 -->
      <div v-else>
        <section class="hero">
          <div class="hero-badge">
            <i class="fa fa-check-circle"></i>
            <span>改写完成 · 共处理 {{ result.total }} 条SQL</span>
          </div>
          <h1 class="hero-title">SQL 智能改写结果</h1>
          <p class="hero-desc">
            成功 {{ result.success }} 条，失败 {{ result.failed }} 条，改写成功率 {{ successRate }}%
          </p>
        </section>

        <!-- 概览卡片 -->
        <div class="card p-6 mb-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="section-title">
              <i class="fa fa-bar-chart"></i>智能改写概览
            </h2>
            <button class="btn-primary" @click="exportSqlFile">
              <i class="fa fa-download mr-2"></i>
              导出.SQL文件
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              class="rounded-xl p-6 text-center transition-all duration-300 cursor-pointer"
              :class="filterStatus === 'all' ? 'bg-blue-100 border-2 border-blue-400 shadow-md' : 'bg-blue-50 border border-blue-100 hover:shadow-lg hover:border-blue-300'"
              @click="setFilter('all')"
            >
              <div class="text-4xl font-bold text-blue-600 mb-2">{{ result.total }}</div>
              <div class="text-sm text-gray-600">总SQL数</div>
            </div>
            <div
              class="rounded-xl p-6 text-center transition-all duration-300 cursor-pointer"
              :class="filterStatus === 'success' ? 'bg-green-100 border-2 border-green-400 shadow-md' : 'bg-green-50 border border-green-100 hover:shadow-lg hover:border-green-300'"
              @click="setFilter('success')"
            >
              <div class="text-4xl font-bold text-green-600 mb-2">{{ result.success }}</div>
              <div class="text-sm text-gray-600">改写成功</div>
            </div>
            <div
              class="rounded-xl p-6 text-center transition-all duration-300 cursor-pointer"
              :class="filterStatus === 'failed' ? 'bg-red-100 border-2 border-red-400 shadow-md' : 'bg-red-50 border border-red-100 hover:shadow-lg hover:border-red-300'"
              @click="setFilter('failed')"
            >
              <div class="text-4xl font-bold text-red-600 mb-2">{{ result.failed }}</div>
              <div class="text-sm text-gray-600">改写失败</div>
            </div>
          </div>
        </div>

        <!-- 改写结果列表 -->
        <div class="space-y-6 mb-10">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="card p-6"
            :class="{
              'bg-green-50/30 border-green-200': item.status === 'success',
              'bg-red-50/30 border-red-200': item.status === 'failed'
            }"
          >
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center gap-2">
                <span
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-700': item.status === 'success',
                    'bg-red-100 text-red-700': item.status === 'failed'
                  }"
                >
                  <i :class="item.status === 'success' ? 'fa fa-check' : 'fa fa-times'" class="mr-1"></i>
                  {{ item.status === 'success' ? '改写成功' : '改写失败' }}
                </span>
                <span class="text-sm text-gray-500">#{{ item.id }} 对象：{{ item.originalSql }}</span>
              </div>
              <button
                class="text-sm text-primary hover:underline flex items-center gap-1"
                @click="rewriteSingle(item.id)"
              >
                <i class="fa fa-refresh"></i>
                重新改写
              </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- 原始SQL -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">原始SQL</label>
                <textarea
                  v-model="item.srcDdl"
                  class="w-full h-32 p-3 rounded-lg border border-gray-200 font-mono text-sm bg-white resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                ></textarea>
              </div>

              <!-- 错误/问题SQL -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ item.status === 'success' ? '问题SQL' : '改写后DDL' }}
                </label>
                <textarea
                  v-model="item.errorSql"
                  class="w-full h-32 p-3 rounded-lg border border-gray-200 font-mono text-sm bg-white resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  :class="item.status === 'failed' ? 'border-red-300 text-red-700' : ''"
                ></textarea>
              </div>

              <!-- 改写后SQL（成功才显示） -->
              <div v-if="item.status === 'success'">
                <label class="block text-sm font-medium text-gray-700 mb-2">改写后SQL</label>
                <textarea
                  v-model="item.rewrittenSql"
                  class="w-full h-32 p-3 rounded-lg border border-gray-200 font-mono text-sm bg-white resize-none border-green-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                ></textarea>
              </div>

              <!-- 改写详情/失败原因 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ item.status === 'success' ? '改写详情' : '失败原因' }}
                </label>
                <div
                  class="w-full h-32 p-3 rounded-lg border border-gray-200 bg-white text-sm overflow-y-auto"
                  :class="item.status === 'success' ? 'border-blue-200' : 'border-red-300'"
                  v-html="item.status === 'success' ? item.description : item.failedReason"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <button class="btn-primary" @click="goBack">
            <i class="fa fa-arrow-left mr-2"></i>
            返回重新提交
          </button>
          <button class="btn-primary" @click="exportSqlFile">
            <i class="fa fa-download mr-2"></i>
            导出全部结果
          </button>
        </div>
      </div>
    </main>
    <AppFooter />

    <!-- 返回顶部按钮 -->
    <button
      v-show="showBackToTop"
      @click="scrollToTop"
      class="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all duration-300 flex items-center justify-center z-50"
      :class="{ 'opacity-0 pointer-events-none': !showBackToTop }"
    >
      <i class="fa fa-arrow-up text-lg"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const estimatedTime = ref(0)
const errorMessage = ref('')
const pollingInterval = ref<number | null>(null)

const WORKFLOW_STATUS_URL = 'http://172.16.105.101:3001/v1/workflows/run'
const AUTHORIZATION_TOKEN = 'app-jSVG7BEZfVmC1AkdITGbqK1J'

interface RewriteItem {
  id: number
  status: 'success' | 'failed'
  originalSql: string
  srcDdl: string
  errorSql: string
  rewrittenSql?: string
  description?: string
  failedReason?: string
}

const result = ref<{
  total: number
  success: number
  failed: number
  items: RewriteItem[]
}>({
  total: 0,
  success: 0,
  failed: 0,
  items: [],
})

const filterStatus = ref<'all' | 'success' | 'failed'>('all')
const showBackToTop = ref(false)

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const successRate = computed(() => {
  if (result.value.total === 0) return 0
  return ((result.value.success / result.value.total) * 100).toFixed(1)
})

const filteredItems = computed(() => {
  if (filterStatus.value === 'all') return result.value.items
  return result.value.items.filter(item => item.status === filterStatus.value)
})

const setFilter = (status: 'all' | 'success' | 'failed') => {
  filterStatus.value = status
}

/**
 * 轮询工作流状态
 */
const pollWorkflowStatus = async (taskId: string) => {
  try {
    const response = await fetch(`${WORKFLOW_STATUS_URL}/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${AUTHORIZATION_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error(`查询失败: ${response.status}`)
    }

    const data = await response.json()

    // 检查执行状态
    if (data.status === 'succeeded' || data.status === 'stopped') {
      // 执行成功或被停止，都返回已有结果
      loading.value = false
      stopPolling()
      parseWorkflowResult(data.outputs)
    } else if (data.status === 'failed') {
      // 执行失败
      loading.value = false
      stopPolling()
      errorMessage.value = data.error || '工作流执行失败'
    }
    // 如果还在 running，继续轮询
  } catch (err) {
    errorMessage.value = `查询失败: ${err}`
    loading.value = false
    stopPolling()
  }
}

/**
 * 解析工作流输出结果
 */
const parseWorkflowResult = (outputs: any) => {
  if (!outputs) {
    errorMessage.value = '工作流返回结果为空'
    return
  }

  // outputs.text 是被 ```json 包裹的字符串，需要解析
  let text = outputs.text || outputs
  if (typeof text === 'string') {
    // 去掉 ```json 和 ``` 包裹
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    try {
      text = JSON.parse(text)
    } catch {
      errorMessage.value = '结果格式解析失败'
      return
    }
  }

  // 现在 text 应该是数组格式
  const items = Array.isArray(text) ? text : []

  if (items.length === 0) {
    errorMessage.value = '工作流返回结果为空'
    return
  }

  result.value = {
    total: items.length,
    success: items.filter((i: any) => i.result === 'PASS').length,
    failed: items.filter((i: any) => i.result === 'FAIL').length,
    items: items.map((item: any, index: number) => {
      const isSuccess = item.result === 'PASS'

      // 解析 issues 为可读字符串
      let issuesText = ''
      if (item.issues) {
        if (Array.isArray(item.issues)) {
          // 数组格式
          issuesText = item.issues.map((issue: any) => {
            if (typeof issue === 'string') return issue
            return `[${issue.type || 'ERROR'}] ${issue.detail || JSON.stringify(issue)}`
          }).join('\n\n')
        } else if (typeof item.issues === 'object') {
          // 单个对象格式
          const issue = item.issues
          issuesText = `[${issue.type || 'ERROR'}] ${issue.detail || JSON.stringify(issue)}`
        } else if (typeof item.issues === 'string') {
          issuesText = item.issues
        }
      }

      // 解析 rules 为可读字符串，每个规则单独一行（过滤掉 key == value 的规则）
      let rulesText = ''
      if (item.rules) {
        let rulesArr: [string, string][] = []

        if (typeof item.rules === 'string') {
          // 格式: JSON字符串 "{\"is\": \"as\", \"procedure\": \"procedure\", ...}"
          try {
            const obj = JSON.parse(item.rules)
            rulesArr = Object.entries(obj)
          } catch (e) {
            // 忽略解析错误
          }
        } else if (typeof item.rules === 'object') {
          rulesArr = Object.entries(item.rules)
        }

        // 过滤 key == value (不区分大小写)
        const filtered = rulesArr.filter(([k, v]) => k.toLowerCase() !== v.toLowerCase())

        rulesText = filtered
          .map(([k, v]) => `${k} → ${v}`)
          .join('<br>')
      }

      const desc = isSuccess && rulesText ? rulesText : ''

      return {
        id: index + 1,
        status: isSuccess ? 'success' : 'failed',
        originalSql: item.schema ? `${item.schema}.${item.objname}` : item.objname,  // 标题用
        srcDdl: item.srcddl || '',  // 原始SQL内容用
        errorSql: item.tgtddl || '',
        rewrittenSql: item.tarddl || '',
        description: desc,
        failedReason: issuesText ? `<p>${issuesText.replace(/\n/g, '</p><p>')}</p>` : '',
      }
    }),
  }
}

/**
 * 开始轮询
 */
const startPolling = (taskId: string) => {
  // 立即查询一次
  pollWorkflowStatus(taskId)
  // 每 5 秒轮询一次
  pollingInterval.value = window.setInterval(() => {
    pollWorkflowStatus(taskId)
  }, 5000)
}

/**
 * 停止轮询
 */
const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  const taskId = route.query.taskId as string

  if (!taskId) {
    errorMessage.value = '缺少 taskId 参数'
    loading.value = false
    return
  }

  // 开始轮询
  startPolling(taskId)
})

onUnmounted(() => {
  stopPolling()
  window.removeEventListener('scroll', handleScroll)
})

const goBack = () => {
  router.push({ name: 'sqlRewrite' })
}

const exportSqlFile = () => {
  // 只导出改写成功的 tarddl
  const successItems = result.value.items.filter(item => item.status === 'success' && item.rewrittenSql)
  if (successItems.length === 0) {
    alert('没有可导出的改写成功记录')
    return
  }

  let content = '-- SQL智能改写结果（仅改写成功）\n'
  content += `-- 生成时间: ${new Date().toLocaleString()}\n`
  content += `-- 成功条数: ${successItems.length}\n\n`

  successItems.forEach(item => {
    content += `-- =============================================\n`
    content += `-- ${item.originalSql}\n`
    content += `-- =============================================\n`
    content += `${item.rewrittenSql}\n\n`
  })

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sql_rewrite_result_${Date.now()}.sql`
  a.click()
  URL.revokeObjectURL(url)
}

const rewriteSingle = (id: number) => {
  console.log('重新改写SQL:', id)
  alert('重新改写功能开发中，即将调用接口重新改写该条SQL')
}
</script>

<style scoped>
.section-title {
  @apply font-bold flex items-center gap-3 text-xl text-gray-800;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
