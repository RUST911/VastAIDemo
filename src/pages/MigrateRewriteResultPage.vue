<template>
  <div class="page-wrapper">
    <AppHeader />
    <main class="page-content">
      <!-- 加载状态 -->
      <div v-if="rewriteLoading || rewritePolling" class="min-h-[60vh] flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-20 w-20 border-8 border-primary/20 border-t-primary mb-8"></div>
        <h2 class="text-2xl font-bold text-gray-800 mb-3">
          {{ rewriteLoading ? '正在提交任务...' : '正在进行SQL智能改写中' }}
        </h2>
        <p class="text-gray-500">
          {{ rewriteLoading ? '正在上传文件并启动改写任务，请稍候...' : 'AI正在分析SQL语法、优化执行计划，请稍候...' }}
        </p>
        <p class="text-sm text-gray-400 mt-4">执行可能需要较长时间，请勿关闭页面</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="rewriteErrorMessage" class="min-h-[60vh] flex flex-col items-center justify-center">
        <div class="rounded-full h-20 w-20 bg-red-100 flex items-center justify-center mb-6">
          <i class="fa fa-exclamation-triangle text-4xl text-red-500"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-3">执行出错</h2>
        <p class="text-gray-500 text-center max-w-md mb-6">{{ rewriteErrorMessage }}</p>
        <button class="btn-primary" @click="goBack">
          <i class="fa fa-arrow-left mr-2"></i>返回重新提交
        </button>
      </div>

      <!-- 结果状态 -->
      <div v-else-if="showRewriteResult">
        <!-- 概览卡片 -->
        <div class="card p-6 mb-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="section-title">
              <i class="fa fa-bar-chart"></i>智能改写概览
            </h2>
            <button class="btn-primary" @click="exportRewriteSqlFile">
              <i class="fa fa-download mr-2"></i>
              导出.SQL文件
            </button>
          </div>

          <!-- 成功率进度条 -->
          <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600">改写成功率</span>
              <span class="text-sm font-medium" :class="[
                Number(rewriteSuccessRate) >= 80 ? 'text-green-600' :
                Number(rewriteSuccessRate) >= 60 ? 'text-yellow-600' :
                'text-red-600'
              ]">{{ rewriteSuccessRate }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                class="h-full transition-all duration-500"
                :class="[
                  Number(rewriteSuccessRate) >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  Number(rewriteSuccessRate) >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                  'bg-gradient-to-r from-red-400 to-red-600'
                ]"
                :style="{ width: `${rewriteSuccessRate}%` }"
              ></div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              class="rounded-xl p-6 text-center transition-all duration-300 cursor-pointer"
              :class="rewriteFilterStatus === 'all' ? 'bg-blue-100 border-2 border-blue-400 shadow-md' : 'bg-blue-50 border border-blue-100 hover:shadow-lg hover:border-blue-300'"
              @click="setRewriteFilter('all')"
            >
              <div class="text-4xl font-bold text-blue-600 mb-2">{{ rewriteResult.total }}</div>
              <div class="text-sm text-gray-600">总SQL数</div>
            </div>
            <div
              class="rounded-xl p-6 text-center transition-all duration-300 cursor-pointer"
              :class="rewriteFilterStatus === 'success' ? 'bg-green-100 border-2 border-green-400 shadow-md' : 'bg-green-50 border border-green-100 hover:shadow-lg hover:border-green-300'"
              @click="setRewriteFilter('success')"
            >
              <div class="text-4xl font-bold text-green-600 mb-2">{{ rewriteResult.success }}</div>
              <div class="text-sm text-gray-600">改写成功</div>
            </div>
            <div
              class="rounded-xl p-6 text-center transition-all duration-300 cursor-pointer"
              :class="rewriteFilterStatus === 'failed' ? 'bg-red-100 border-2 border-red-400 shadow-md' : 'bg-red-50 border border-red-100 hover:shadow-lg hover:border-red-300'"
              @click="setRewriteFilter('failed')"
            >
              <div class="text-4xl font-bold text-red-600 mb-2">{{ rewriteResult.failed }}</div>
              <div class="text-sm text-gray-600">改写失败</div>
            </div>
          </div>
        </div>

        <!-- 改写结果列表 -->
        <div class="space-y-6 mb-10">
          <div
            v-for="item in paginatedItems"
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

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">原始SQL</label>
                <textarea
                  v-model="item.srcDdl"
                  class="w-full h-36 p-2 rounded-lg border border-gray-200 font-mono text-sm bg-white resize-none focus:outline-none focus:border-primary"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  {{ item.status === 'success' ? '问题SQL' : '改写后SQL' }}
                </label>
                <textarea
                  v-if="item.status === 'success'"
                  v-model="item.errorSql"
                  class="w-full h-36 p-2 rounded-lg border border-orange-300 font-mono text-sm bg-orange-50 resize-none focus:outline-none focus:border-primary"
                ></textarea>
                <textarea
                  v-else
                  v-model="item.errorSql"
                  class="w-full h-36 p-2 rounded-lg border border-red-300 font-mono text-sm bg-white resize-none focus:outline-none focus:border-primary"
                ></textarea>
              </div>
              <div v-if="item.status === 'success'">
                <label class="block text-sm font-medium text-gray-700 mb-2">改写后SQL</label>
                <textarea
                  v-model="item.rewrittenSql"
                  class="w-full h-36 p-2 rounded-lg border border-green-300 font-mono text-sm bg-green-50 resize-none focus:outline-none focus:border-primary"
                ></textarea>
              </div>
              <div v-if="item.status === 'success'">
                <label class="block text-sm font-medium text-gray-700 mb-2">改写详情</label>
                <div
                  class="w-full h-36 p-2 rounded-lg border border-blue-200 bg-blue-50 text-sm overflow-y-auto"
                  v-html="item.description"
                ></div>
              </div>
              <div v-if="item.status === 'failed'">
                <label class="block text-sm font-medium text-gray-700 mb-2">失败原因</label>
                <div
                  class="w-full h-36 p-2 rounded-lg border border-red-300 bg-red-50 text-sm overflow-y-auto"
                  v-html="item.failedReason"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页组件 -->
        <div v-if="rewriteFilteredItems.length > pageSize" class="flex justify-center items-center gap-4 mb-10">
          <button
            class="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <i class="fa fa-angle-left text-gray-600"></i>
            <span class="text-sm text-gray-600">上一页</span>
          </button>
          <span class="text-sm text-gray-600 px-4">
            第 {{ currentPage }} / {{ totalPages }} 页，共 {{ rewriteFilteredItems.length }} 条
          </span>
          <button
            class="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <span class="text-sm text-gray-600">下一页</span>
            <i class="fa fa-angle-right text-gray-600"></i>
          </button>
        </div>

        <div class="flex justify-center gap-4 mb-8">
          <button class="btn-primary" @click="goBack">
            <i class="fa fa-arrow-left mr-2"></i>
            返回重新提交
          </button>
          <button 
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 cursor-pointer border-0 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            style="background: linear-gradient(135deg, #10b981, #059669);"
            @click="showTestSection = !showTestSection"
          >
            <i :class="showTestSection ? 'fa fa-caret-up' : 'fa fa-caret-down'"></i>
            <i class="fa fa-flask"></i>
            <span>{{ showTestSection ? '隐藏' : '展开' }}智能测试用例生成与回归验证</span>
          </button>
          <button class="btn-primary" @click="exportRewriteSqlFile">
            <i class="fa fa-download mr-2"></i>
            导出全部结果
          </button>
        </div>

        <!-- 智能测试用例生成与回归验证模块 -->
        <div v-if="showTestSection" class="card p-6 mb-6">
          <h2 class="section-title mb-6">
            <i class="fa fa-vial"></i>智能测试用例生成与回归验证
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 class="font-semibold mb-3 text-gray-800">测试用例生成范围</h3>
              <div class="space-y-2 text-sm">
                <label v-for="opt in testScopeOptions" :key="opt.label" class="flex items-center">
                  <input type="checkbox" v-model="opt.checked" class="mr-2" />
                  <span>{{ opt.label }}</span>
                </label>
              </div>
              <button class="btn-primary w-full mt-4 py-2" @click="callTestCaseWorkflow" :disabled="testWorkflowLoading">
                <i v-if="testWorkflowLoading" class="fa fa-spinner fa-spin mr-2"></i>
                <i v-else class="fa fa-magic mr-2"></i>
                {{ testWorkflowLoading ? '生成中...' : 'AI生成测试用例' }}
              </button>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 class="font-semibold mb-3 text-gray-800">测试执行配置</h3>
              <div class="space-y-4 text-sm">
                <div class="form-item">
                  <label class="block text-gray-700 mb-1">并发用户数</label>
                  <input v-model.number="testConfig.concurrentUsers" type="number" :min="1" :max="1000" class="form-input" />
                </div>
                <div class="form-item">
                  <label class="block text-gray-700 mb-1">执行时长 (秒)</label>
                  <input v-model.number="testConfig.duration" type="number" :min="60" :max="3600" class="form-input" />
                </div>
                <div>
                  <label class="block text-gray-700 mb-1">校验维度</label>
                  <div class="space-y-1 mt-1">
                    <label v-for="dim in validationDimensions" :key="dim.label" class="flex items-center">
                      <input type="checkbox" v-model="dim.checked" class="mr-2" />
                      <span>{{ dim.label }}</span>
                    </label>
                  </div>
                </div>
                <button
                  class="bg-success text-white w-full mt-4 py-2 rounded-lg hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
                  @click="startRegressionTest"
                >
                  <i v-if="regressionLoading" class="fa fa-spinner fa-spin"></i>
                  <i v-else class="fa fa-play mr-2"></i>
                  {{ regressionLoading ? '执行中...' : '执行回归验证' }}
                </button>
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 class="font-semibold mb-3 text-gray-800">验证进度</h3>
              <div class="flex items-center justify-center h-32">
                <div class="text-center">
                  <div class="text-3xl font-bold text-primary">{{ regressionProgress.percent }}%</div>
                  <div class="text-sm text-gray-600 mt-1">{{ regressionProgress.statusText }}</div>
                </div>
              </div>
              <div class="mt-4 space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>已执行用例数</span>
                  <span class="font-medium">{{ regressionProgress.executedCount || 0 }} / {{ regressionProgress.totalCount || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span>通过用例数</span>
                  <span class="font-medium text-success">{{ regressionProgress.passedCount || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span>失败用例数</span>
                  <span class="font-medium text-danger">{{ regressionProgress.failedCount || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span>平均执行耗时对比</span>
                  <span class="font-medium">{{ regressionProgress.avgTimeDiff || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="mb-6">
            <h3 class="font-semibold mb-4 text-gray-800">生成的测试用例列表</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">ID</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用例名称</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用例类型</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联对象</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">执行状态</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200 text-sm">
                  <tr v-if="testWorkflowLoading">
                    <td colspan="6" class="px-4 py-12 text-center text-gray-500">
                      <i class="fa fa-spinner fa-spin text-xl mb-2"></i>
                      <p>生成用例中...</p>
                    </td>
                  </tr>
                  <tr v-else-if="generatedTestCases.length === 0">
                    <td colspan="6" class="px-4 py-12 text-center text-gray-500">
                      <i class="fa fa-magic text-2xl mb-2"></i>
                      <p>点击上方"AI生成测试用例"按钮继续</p>
                    </td>
                  </tr>
                  <tr v-else v-for="tc in generatedTestCases" :key="tc.id">
                    <td class="px-4 py-3 whitespace-nowrap">{{ tc.id }}</td>
                    <td class="px-4 py-3 whitespace-nowrap">{{ tc.name }}</td>
                    <td class="px-4 py-3 whitespace-nowrap">{{ tc.type }}</td>
                    <td class="px-4 py-3 whitespace-nowrap">{{ tc.table }}</td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <div
                        class="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium border"
                        :class="resultClass(tc.status)"
                      >
                        <i class="fa" :class="resultIcon(tc.status)"></i> {{ tc.statusText }}
                      </div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <button
                        class="text-xs text-primary hover:underline cursor-pointer"
                        @click="showTestCaseDetail(tc)"
                      >{{ getOperationText(tc) }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="selectedTestCase" class="mb-6">
            <h3 class="font-semibold mb-4 text-gray-800">测试用例比对 ({{ selectedTestCase.id }})</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div class="font-medium text-sm mb-2">源库测试用例</div>
                <div class="bg-white rounded p-2 text-xs font-mono h-40 overflow-auto">
                  <pre>{{ selectedTestCase.srcCase }}</pre>
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div class="font-medium text-sm mb-2">目标库测试用例</div>
                <div class="bg-white rounded p-2 text-xs font-mono h-40 overflow-auto">
                  <pre>{{ selectedTestCase.tarCase }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()
const route = useRoute()

const DIFY_API_BASE = import.meta.env.VITE_MIGRATE_DIFY_API_BASE || 'http://172.16.105.101:3001'
const WORKFLOW_API_URL = `${DIFY_API_BASE}/v1/workflows/run`
const SQLREWRITE_AUTHORIZATION_TOKEN = import.meta.env.VITE_SQLREWRITE_AUTHORIZATION_TOKEN || 'app-oIQTTwWLdyjnwPEdHUEQvBgR'

const rewriteLoading = ref(false)
const rewritePolling = ref(false)
const rewriteErrorMessage = ref('')
const rewritePollingInterval = ref<number | null>(null)
const showRewriteResult = ref(false)
const rewriteFilterStatus = ref<'all' | 'success' | 'failed'>('all')

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

const rewriteResult = ref<{
  total: number
  success: number
  failed: number
  output: string
  items: RewriteItem[]
}>({
  total: 0,
  success: 0,
  failed: 0,
  output: '',
  items: [],
})

const rewriteSuccessRate = computed(() => {
  if (rewriteResult.value.total === 0) return 0
  return ((rewriteResult.value.success / rewriteResult.value.total) * 100).toFixed(1)
})

const rewriteFilteredItems = computed(() => {
  if (rewriteFilterStatus.value === 'all') return rewriteResult.value.items
  return rewriteResult.value.items.filter(item => item.status === rewriteFilterStatus.value)
})

const pageSize = 5
const currentPage = ref(1)

const totalPages = computed(() => {
  return Math.ceil(rewriteFilteredItems.value.length / pageSize)
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return rewriteFilteredItems.value.slice(start, end)
})

function setRewriteFilter(status: 'all' | 'success' | 'failed') {
  rewriteFilterStatus.value = status
  currentPage.value = 1
}

// 智能测试用例生成与回归验证相关
const showTestSection = ref(false)
const testWorkflowLoading = ref(false)
const regressionLoading = ref(false)

const testScopeOptions = ref([
  { label: '全量对象覆盖', checked: true },
  { label: '边界值测试', checked: true },
  { label: '异常场景测试', checked: false },
  { label: '基于高频SQL日志生成', checked: true },
])

const testConfig = ref({
  concurrentUsers: 50,
  duration: 300,
})

const validationDimensions = ref([
  { label: '返回结果一致性', checked: true },
  { label: '执行耗时对比', checked: true },
  { label: '数据行数一致性', checked: true },
  { label: '字段值精度校验', checked: true },
])

type TcStatus = 'match' | 'mismatch' | 'running' | 'pending'
interface TestCase {
  id: number
  name: string
  type: string
  table: string
  status: TcStatus
  statusText: string
  opt?: string
  srcCase?: string
  tarCase?: string
}

const generatedTestCases = ref<TestCase[]>([])
const selectedTestCase = ref<TestCase | null>(null)

const regressionProgress = ref({
  percent: 0,
  statusText: '初始化',
  executedCount: 0,
  totalCount: 0,
  passedCount: 0,
  failedCount: 0,
  avgTimeDiff: '',
})

function resultClass(status: TcStatus) {
  if (status === 'match') return 'bg-green-50 text-success border-green-200'
  if (status === 'mismatch') return 'bg-red-50 text-danger border-red-200'
  if (status === 'running') return 'bg-blue-50 text-primary border-blue-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

function resultIcon(status: TcStatus) {
  if (status === 'match') return 'fa-check'
  if (status === 'mismatch') return 'fa-times'
  if (status === 'running') return 'fa-spinner fa-spin'
  return 'fa-clock-o'
}

function getOperationText(tc: TestCase) {
  if (tc.status === 'pending' || tc.status === 'running') {
    return '查看详情'
  }
  if (tc.status === 'mismatch' || tc.statusText === '耗时差异大') {
    return '查看差异'
  }
  return tc.opt || '查看详情'
}

function showTestCaseDetail(tc: TestCase) {
  selectedTestCase.value = tc
}

function callTestCaseWorkflow() {
  testWorkflowLoading.value = true
  // 模拟生成测试用例
  setTimeout(() => {
    testWorkflowLoading.value = false
    generatedTestCases.value = [
      { id: 1, name: '测试用例1', type: '功能测试', table: 'EMP', status: 'match', statusText: '通过' },
      { id: 2, name: '测试用例2', type: '边界测试', table: 'DEPT', status: 'match', statusText: '通过' },
      { id: 3, name: '测试用例3', type: '性能测试', table: 'EMP', status: 'mismatch', statusText: '耗时差异大' },
    ]
  }, 1500)
}

function startRegressionTest() {
  regressionLoading.value = true
  regressionProgress.value.statusText = '执行中'
  // 模拟回归验证
  setTimeout(() => {
    regressionLoading.value = false
    regressionProgress.value = {
      percent: 100,
      statusText: '完成',
      executedCount: 3,
      totalCount: 3,
      passedCount: 2,
      failedCount: 1,
      avgTimeDiff: '+15%',
    }
  }, 2000)
}

function goBack() {
  router.push({ name: 'migrate' })
}

function stopRewritePolling() {
  rewritePolling.value = false
  if (rewritePollingInterval.value) {
    clearInterval(rewritePollingInterval.value)
    rewritePollingInterval.value = null
  }
}

async function pollRewriteWorkflowStatus(taskId: string) {
  try {
    const response = await fetch(`${WORKFLOW_API_URL}/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SQLREWRITE_AUTHORIZATION_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error(`查询失败: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'succeeded' || data.status === 'stopped') {
      rewriteLoading.value = false
      stopRewritePolling()
      parseRewriteResult(data.outputs)
    } else if (data.status === 'failed') {
      rewriteLoading.value = false
      stopRewritePolling()
      rewriteErrorMessage.value = data.error || '工作流执行失败'
    }
  } catch (err) {
    rewriteErrorMessage.value = `查询失败: ${err}`
    rewriteLoading.value = false
    stopRewritePolling()
  }
}

function parseRewriteResult(outputs: any) {
  if (!outputs) {
    rewriteErrorMessage.value = '工作流返回结果为空'
    return
  }

  const rawOutput = typeof outputs.text === 'string' ? outputs.text : JSON.stringify(outputs)
  let text = outputs.text || outputs
  if (typeof text === 'string') {
    // 处理可能包含的代码块标记，并提取有效的JSON数组
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    // 提取第一个完整的JSON数组（从[开始到]结束）
    const arrayMatch = text.match(/\[.*\]/s)
    if (arrayMatch) {
      text = arrayMatch[0]
    }
    try {
      text = JSON.parse(text)
    } catch (e) {
      console.error('JSON解析失败:', e)
      console.error('待解析内容前200字符:', text.substring(0, 200))
      console.error('待解析内容后200字符:', text.substring(text.length - 200))
      rewriteErrorMessage.value = '结果格式解析失败: ' + (e as Error).message
      return
    }
  }

  const items = Array.isArray(text) ? text : []

  if (items.length === 0) {
    rewriteErrorMessage.value = '工作流返回结果为空'
    return
  }

  rewriteResult.value = {
    total: items.length,
    success: items.filter((i: any) => i.status === 'success' || i.result === 'success').length,
    failed: items.filter((i: any) => i.status === 'failed' || i.result === 'failed').length,
    output: rawOutput,
    items: items.map((item: any, index: number) => {
      // 判断成功/失败：优先使用status字段，其次使用result字段
      const isSuccess = item.status === 'success' || item.result === 'success' || item.result === 'PASS'
      
      // 构建失败原因文本
      let failedReasonText = ''
      if (item.issues) {
        if (Array.isArray(item.issues)) {
          failedReasonText = item.issues.map((issue: any) => {
            if (typeof issue === 'string') return issue
            return `[${issue.type || 'ERROR'}] ${issue.detail || JSON.stringify(issue)}`
          }).join('\n\n')
        } else if (typeof item.issues === 'object') {
          const issue = item.issues
          failedReasonText = `[${issue.type || 'ERROR'}] ${issue.detail || JSON.stringify(issue)}`
        } else if (typeof item.issues === 'string') {
          failedReasonText = item.issues
        }
      }
      
      // 如果没有issues但有errmsg，使用errmsg
      if (!failedReasonText && item.errmsg) {
        failedReasonText = item.errmsg
      }

      // 构建改写详情文本
      let descriptionText = ''
      if (item.rules) {
        let rulesArr: [string, string][] = []
        if (typeof item.rules === 'string') {
          try {
            const obj = JSON.parse(item.rules)
            rulesArr = Object.entries(obj)
          } catch (e) {
          }
        } else if (typeof item.rules === 'object') {
          rulesArr = Object.entries(item.rules)
        }
        const filtered = rulesArr.filter(([k, v]) => k.toLowerCase() !== v.toLowerCase())
        descriptionText = filtered.map(([k, v]) => `${k} → ${v}`).join('<br>')
      }
      
      // 如果没有rules，使用其他字段构建描述
      if (!descriptionText && item.objtype) {
        descriptionText = `对象类型: ${item.objtype}`
      }

      return {
        id: index + 1,
        status: isSuccess ? 'success' : 'failed',
        originalSql: item.schema ? `${item.schema}.${item.objname}` : (item.objname || `对象${index + 1}`),
        srcDdl: item.srcddl || item.srcDdl || '',
        errorSql: item.tgtddl || item.tgtDdl || item.errddl || '',
        rewrittenSql: item.tarddl || item.tarDdl || '',
        description: descriptionText,
        failedReason: failedReasonText ? `<p>${failedReasonText.replace(/\n/g, '</p><p>')}</p>` : '',
      }
    }),
  }
}

function exportRewriteSqlFile() {
  const successItems = rewriteResult.value.items.filter(item => item.status === 'success' && item.rewrittenSql)
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

function rewriteSingle(id: number) {
  console.log('重新改写SQL:', id)
  alert('重新改写功能开发中，即将调用接口重新改写该条SQL')
}

onMounted(() => {
  const taskId = route.query.taskId as string
  
  if (taskId) {
    rewriteLoading.value = false
    rewritePolling.value = true
    pollRewriteWorkflowStatus(taskId)
    rewritePollingInterval.value = window.setInterval(() => {
      pollRewriteWorkflowStatus(taskId)
    }, 5000)
  } else {
    rewriteErrorMessage.value = '缺少任务ID参数'
  }
})

onBeforeUnmount(() => {
  stopRewritePolling()
})
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
