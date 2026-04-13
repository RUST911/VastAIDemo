<template>
  <AppHeader />
  <main class="container mx-auto px-4 py-8">
    <div class="card mb-8">
      <h2 class="text-xl font-bold mb-6 flex items-center">
        <i class="fa fa-database text-primary mr-2"></i>迁移基础信息
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold text-lg mb-4 text-gray-800">源数据库信息</h3>
          <div class="space-y-4">
            <div class="form-item">
              <label class="form-label">数据库类型</label>
              <select v-model="form.sourceType" class="form-input">
                <option v-for="db in dbTypes" :key="db">{{ db }}</option>
              </select>
            </div>
            <div class="form-item">
              <label class="form-label">数据库版本</label>
              <input v-model="form.sourceVersion" type="text" class="form-input" />
            </div>
            <div class="form-item">
              <label class="form-label">服务器配置</label>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">CPU</label>
                  <input v-model="form.sourceCpu" type="text" class="form-input" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">内存</label>
                  <input v-model="form.sourceMemory" type="text" class="form-input" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">磁盘</label>
                  <input v-model="form.sourceDisk" type="text" class="form-input" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">操作系统</label>
                  <input v-model="form.sourceOs" type="text" class="form-input" />
                </div>
              </div>
            </div>
            <div class="form-item">
              <label class="form-label">数据量规模</label>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">总数据量</label>
                  <input v-model="form.sourceDataSize" type="text" class="form-input" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">表数量</label>
                  <input v-model="form.sourceTableCount" type="text" class="form-input" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 class="font-semibold text-lg mb-4 text-gray-800">目标数据库信息</h3>
          <div class="space-y-4">
            <div class="form-item">
              <label class="form-label">数据库类型</label>
              <select v-model="form.targetType" class="form-input">
                <option v-for="db in targetDbTypes" :key="db">{{ db }}</option>
              </select>
            </div>
            <div class="form-item">
              <label class="form-label">数据库版本</label>
              <input v-model="form.targetVersion" type="text" class="form-input" />
            </div>
            <div class="form-item">
              <label class="form-label">服务器配置</label>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">CPU</label>
                  <input v-model="form.targetCpu" type="text" class="form-input" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">内存</label>
                  <input v-model="form.targetMemory" type="text" class="form-input" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">磁盘</label>
                  <input v-model="form.targetDisk" type="text" class="form-input" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">操作系统</label>
                  <input v-model="form.targetOs" type="text" class="form-input" />
                </div>
              </div>
            </div>
            <div class="form-item">
              <label class="form-label">部署模式</label>
              <select v-model="form.deployMode" class="form-input">
                <option v-for="mode in deployModes" :key="mode">{{ mode }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-center">
        <button class="btn-primary px-8 py-3 text-lg" @click="startAssessment">
          <i class="fa fa-refresh mr-2"></i>开始智能评估
        </button>
      </div>
    </div>

    <div v-if="assessed" class="card mb-8">
      <h2 class="text-xl font-bold mb-6 flex items-center">
        <i class="fa fa-cogs text-primary mr-2"></i>数据库配置评估
      </h2>
      <div class="mb-6">
        <h3 class="font-semibold mb-4 text-gray-800">源库资源使用统计（近30天）</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="h-72"><canvas ref="resourceChartRef"></canvas></div>
          <div class="h-72"><canvas ref="iopsChartRef"></canvas></div>
        </div>
      </div>
      <div class="space-y-4">
        <div v-for="item in configAssessments" :key="item.title" class="assessment-card" :class="item.riskClass">
          <div class="flex items-start">
            <i class="fa text-xl mt-1 mr-3" :class="item.icon"></i>
            <div>
              <h4 class="font-medium">{{ item.title }}</h4>
              <p class="text-sm mt-1" v-html="item.description"></p>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-8">
        <h3 class="font-semibold mb-4 text-gray-800">目标库推荐配置清单</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">配置项</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">推荐值</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">推算依据</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 text-sm">
              <tr v-for="row in configTable" :key="row.name">
                <td class="px-4 py-3 font-medium">{{ row.name }}</td>
                <td class="px-4 py-3">{{ row.value }}</td>
                <td class="px-4 py-3">{{ row.basis }}</td>
                <td class="px-4 py-3">{{ row.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="assessed" class="card mb-8">
      <h2 class="text-xl font-bold mb-6 flex items-center">
        <i class="fa fa-exchange text-primary mr-2"></i>数据库兼容性评估
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div v-for="cat in compatCategories" :key="cat.title" class="assessment-card">
          <h3 class="font-semibold mb-3 flex items-center">
            <i class="fa mr-2" :class="cat.icon" style="color: #165DFF"></i>{{ cat.title }}
          </h3>
          <div class="space-y-3 text-sm">
            <div v-for="level in cat.levels" :key="level.label" class="p-2 rounded" :class="level.class">
              <div class="font-medium">{{ level.label }}</div>
              <ul class="list-disc list-inside pl-2 mt-1">
                <li v-for="item in level.items" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-6">
        <h3 class="font-semibold mb-4 text-gray-800">兼容性问题清单与修复建议</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">风险等级</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">问题描述</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">影响范围</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">修复建议</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 text-sm">
              <tr v-for="issue in compatIssues" :key="issue.desc">
                <td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-xs" :class="issue.badgeClass">{{ issue.level }}</span></td>
                <td class="px-4 py-3">{{ issue.desc }}</td>
                <td class="px-4 py-3">{{ issue.scope }}</td>
                <td class="px-4 py-3">{{ issue.fix }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 class="font-semibold mb-4 text-gray-800">自动修复脚本示例</h3>
        <div class="bg-gray-900 text-gray-300 p-4 rounded-md font-mono text-xs overflow-x-auto">
          <pre>{{ fixScript }}</pre>
        </div>
      </div>
    </div>

    <div v-if="assessed" class="card mb-8">
      <h2 class="text-xl font-bold mb-6 flex items-center">
        <i class="fa fa-puzzle-piece text-primary mr-2"></i>应用框架评估
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="assessment-card">
          <h3 class="font-semibold mb-4 text-gray-800">应用改造复杂度评级</h3>
          <div class="flex items-center justify-center h-48">
            <div class="relative w-40 h-40">
              <canvas ref="complexityChartRef"></canvas>
              <div class="absolute inset-0 flex items-center justify-center flex-col">
                <span class="text-2xl font-bold text-warning">中</span>
                <span class="text-xs text-gray-600">改造复杂度</span>
              </div>
            </div>
          </div>
          <div class="text-sm text-center mt-2">
            <p>整体改造复杂度：<span class="font-medium text-warning">中等</span></p>
            <p class="mt-1">预计改造工作量：60人天</p>
          </div>
        </div>
        <div class="assessment-card">
          <h3 class="font-semibold mb-4 text-gray-800">应用风险点分析</h3>
          <div class="space-y-3 text-sm">
            <div v-for="risk in appRisks" :key="risk.title" class="p-3 rounded" :class="risk.class">
              <div class="font-medium flex items-center">
                <i class="fa mr-2" :class="risk.icon"></i>{{ risk.title }}
              </div>
              <p class="mt-1">{{ risk.description }}</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 class="font-semibold mb-4 text-gray-800">应用改造建议</h3>
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <ol class="list-decimal list-inside pl-2 space-y-2 text-sm">
            <li v-for="(sug, idx) in appSuggestions" :key="idx"><strong>{{ sug.title }}</strong>：{{ sug.detail }}</li>
          </ol>
        </div>
      </div>
    </div>

    <div v-if="assessed" class="card mb-8">
      <h2 class="text-xl font-bold mb-6 flex items-center">
        <i class="fa fa-calculator text-primary mr-2"></i>迁移工作量评估
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold mb-3 text-gray-800">人天估算</h3>
          <div class="space-y-2 text-sm">
            <div v-for="item in workloadItems" :key="item.label" class="flex justify-between pb-1 border-b border-gray-200">
              <span>{{ item.label }}</span>
              <span class="font-medium">{{ item.days }}人天</span>
            </div>
            <div class="flex justify-between font-bold pt-1">
              <span>总计</span>
              <span>{{ totalWorkload }}人天</span>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold mb-3 text-gray-800">迁移周期预测</h3>
          <div class="h-40"><canvas ref="timelineChartRef"></canvas></div>
          <div class="text-center text-sm mt-2">
            <p>总周期：<span class="font-medium">12周</span> (80人天/5人团队)</p>
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold mb-3 text-gray-800">成本模型</h3>
          <div class="space-y-2 text-sm">
            <div v-for="item in costItems" :key="item.label" class="flex justify-between pb-1 border-b border-gray-200">
              <span>{{ item.label }}</span>
              <span class="font-medium">¥{{ item.cost.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between font-bold pt-1">
              <span>总成本</span>
              <span>¥{{ totalCost.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-8 text-center">
        <button class="btn-primary px-8 py-3 text-lg">
          <i class="fa fa-file-text-o mr-2"></i>一键生成完整迁移评估报告
        </button>
        <p class="text-sm text-gray-500 mt-2">报告包含：评估详情、风险清单、改造方案、成本预算、实施计划</p>
      </div>
    </div>
  </main>
  <AppFooter />
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

Chart.register(...registerables)

const dbTypes = ['Oracle 19c', 'MySQL 8.0', 'SQL Server 2019', 'PostgreSQL 14', 'vastbase', '达梦 8', '人大金仓']
const targetDbTypes = ['Oracle 19c', 'MySQL 8.0', 'SQL Server 2019', 'PostgreSQL 14', 'vastbase', '人大金仓']
const deployModes = ['单机部署', '主从部署', '集群部署', '云原生部署']

const form = reactive({
  sourceType: 'Oracle 19c',
  sourceVersion: '19.3.0.0.0',
  sourceCpu: '16核',
  sourceMemory: '64GB',
  sourceDisk: '2TB SSD',
  sourceOs: 'RedHat 7.9',
  sourceDataSize: '800GB',
  sourceTableCount: '1,256张',
  targetType: 'vastbase',
  targetVersion: '8.1.2.48',
  targetCpu: '32核',
  targetMemory: '128GB',
  targetDisk: '4TB SSD',
  targetOs: 'CentOS 7.9',
  deployMode: '单机部署',
})

const assessed = ref(false)
const resourceChartRef = ref<HTMLCanvasElement>()
const iopsChartRef = ref<HTMLCanvasElement>()
const complexityChartRef = ref<HTMLCanvasElement>()
const timelineChartRef = ref<HTMLCanvasElement>()
const charts: Chart[] = []

const configAssessments = [
  { title: 'CPU配置评估', description: '源库CPU峰值使用率65%（16核），目标库配置32核，CPU资源充足，建议配置CPU亲和性优化性能。', riskClass: 'risk-low', icon: 'fa-check-circle' },
  { title: '内存配置评估', description: '源库内存峰值使用率85%（64GB），目标库配置128GB，内存资源充足，建议将缓存池配置为80GB。', riskClass: 'risk-low', icon: 'fa-check-circle' },
  { title: '存储配置评估', description: '源库已使用800GB，目标库配置4TB存储，基础容量充足，但<span class="font-medium">建议增加20%冗余</span>（约1.6TB），考虑数据增长和备份需求。', riskClass: 'risk-medium', icon: 'fa-exclamation-triangle' },
  { title: 'IOPS配置评估', description: '源库IOPS峰值8000，目标库SSD理论IOPS 20000，但实际测试仅达到12000，<span class="font-medium">建议优化存储阵列配置</span>，确保满足业务高峰期IO需求。', riskClass: 'risk-medium', icon: 'fa-exclamation-triangle' },
]

const configTable = [
  { name: 'innodb_buffer_pool_size', value: '80GB', basis: '源库内存使用率85%，目标库128GB × 70%', note: 'vastbase对应BUFFER_POOL_SIZE' },
  { name: 'max_connections', value: '2000', basis: '源库峰值连接数1200 × 1.5倍冗余', note: 'vastbase对应MAX_SESSIONS' },
  { name: '日志文件大小', value: '2GB × 4', basis: '源库日志切换频率每小时2次', note: 'vastbase对应REDOLF_SIZE' },
  { name: '临时表空间', value: '100GB', basis: '源库最大临时表大小80GB', note: '需开启自动扩展' },
  { name: '字符集', value: 'UTF8MB4', basis: '源库使用AL32UTF8，兼容UTF8MB4', note: '统一字符集避免乱码' },
]

const compatCategories = [
  {
    title: '语法兼容性', icon: 'fa-code',
    levels: [
      { label: '高风险 (15项)', class: 'risk-high p-2 rounded', items: ['CONNECT BY 层级查询语法', 'ROWID 伪列使用', '自定义聚合函数'] },
      { label: '中风险 (32项)', class: 'risk-medium p-2 rounded', items: ['日期函数 SYSDATE/NOW()', '分页查询 ROWNUM/LIMIT', '正则表达式函数'] },
      { label: '低风险 (89项)', class: 'risk-low p-2 rounded', items: ['基本DML语句', '简单查询语句', '常用聚合函数'] },
    ],
  },
  {
    title: '数据类型兼容性', icon: 'fa-table',
    levels: [
      { label: '中风险 (8项)', class: 'risk-medium p-2 rounded', items: ['NUMBER 精度差异', 'DATE/TIMESTAMP 精度', 'CLOB/BLOB 处理方式'] },
      { label: '低风险 (12项)', class: 'risk-low p-2 rounded', items: ['VARCHAR2/VARCHAR 长度', 'INT/INTEGER 类型映射', 'FLOAT/DOUBLE 精度'] },
      { label: '无风险 (25项)', class: 'bg-green-50 text-success p-2 rounded', items: ['基础数据类型完全兼容'] },
    ],
  },
  {
    title: '存储过程/函数兼容性', icon: 'fa-file-code-o',
    levels: [
      { label: '高风险 (18项)', class: 'risk-high p-2 rounded', items: ['PL/SQL 包结构', '触发器语法差异', '包(PACKAGE)结构'] },
      { label: '中风险 (45项)', class: 'risk-medium p-2 rounded', items: ['自定义数据类型', '动态SQL执行', '事务控制语句'] },
      { label: '建议重写', class: 'bg-yellow-50 text-warning p-2 rounded', items: ['复杂存储过程建议业务层实现'] },
    ],
  },
]

const compatIssues = [
  { level: '高风险', desc: 'CONNECT BY 层级查询语法不兼容', scope: '12个核心业务SQL', fix: '替换为WITH RECURSIVE递归查询', badgeClass: 'risk-high' },
  { level: '高风险', desc: 'PL/SQL存储过程包结构不支持', scope: '23个核心业务包', fix: '拆分为独立存储过程，业务层封装', badgeClass: 'risk-high' },
  { level: '中风险', desc: 'SYSDATE函数返回值差异', scope: '89个SQL语句', fix: '替换为CURRENT_TIMESTAMP()函数', badgeClass: 'risk-medium' },
  { level: '中风险', desc: 'NUMBER类型精度丢失', scope: '35张核心业务表', fix: '使用DECIMAL(38,10)替代', badgeClass: 'risk-medium' },
  { level: '低风险', desc: 'ROWNUM分页语法差异', scope: '45个查询接口', fix: '替换为LIMIT/OFFSET语法', badgeClass: 'risk-low' },
]

const fixScript = `-- Oracle 原SQL
SELECT empno, ename, mgr
FROM emp
START WITH mgr IS NULL
CONNECT BY PRIOR empno = mgr;

-- vastbase 转换后SQL (自动生成)
WITH RECURSIVE emp_hierarchy (empno, ename, mgr, level) AS (
    SELECT empno, ename, mgr, 1
    FROM emp
    WHERE mgr IS NULL
    UNION ALL
    SELECT e.empno, e.ename, e.mgr, eh.level + 1
    FROM emp e
    JOIN emp_hierarchy eh ON e.mgr = eh.empno
)
SELECT empno, ename, mgr FROM emp_hierarchy;

-- 函数转换示例
-- Oracle: SYSDATE
-- vastbase: CURRENT_TIMESTAMP()
-- 自动替换脚本
UPDATE sql_script 
SET sql_text = REPLACE(sql_text, 'SYSDATE', 'CURRENT_TIMESTAMP()')
WHERE sql_text LIKE '%SYSDATE%';`

const appRisks = [
  { title: '强耦合SQL (高风险)', description: '应用代码中硬编码大量Oracle特有SQL语法，分布在Java、Python、Shell等多类文件中，总计128处，需逐一改造。', class: 'risk-high p-3 rounded', icon: 'fa-exclamation-circle' },
  { title: '方言依赖 (中风险)', description: 'ORM框架配置使用Oracle方言，数据库连接池参数针对Oracle优化，需调整为vastbase适配参数。', class: 'risk-medium p-3 rounded', icon: 'fa-exclamation-triangle' },
  { title: '驱动适配 (低风险)', description: '需替换JDBC驱动包，调整连接URL格式，测试连接池兼容性，预计1人天完成。', class: 'risk-low p-3 rounded', icon: 'fa-info-circle' },
]

const appSuggestions = [
  { title: 'SQL解耦改造', detail: '将硬编码SQL迁移至配置文件或ORM框架，使用标准SQL语法，减少数据库方言依赖。' },
  { title: '分阶段改造', detail: '先改造查询类SQL，再改造DML语句，最后改造存储过程调用，每阶段完成后充分测试。' },
  { title: '驱动适配', detail: '升级JDBC驱动至vastbase最新版本，调整连接参数，测试连接稳定性和性能。' },
  { title: '连接池优化', detail: '调整最大连接数、空闲超时、检测周期等参数，适配vastbase数据库特性。' },
  { title: '灰度验证', detail: '先在测试环境完成全量改造，再选择非核心业务进行灰度验证，最后全量切换。' },
]

const workloadItems = [
  { label: '数据库配置与优化', days: 5 },
  { label: 'SQL语法改造', days: 30 },
  { label: '应用代码适配', days: 15 },
  { label: '功能测试验证', days: 20 },
  { label: '性能测试调优', days: 10 },
]
const totalWorkload = workloadItems.reduce((s, i) => s + i.days, 0)

const costItems = [
  { label: '人力成本', cost: 160000 },
  { label: '硬件成本', cost: 80000 },
  { label: '软件授权', cost: 120000 },
  { label: '测试环境', cost: 20000 },
  { label: '应急保障', cost: 20000 },
]
const totalCost = costItems.reduce((s, i) => s + i.cost, 0)

function initCharts() {
  if (resourceChartRef.value) {
    charts.push(new Chart(resourceChartRef.value, {
      type: 'line',
      data: {
        labels: ['0点', '4点', '8点', '12点', '16点', '20点'],
        datasets: [
          { label: 'CPU使用率 (%)', data: [20, 15, 40, 65, 55, 30], borderColor: '#FF7D00', backgroundColor: 'rgba(255,125,0,0.1)', fill: true, tension: 0.4 },
          { label: '内存使用率 (%)', data: [70, 65, 80, 85, 80, 75], borderColor: '#F53F3F', backgroundColor: 'rgba(245,63,63,0.1)', fill: true, tension: 0.4 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const } }, scales: { y: { beginAtZero: true, max: 100 } } },
    }))
  }
  if (iopsChartRef.value) {
    charts.push(new Chart(iopsChartRef.value, {
      type: 'bar',
      data: {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        datasets: [
          { label: '读IOPS', data: [5000, 5500, 6000, 7500, 8000, 4000, 3500], backgroundColor: '#165DFF' },
          { label: '写IOPS', data: [2000, 2500, 3000, 3500, 4000, 1500, 1000], backgroundColor: '#4080FF' },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const } }, scales: { y: { beginAtZero: true } } },
    }))
  }
  if (complexityChartRef.value) {
    charts.push(new Chart(complexityChartRef.value, {
      type: 'doughnut',
      data: { datasets: [{ data: [30, 50, 20], backgroundColor: ['#F53F3F', '#FF7D00', '#165DFF'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false }, tooltip: { enabled: false } } },
    }))
  }
  if (timelineChartRef.value) {
    charts.push(new Chart(timelineChartRef.value, {
      type: 'bar',
      data: {
        labels: ['准备阶段', '数据库迁移', '应用改造', '测试验证', '灰度切换', '上线保障'],
        datasets: [{ label: '周期(周)', data: [1, 2, 4, 3, 1, 1], backgroundColor: ['#165DFF', '#4080FF', '#69B1FF', '#8CC5FF', '#B4D8FF', '#DBEAFF'] }],
      },
      options: { indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, max: 12 } } },
    }))
  }
}

function startAssessment() {
  assessed.value = true
  nextTick(() => initCharts())
}

onBeforeUnmount(() => {
  charts.forEach(c => c.destroy())
})
</script>
