<template>
  <AppHeader />
  <main class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-bold text-primary">智能运维监控模块</h1>
      </div>
      <div class="flex gap-3 items-center">
        <select v-model="timeRange" class="appearance-none bg-gray-100 text-gray-700 px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option v-for="opt in timeRangeOptions" :key="opt">{{ opt }}</option>
        </select>
        <button class="btn-primary">
          <i class="fa fa-refresh mr-2"></i>刷新数据
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="stat-card">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-semibold text-gray-700">CPU使用率</h3>
          <span class="text-warning text-sm px-2 py-1 rounded-full bg-amber-100">偏高</span>
        </div>
        <div class="flex items-end justify-between flex-grow">
          <span class="text-3xl font-bold text-dark">68%</span>
          <div class="w-16 h-16 relative"><canvas ref="cpuChartRef"></canvas></div>
        </div>
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-warning"><i class="fa fa-arrow-up"></i> 12%</span> 较昨日同期
        </div>
      </div>
      <div class="stat-card">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-semibold text-gray-700">内存使用率</h3>
          <span class="text-danger text-sm px-2 py-1 rounded-full bg-red-100">告警</span>
        </div>
        <div class="flex items-end justify-between flex-grow">
          <div>
            <span class="text-3xl font-bold text-dark">89%</span>
            <p class="text-xs text-gray-500">15.2/16.0 GB</p>
          </div>
          <div class="w-16 h-16 relative"><canvas ref="memChartRef"></canvas></div>
        </div>
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-danger"><i class="fa fa-arrow-up"></i> 23%</span> 较昨日同期
        </div>
      </div>
      <div class="stat-card">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-semibold text-gray-700">磁盘使用率</h3>
          <span class="text-info text-sm px-2 py-1 rounded-full bg-gray-100">正常</span>
        </div>
        <div class="flex items-end justify-between flex-grow">
          <div>
            <span class="text-3xl font-bold text-dark">42%</span>
            <p class="text-xs text-gray-500">210/500 GB</p>
          </div>
          <div class="w-16 h-16 relative"><canvas ref="diskChartRef"></canvas></div>
        </div>
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-success"><i class="fa fa-arrow-down"></i> 5%</span> 较昨日同期
        </div>
      </div>
      <div class="stat-card">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-semibold text-gray-700">数据库QPS</h3>
          <span class="text-warning text-sm px-2 py-1 rounded-full bg-amber-100">峰值</span>
        </div>
        <div class="flex items-end justify-between flex-grow">
          <span class="text-3xl font-bold text-dark">18,542</span>
          <div class="text-right">
            <p class="text-xs text-gray-500">峰值: 22,890</p>
            <p class="text-xs text-gray-500">谷值: 3,210</p>
          </div>
        </div>
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-warning"><i class="fa fa-arrow-up"></i> 38%</span> 较昨日同期
        </div>
      </div>
    </div>

    <div class="card mb-8">
      <h2 class="text-xl font-bold mb-6 flex items-center">
        <i class="fa fa-line-chart text-primary mr-2"></i>系统资源监控曲线
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold mb-4 text-gray-700">CPU & 内存使用率 (24小时)</h3>
          <div class="h-80"><canvas ref="resourceChartRef"></canvas></div>
        </div>
        <div>
          <h3 class="font-semibold mb-4 text-gray-700">磁盘IO & 网络流量 (24小时)</h3>
          <div class="h-80"><canvas ref="ioChartRef"></canvas></div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div class="card">
        <h2 class="text-xl font-bold mb-4 flex items-center">
          <i class="fa fa-bar-chart text-primary mr-2"></i>磁盘容量预测
        </h2>
        <div class="h-72"><canvas ref="predictChartRef"></canvas></div>
        <div class="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div class="flex items-start">
            <i class="fa fa-lightbulb-o text-primary mt-1 mr-2"></i>
            <div>
              <p class="font-medium text-primary">容量预警</p>
              <p class="text-sm text-gray-700 mt-1">基于近30天的磁盘使用趋势分析，/data分区将在<span class="font-bold text-danger">15天后</span>达到85%的阈值（当前42%），建议提前规划扩容至1TB。</p>
              <button class="mt-2 text-primary text-sm font-medium hover:underline">
                <i class="fa fa-download mr-1"></i>导出详细预测报告
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="text-xl font-bold mb-4 flex items-center">
          <i class="fa fa-trophy text-primary mr-2"></i>性能TOP排行
        </h2>
        <div class="space-y-6">
          <div>
            <h3 class="font-semibold mb-3 text-gray-700 flex items-center">
              <i class="fa fa-hourglass-half text-warning mr-2"></i>慢SQL TOP5
            </h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排名</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SQLID</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">执行耗时(ms)</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">执行次数</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200 text-sm">
                  <tr v-for="sql in slowSqls" :key="sql.rank" class="hover:bg-gray-50">
                    <td class="px-3 py-2 whitespace-nowrap font-medium">{{ sql.rank }}</td>
                    <td class="px-3 py-2 whitespace-nowrap">{{ sql.id }}</td>
                    <td class="px-3 py-2 whitespace-nowrap" :class="sql.time > 5000 ? 'text-danger' : 'text-warning'">{{ sql.time.toLocaleString() }}</td>
                    <td class="px-3 py-2 whitespace-nowrap">{{ sql.count.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 class="font-semibold mb-3 text-gray-700 flex items-center">
              <i class="fa fa-plug text-primary mr-2"></i>数据库连接数TOP5
            </h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">应用</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前连接数</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最大连接数</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用率</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200 text-sm">
                  <tr v-for="conn in connectionStats" :key="conn.app" class="hover:bg-gray-50">
                    <td class="px-3 py-2 whitespace-nowrap font-medium">{{ conn.app }}</td>
                    <td class="px-3 py-2 whitespace-nowrap">{{ conn.current }}</td>
                    <td class="px-3 py-2 whitespace-nowrap">{{ conn.max }}</td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full" :class="conn.barColor" :style="{ width: conn.percent + '%' }"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-8">
      <h2 class="text-xl font-bold mb-4 flex items-center">
        <i class="fa fa-bell text-primary mr-2"></i>智能告警与根因分析
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <h3 class="font-semibold mb-3 text-gray-700">最近告警 (已降噪聚合)</h3>
          <div class="space-y-1 max-h-96 overflow-y-auto pr-2">
            <div v-for="alert in alerts" :key="alert.title" class="alert-item" :class="alert.alertClass">
              <i class="fa mt-1 mr-3" :class="[alert.icon, alert.iconColor]"></i>
              <div class="flex-1">
                <div class="flex justify-between">
                  <h4 class="font-medium" :class="alert.titleColor">{{ alert.title }}</h4>
                  <span class="text-xs text-gray-500">{{ alert.time }}</span>
                </div>
                <p class="text-sm text-gray-700 mt-1">{{ alert.desc }}</p>
                <div v-if="alert.buttons.length" class="mt-2 flex gap-2">
                  <button
                    v-for="btn in alert.buttons"
                    :key="btn.text"
                    class="text-xs px-3 py-1 rounded transition-colors"
                    :class="btn.cls"
                  >
                    <i class="fa mr-1" :class="btn.icon"></i>{{ btn.text }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 class="font-semibold mb-3 text-gray-700">智能根因分析</h3>
          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 h-96 overflow-y-auto">
            <div class="mb-4 pb-4 border-b border-gray-200">
              <h4 class="font-medium text-primary mb-2">内存使用率过高 根因分析</h4>
              <div class="text-sm space-y-2 text-gray-700">
                <p><strong>主要原因：</strong></p>
                <ol class="list-decimal list-inside pl-2 space-y-1">
                  <li>订单系统慢SQL (SQL98765) 执行时间过长，导致结果集缓存占用大量内存</li>
                  <li>数据库连接数过高 (896个活跃连接)，每个连接占用约15MB内存</li>
                  <li>InnoDB缓冲池设置过大 (10GB)，导致系统可用内存不足</li>
                </ol>
                <p class="mt-2"><strong>解决方案：</strong></p>
                <ul class="list-disc list-inside pl-2 space-y-1">
                  <li>优化慢SQL (SQL98765)，添加合适索引减少执行时间</li>
                  <li>调整订单系统连接池参数，最大连接数从1000降至800</li>
                  <li>临时调整InnoDB缓冲池至8GB，观察内存使用情况</li>
                  <li>开启数据库内存自动清理机制，定期释放缓存</li>
                </ul>
                <p class="mt-2"><strong>自动修复建议：</strong></p>
                <button class="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 transition-colors mt-2">
                  <i class="fa fa-wrench mr-1"></i>执行自动修复
                </button>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-primary mb-2">告警降噪统计</h4>
              <div class="text-sm space-y-3 text-gray-700">
                <div class="flex justify-between items-center">
                  <span>原始告警数量</span>
                  <span class="font-medium">128</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>聚合后告警数量</span>
                  <span class="font-medium text-success">5</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>降噪率</span>
                  <span class="font-medium text-success">96.1%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div class="bg-success h-2 rounded-full" style="width: 96.1%"></div>
                </div>
                <p class="mt-3 text-xs text-gray-500">
                  <i class="fa fa-info-circle mr-1"></i> 基于机器学习算法，将同一根因产生的123个衍生告警聚合为5个核心告警，有效避免告警风暴
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 class="text-xl font-bold mb-4 flex items-center">
        <i class="fa fa-link text-primary mr-2"></i>分布式链路追踪
      </h2>
      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex items-center">
            <label class="mr-2 text-sm font-medium text-gray-700">Trace ID:</label>
            <input v-model="traceId" type="text" class="px-3 py-1 border border-gray-300 rounded-lg text-sm w-48" />
          </div>
          <div class="flex items-center">
            <label class="mr-2 text-sm font-medium text-gray-700">耗时:</label>
            <span class="text-danger font-medium text-sm">8.9s</span>
          </div>
          <div class="flex items-center">
            <label class="mr-2 text-sm font-medium text-gray-700">状态:</label>
            <span class="text-danger text-sm px-2 py-0.5 rounded-full bg-red-100">异常</span>
          </div>
          <button class="ml-auto btn-primary text-sm px-4 py-1">
            <i class="fa fa-search mr-1"></i>搜索
          </button>
        </div>
      </div>
      <div class="relative h-64 border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div class="absolute top-1/2 left-4 right-4 -translate-y-1/2 flex items-center justify-between">
          <div v-for="node in traceNodes" :key="node.name" class="text-center w-24">
            <div class="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2" :class="node.bgColor">
              <i class="fa text-xl" :class="[node.icon, node.iconColor]"></i>
            </div>
            <h4 class="text-sm font-medium">{{ node.name }}</h4>
            <p class="text-xs" :class="node.timeDanger ? 'text-danger font-medium' : 'text-gray-500'">{{ node.time }}</p>
          </div>
        </div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-danger text-white text-xs px-3 py-1 rounded-full">
          性能瓶颈
        </div>
      </div>
      <div class="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
        <div class="flex items-start">
          <i class="fa fa-exclamation-circle text-danger mt-1 mr-2"></i>
          <div>
            <p class="font-medium text-danger">链路分析结果</p>
            <p class="text-sm text-gray-700 mt-1">订单创建接口响应时间8.9秒，主要耗时在数据库查询阶段(8.2秒)。定位到具体慢SQL: <span class="font-mono text-xs bg-white px-1 rounded">SELECT * FROM orders WHERE user_id = ?</span>，缺少user_id索引导致全表扫描。</p>
            <button class="mt-2 text-primary text-sm font-medium hover:underline">
              <i class="fa fa-code mr-1"></i>查看完整SQL与优化建议
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
  <AppFooter />
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

Chart.register(...registerables)

const timeRange = ref('最近24小时')
const timeRangeOptions = ['最近1小时', '最近6小时', '最近24小时', '最近7天', '最近30天']
const traceId = ref('TR-8976543210')

const cpuChartRef = ref<HTMLCanvasElement>()
const memChartRef = ref<HTMLCanvasElement>()
const diskChartRef = ref<HTMLCanvasElement>()
const resourceChartRef = ref<HTMLCanvasElement>()
const ioChartRef = ref<HTMLCanvasElement>()
const predictChartRef = ref<HTMLCanvasElement>()
const charts: Chart[] = []

const slowSqls = [
  { rank: 1, id: 'SQL98765', time: 8945, count: 1258 },
  { rank: 2, id: 'SQL98764', time: 6782, count: 892 },
  { rank: 3, id: 'SQL98763', time: 4521, count: 1567 },
  { rank: 4, id: 'SQL98762', time: 3876, count: 987 },
  { rank: 5, id: 'SQL98761', time: 2987, count: 2145 },
]

const connectionStats = [
  { app: '订单系统', current: 896, max: 1000, percent: 89.6, barColor: 'bg-danger' },
  { app: '用户中心', current: 754, max: 1000, percent: 75.4, barColor: 'bg-warning' },
  { app: '支付系统', current: 587, max: 1000, percent: 58.7, barColor: 'bg-primary' },
  { app: '库存系统', current: 423, max: 1000, percent: 42.3, barColor: 'bg-primary' },
  { app: '日志系统', current: 289, max: 1000, percent: 28.9, barColor: 'bg-success' },
]

interface AlertBtn { text: string; icon: string; cls: string }
interface Alert {
  title: string; desc: string; time: string; alertClass: string
  icon: string; iconColor: string; titleColor: string; buttons: AlertBtn[]
}

const alerts: Alert[] = [
  {
    title: '内存使用率过高', desc: '数据库服务器内存使用率持续超过85%达5分钟，当前使用率89% (15.2/16GB)', time: '10分钟前',
    alertClass: 'alert-danger', icon: 'fa-exclamation-circle', iconColor: 'text-danger', titleColor: 'text-danger',
    buttons: [
      { text: '根因分析', icon: 'fa-search', cls: 'bg-danger/10 text-danger hover:bg-danger/20' },
      { text: '已处理', icon: 'fa-check', cls: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
      { text: '屏蔽', icon: 'fa-bell-slash', cls: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
    ],
  },
  {
    title: '订单系统连接数过高', desc: '订单系统数据库连接数达到896/1000，使用率89.6%，存在连接池耗尽风险', time: '25分钟前',
    alertClass: 'alert-warning', icon: 'fa-exclamation-triangle', iconColor: 'text-warning', titleColor: 'text-warning',
    buttons: [
      { text: '根因分析', icon: 'fa-search', cls: 'bg-warning/10 text-warning hover:bg-warning/20' },
      { text: '已处理', icon: 'fa-check', cls: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
    ],
  },
  {
    title: '慢SQL检测', desc: '检测到新的慢SQL (SQLID: SQL98765)，平均执行耗时8.9秒，已自动记录并分析', time: '1小时前',
    alertClass: 'alert-info', icon: 'fa-info-circle', iconColor: 'text-info', titleColor: 'text-info',
    buttons: [
      { text: '优化建议', icon: 'fa-search', cls: 'bg-info/10 text-info hover:bg-info/20' },
    ],
  },
  {
    title: '磁盘IO恢复正常', desc: '磁盘IO使用率已从95%降至正常水平(45%)，告警已自动清除', time: '2小时前',
    alertClass: 'alert-success', icon: 'fa-check-circle', iconColor: 'text-success', titleColor: 'text-success',
    buttons: [],
  },
  {
    title: '磁盘容量预测告警', desc: '基于趋势分析，/data分区将在15天后达到85%阈值，建议提前扩容', time: '1天前',
    alertClass: 'alert-warning', icon: 'fa-calendar', iconColor: 'text-warning', titleColor: 'text-warning',
    buttons: [
      { text: '容量规划报告', icon: 'fa-download', cls: 'bg-warning/10 text-warning hover:bg-warning/20' },
    ],
  },
]

const traceNodes = [
  { name: '前端页面', time: '50ms', icon: 'fa-desktop', iconColor: 'text-primary', bgColor: 'bg-blue-50', timeDanger: false },
  { name: 'API网关', time: '120ms', icon: 'fa-exchange', iconColor: 'text-primary', bgColor: 'bg-blue-50', timeDanger: false },
  { name: '订单服务', time: '8.5s', icon: 'fa-shopping-cart', iconColor: 'text-danger', bgColor: 'bg-red-50', timeDanger: true },
  { name: '数据库', time: '8.2s', icon: 'fa-database', iconColor: 'text-danger', bgColor: 'bg-red-50', timeDanger: true },
]

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
const cpuData = [35, 32, 30, 28, 31, 35, 45, 55, 60, 65, 70, 75, 78, 75, 70, 68, 72, 75, 70, 65, 60, 55, 48, 40]
const memData = [70, 72, 71, 70, 73, 75, 78, 80, 82, 85, 88, 90, 92, 90, 89, 88, 89, 90, 88, 87, 85, 83, 80, 78]
const diskRead = [100, 120, 90, 80, 110, 150, 200, 250, 300, 280, 250, 300, 350, 320, 280, 250, 220, 200, 180, 150, 130, 110, 90, 80]
const diskWrite = [80, 90, 70, 60, 80, 120, 180, 220, 250, 230, 200, 250, 300, 280, 240, 200, 180, 160, 140, 120, 100, 80, 70, 60]
const networkIn = [50, 60, 55, 50, 65, 80, 100, 120, 150, 140, 130, 160, 180, 170, 150, 130, 110, 100, 90, 80, 70, 60, 55, 50]
const networkOut = [30, 40, 35, 30, 45, 60, 80, 90, 110, 100, 90, 110, 130, 120, 110, 90, 80, 70, 60, 50, 40, 35, 30, 25]

function createDoughnut(canvas: HTMLCanvasElement, value: number, color: string) {
  charts.push(new Chart(canvas, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [value, 100 - value],
        backgroundColor: [color, '#f3f4f6'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '80%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    },
  }))
}

function initCharts() {
  if (cpuChartRef.value) createDoughnut(cpuChartRef.value, 68, '#FF7D00')
  if (memChartRef.value) createDoughnut(memChartRef.value, 89, '#F53F3F')
  if (diskChartRef.value) createDoughnut(diskChartRef.value, 42, '#165DFF')

  if (resourceChartRef.value) {
    charts.push(new Chart(resourceChartRef.value, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          { label: 'CPU使用率 (%)', data: cpuData, borderColor: '#FF7D00', backgroundColor: 'rgba(255,125,0,0.1)', fill: true, tension: 0.4 },
          { label: '内存使用率 (%)', data: memData, borderColor: '#F53F3F', backgroundColor: 'rgba(245,63,63,0.1)', fill: true, tension: 0.4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' as const }, tooltip: { mode: 'index', intersect: false } },
        scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: '使用率 (%)' } }, x: { title: { display: true, text: '时间' } } },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
      },
    }))
  }

  if (ioChartRef.value) {
    charts.push(new Chart(ioChartRef.value, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          { label: '磁盘读 (MB/s)', data: diskRead, borderColor: '#165DFF', backgroundColor: 'transparent', tension: 0.4 },
          { label: '磁盘写 (MB/s)', data: diskWrite, borderColor: '#4080FF', backgroundColor: 'transparent', tension: 0.4 },
          { label: '网络入 (MB/s)', data: networkIn, borderColor: '#00B42A', backgroundColor: 'transparent', tension: 0.4 },
          { label: '网络出 (MB/s)', data: networkOut, borderColor: '#86909C', backgroundColor: 'transparent', tension: 0.4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' as const } },
        scales: { y: { beginAtZero: true, title: { display: true, text: '速度 (MB/s)' } }, x: { title: { display: true, text: '时间' } } },
      },
    }))
  }

  if (predictChartRef.value) {
    const actualData = Array.from({ length: 30 }, (_, i) => 30 + (i * 0.4))
    const predictData = Array.from({ length: 15 }, (_, i) => 42 + (i * 1.53))
    const allData = [...actualData, ...predictData]
    const days = Array.from({ length: 45 }, (_, i) => `Day ${i + 1}`)
    charts.push(new Chart(predictChartRef.value, {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          { label: '磁盘使用率 (%)', data: allData, borderColor: '#165DFF', backgroundColor: 'rgba(22,93,255,0.1)', fill: true, tension: 0.4 },
          { label: '预警阈值 (85%)', data: Array(45).fill(85), borderColor: '#F53F3F', borderDash: [5, 5], backgroundColor: 'transparent', fill: false, tension: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' as const } },
        scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: '磁盘使用率 (%)' } }, x: { title: { display: true, text: '天数' } } },
      },
    }))
  }
}

nextTick(() => initCharts())

onBeforeUnmount(() => {
  charts.forEach(c => c.destroy())
})
</script>
