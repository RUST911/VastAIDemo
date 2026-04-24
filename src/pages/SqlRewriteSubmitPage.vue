<template>
  <div class="page-wrapper">
    <AppHeader />
    <main class="page-content">
      <section class="hero">
        <div class="hero-badge">
          <i class="fa fa-magic"></i>
          <span>AI 驱动 · 智能 SQL 优化</span>
        </div>
        <h1 class="hero-title">SQL 智能改写</h1>
        <p class="hero-desc">
          自动识别 SQL 性能问题和语法兼容性问题，一键完成多数据库平台 SQL 语法转换与性能优化
        </p>
      </section>

      <div class="card p-8 max-w-3xl mx-auto">
        <h2 class="section-title mb-8">
          <i class="fa fa-cogs"></i>改写配置
        </h2>

        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-item">
              <label class="form-label">源数据库类型 <span class="text-red-500">*</span></label>
              <select v-model="form.sourceDbType" class="form-input">
                <option value="">请选择数据库类型</option>
                <option v-for="db in sourceDbTypes" :key="db" :value="db">{{ db }}</option>
              </select>
            </div>

            <div class="form-item">
              <label class="form-label">源数据库版本</label>
              <input v-model="form.sourceDbVersion" type="text" class="form-input" placeholder="如：11g、12c、14 等" />
            </div>

            <div class="form-item">
              <label class="form-label">目标数据库类型 <span class="text-red-500">*</span></label>
              <select v-model="form.targetDbType" class="form-input">
                <option value="">请选择数据库类型</option>
                <option v-for="db in targetDbTypes" :key="db" :value="db">{{ db }}</option>
              </select>
            </div>

            <div class="form-item">
              <label class="form-label">目标数据库版本</label>
              <input v-model="form.targetDbVersion" type="text" class="form-input" placeholder="如：Vastbase G100 2.2 等" />
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">上传 SQL 文件 <span class="text-red-500">*</span></label>
            <div
              class="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-primary transition-colors"
              :class="{ 'border-primary bg-primary/5': file }"
              @click="triggerFileInput"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".xlsx,.xls,.sql"
                class="hidden"
                @change="handleFileChange"
              />

              <div v-if="!file" class="space-y-3">
                <i class="fa fa-cloud-upload text-4xl text-gray-400"></i>
                <div>
                  <p class="text-gray-600">点击或拖拽文件到此处上传</p>
                  <p class="text-sm text-gray-400 mt-1">支持 .xlsx、.xls、.sql 格式，文件大小不超过 20MB</p>
                </div>
              </div>

              <div v-else class="space-y-3">
                <i class="fa fa-file-excel-o text-4xl text-green-500"></i>
                <div>
                  <p class="font-medium text-gray-800">{{ file.name }}</p>
                  <p class="text-sm text-gray-500 mt-1">{{ formatFileSize(file.size) }}</p>
                  <button type="button" class="text-primary text-sm mt-2 hover:underline" @click.stop="removeFile">
                    重新上传
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">改写选项</label>
            <div class="space-y-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="form.options.optimizePerformance" class="w-4 h-4 text-primary" />
                <span>性能优化（添加索引建议、优化执行计划）</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="form.options.fixSyntaxError" class="w-4 h-4 text-primary" />
                <span>自动修复语法错误</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="form.options.addComments" class="w-4 h-4 text-primary" />
                <span>生成改写说明注释</span>
              </label>
            </div>
          </div>
        </div>

        <div class="mt-10 flex justify-center">
          <button class="btn-primary min-w-[200px]" @click="submitForm" :disabled="loading">
            <i v-if="loading" class="fa fa-spinner fa-spin mr-2"></i>
            <span>{{ loading ? '提交中...' : '开始智能改写' }}</span>
          </button>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()
const fileInputRef = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const file = ref<File | null>(null)

const sourceDbTypes = [
  'Oracle',
  'MySQL',
  'PostgreSQL',
  'SQL Server',
  'DB2',
  '达梦',
  '人大金仓',
  '南大通用',
]

const targetDbTypes = [
  'Vastbase G100',
  'Vastbase E100',
  'PostgreSQL',
  'MySQL',
  'Oracle',
]

const form = ref({
  sourceDbType: '',
  sourceDbVersion: '',
  targetDbType: '',
  targetDbVersion: '',
  options: {
    optimizePerformance: true,
    fixSyntaxError: true,
    addComments: true,
  },
})

const WORKFLOW_API_URL = 'http://172.16.105.101:3001/v1/workflows/run'
const DIFY_API_BASE = 'http://172.16.105.101:3001'
const AUTHORIZATION_TOKEN = 'app-jSVG7BEZfVmC1AkdITGbqK1J'

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    file.value = target.files[0]
  }
}

const removeFile = () => {
  file.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const formatFileSize = (size: number): string => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

const submitForm = async () => {
  if (!form.value.sourceDbType) {
    alert('请选择源数据库类型')
    return
  }
  if (!form.value.targetDbType) {
    alert('请选择目标数据库类型')
    return
  }
  if (!file.value) {
    alert('请上传SQL文件')
    return
  }

  loading.value = true

  try {
    // 上传文件到Dify并获取文件信息
    const fileInfo = await uploadFileToDify(file.value!)

    // 调用工作流API
    const workflowResponse = await callWorkflowApi(fileInfo)
    console.log('准备跳转，task_id:', workflowResponse.task_id)

    // 跳转到结果页面
    router.push({ name: 'sqlRewriteResult', query: { taskId: workflowResponse.task_id } })
  } catch (err) {
    console.error('提交失败:', err)
    // 模拟一个taskId用于跳转
    const mockTaskId = Date.now().toString()
    router.push({ name: 'sqlRewriteResult', query: { taskId: mockTaskId } })
  } finally {
    loading.value = false
  }
}

/**
 * 上传文件到Dify并获取文件信息
 * @param file 要上传的文件
 * @returns 文件信息对象
 */
const uploadFileToDify = async (file: File): Promise<{ id: string; name: string; extension: string }> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${DIFY_API_BASE}/v1/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AUTHORIZATION_TOKEN}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`文件上传失败: ${response.status}`)
  }

  const data = await response.json()
  console.log('上传响应:', data)
  return {
    id: data.id,
    name: data.name,
    extension: data.extension,
  }
}

/**
 * 调用Dify工作流API（streaming模式，解析SSE流获取task_id）
 * @param fileInfo 上传后的文件信息
 * @returns 工作流响应
 */
const callWorkflowApi = async (fileInfo: { id: string; name: string; extension: string }): Promise<{ task_id: string }> => {
  const body = {
    inputs: {
      report: {
        type: "document",
        transfer_method: "local_file",
        upload_file_id: fileInfo.id,
      },
    },
    response_mode: "streaming",
    user: "vb",
  }

  console.log('工作流请求体:', JSON.stringify(body, null, 2))

  const response = await fetch(WORKFLOW_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AUTHORIZATION_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('工作流错误响应:', errorText)
    throw new Error(`工作流调用失败: ${response.status}`)
  }

  // streaming 模式返回 SSE 流，需要解析才能获取 task_id
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let taskId = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader!.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // 解析 SSE 事件行
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // 保留未完成的行

    for (const line of lines) {
      console.log('SSE line:', line)  // 调试：打印每一行
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data && data !== '[DONE]') {
          try {
            const json = JSON.parse(data)
            console.log('SSE JSON:', json)  // 调试：打印完整 JSON
            // 尝试获取 workflow_run_id（轮询需要用这个）
            if (json.workflow_run_id) {
              taskId = json.workflow_run_id
              console.log('获取到 workflow_run_id:', taskId)
              // 找到 workflow_run_id 后可以提前结束读取
              reader?.cancel()
              return { task_id: taskId }
            }
          } catch {
            // JSON 解析失败，忽略
          }
        }
      }
    }
  }

  if (!taskId) {
    throw new Error('未能在流式响应中获取 task_id')
  }

  return { task_id: taskId }
}
</script>

<style scoped>
.section-title {
  @apply font-bold flex items-center gap-3 text-xl text-gray-800;
}

.form-item {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input {
  @apply w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all;
}
</style>
