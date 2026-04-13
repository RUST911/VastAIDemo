<template>
  <AppHeader />
  <main class="container mx-auto px-4 py-8">
    <div class="card mb-8">
      <h2 class="text-xl font-bold mb-6 flex items-center">
        <i class="fa fa-cogs text-primary mr-2"></i>迁移任务配置
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold text-lg mb-4 text-gray-800">源数据库配置</h3>
          <div class="space-y-4">
            <div class="form-item">
              <label class="form-label">数据库类型</label>
              <select v-model="sourceForm.dbType" class="form-input">
                <option v-for="db in sourceDbTypes" :key="db">{{ db }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-item">
                <label class="form-label">主机地址</label>
                <input v-model="sourceForm.host" type="text" class="form-input" />
              </div>
              <div class="form-item">
                <label class="form-label">端口</label>
                <input v-model="sourceForm.port" type="text" class="form-input" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-item">
                <label class="form-label">用户名</label>
                <input v-model="sourceForm.user" type="text" class="form-input" />
              </div>
              <div class="form-item">
                <label class="form-label">密码</label>
                <input v-model="sourceForm.password" type="password" class="form-input" />
              </div>
            </div>
            <div class="form-item">
              <label class="form-label">服务名/SID</label>
              <input v-model="sourceForm.serviceName" type="text" class="form-input" />
            </div>
            <div class="form-item">
              <label class="form-label">迁移范围</label>
              <div class="space-y-2">
                <label v-for="opt in sourceScopeOptions" :key="opt.label" class="flex items-center">
                  <input type="checkbox" v-model="opt.checked" class="mr-2" />
                  <span>{{ opt.label }}</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end">
              <button class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                <i class="fa fa-check mr-2"></i>测试连接
              </button>
            </div>
          </div>
        </div>
        <div>
          <h3 class="font-semibold text-lg mb-4 text-gray-800">目标数据库配置</h3>
          <div class="space-y-4">
            <div class="form-item">
              <label class="form-label">数据库类型</label>
              <select v-model="targetForm.dbType" class="form-input">
                <option v-for="db in targetDbTypes" :key="db">{{ db }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-item">
                <label class="form-label">主机地址</label>
                <input v-model="targetForm.host" type="text" class="form-input" />
              </div>
              <div class="form-item">
                <label class="form-label">端口</label>
                <input v-model="targetForm.port" type="text" class="form-input" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-item">
                <label class="form-label">用户名</label>
                <input v-model="targetForm.user" type="text" class="form-input" />
              </div>
              <div class="form-item">
                <label class="form-label">密码</label>
                <input v-model="targetForm.password" type="password" class="form-input" />
              </div>
            </div>
            <div class="form-item">
              <label class="form-label">数据库名</label>
              <input v-model="targetForm.dbName" type="text" class="form-input" />
            </div>
            <div class="form-item">
              <label class="form-label">迁移策略</label>
              <select v-model="targetForm.strategy" class="form-input">
                <option v-for="s in migrationStrategies" :key="s">{{ s }}</option>
              </select>
            </div>
            <div class="flex justify-end">
              <button class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                <i class="fa fa-check mr-2"></i>测试连接
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-lg text-gray-800">高级配置</h3>
          <button class="text-primary text-sm hover:underline">
            <i class="fa fa-cog mr-1"></i>默认配置
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="form-item">
            <label class="form-label">并行迁移线程数</label>
            <input v-model.number="advancedConfig.threads" type="number" :min="1" :max="32" class="form-input" />
          </div>
          <div class="form-item">
            <label class="form-label">批量提交大小</label>
            <input v-model.number="advancedConfig.batchSize" type="number" :min="100" :max="10000" class="form-input" />
          </div>
          <div class="form-item">
            <label class="form-label">超时时间(秒)</label>
            <input v-model.number="advancedConfig.timeout" type="number" :min="60" :max="3600" class="form-input" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div class="form-item">
            <label class="form-label">数据一致性校验</label>
            <select v-model="advancedConfig.consistencyCheck" class="form-input">
              <option v-for="opt in consistencyOptions" :key="opt">{{ opt }}</option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">异常处理策略</label>
            <select v-model="advancedConfig.exceptionStrategy" class="form-input">
              <option v-for="opt in exceptionStrategies" :key="opt">{{ opt }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-8">
      <h2 class="text-xl font-bold mb-6 flex items-center">
        <i class="fa fa-code text-primary mr-2"></i>智能SQL改写
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="font-semibold mb-3 text-gray-800">源SQL (Oracle)</h3>
          <div class="bg-gray-100 rounded-lg p-4 h-64 overflow-auto">
            <pre class="font-mono text-xs text-gray-800">{{ sourceSql }}</pre>
          </div>
        </div>
        <div>
          <h3 class="font-semibold mb-3 text-gray-800">目标SQL (vastbase) - 智能生成</h3>
          <div class="bg-primary/5 rounded-lg p-4 h-64 overflow-auto border-l-4 border-primary">
            <pre class="font-mono text-xs text-gray-800">{{ targetSql }}</pre>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold mb-3 text-gray-800">SQL改写规则</h3>
          <div class="space-y-2 text-sm">
            <div v-for="rule in sqlRewriteRules" :key="rule.label" class="bg-gray-50 p-2 rounded">
              <span class="font-medium">{{ rule.label }}</span>：{{ rule.desc }}
            </div>
          </div>
        </div>
        <div>
          <h3 class="font-semibold mb-3 text-gray-800">改写统计</h3>
          <div class="h-40"><canvas ref="sqlRewriteChartRef"></canvas></div>
        </div>
      </div>
      <div class="mt-6 flex justify-between items-center">
        <div>
          <button class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors mr-2">
            <i class="fa fa-upload mr-2"></i>导入SQL文件
          </button>
          <button class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            <i class="fa fa-download mr-2"></i>导出改写后SQL
          </button>
        </div>
        <button class="btn-primary px-6 py-2">
          <i class="fa fa-magic mr-2"></i>批量智能改写
        </button>
      </div>
    </div>

    <div class="card mb-8">
      <h2 class="text-xl font-bold mb-6 flex items-center">
        <i class="fa fa-tasks text-primary mr-2"></i>迁移执行管理
      </h2>
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-semibold text-gray-800">迁移进度 (85%)</h3>
          <span class="text-sm text-gray-500">预计剩余时间：15分钟</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div class="bg-primary h-2.5 rounded-full" style="width: 85%"></div>
        </div>
        <div class="space-y-2">
          <div v-for="(step, idx) in migrationSteps" :key="idx" class="relative pl-8 pb-8 last:pb-0">
            <div
              class="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
              :class="stepClass(step.status)"
            >
              <template v-if="step.status === 'completed'">✓</template>
              <template v-else>{{ idx + 1 }}</template>
            </div>
            <div v-if="idx < migrationSteps.length - 1" class="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200"></div>
            <h4 class="font-medium">{{ step.title }}</h4>
            <p class="text-sm text-gray-600 mt-1">{{ step.desc }}</p>
          </div>
        </div>
      </div>
      <div class="flex gap-3 mb-6">
        <button class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          <i class="fa fa-pause mr-2"></i>暂停迁移
        </button>
        <button class="bg-warning text-white px-4 py-2 rounded-lg hover:bg-warning/90 transition-colors">
          <i class="fa fa-step-forward mr-2"></i>跳过当前表
        </button>
        <button class="bg-danger text-white px-4 py-2 rounded-lg hover:bg-danger/90 transition-colors">
          <i class="fa fa-stop mr-2"></i>终止迁移
        </button>
        <button class="bg-success text-white px-4 py-2 rounded-lg hover:bg-success/90 transition-colors ml-auto">
          <i class="fa fa-backup mr-2"></i>一键备份
        </button>
        <button class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          <i class="fa fa-undo mr-2"></i>回滚数据
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold mb-3 flex items-center text-gray-800">
            <i class="fa fa-stethoscope text-primary mr-2"></i>智能诊断
          </h3>
          <div class="space-y-3 text-sm">
            <div class="bg-white p-3 rounded border border-gray-200">
              <div class="font-medium text-danger">当前诊断到的异常 (2个)</div>
              <div class="mt-2 space-y-2">
                <div v-for="(ex, idx) in diagnosisExceptions" :key="idx">
                  <span class="font-medium">{{ ex.title }}</span>
                  <div class="mt-1 pl-4">
                    <p>{{ ex.cause }}</p>
                    <p class="text-success mt-1">{{ ex.fix }}</p>
                    <button class="text-primary text-xs hover:underline mt-1">
                      <i class="fa mr-1" :class="ex.icon"></i>{{ ex.action }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-primary/5 p-3 rounded border border-primary/20">
              <p class="text-sm">✅ 迁移进程已暂停，保存当前状态（已迁移1024/1256张表）</p>
              <p class="text-xs text-gray-600 mt-1">修复异常后可直接从emp表继续迁移，无需从头开始</p>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold mb-3 flex items-center text-gray-800">
            <i class="fa fa-exclamation-triangle text-warning mr-2"></i>异常预警
          </h3>
          <div class="space-y-3 text-sm">
            <div class="bg-white p-3 rounded border border-gray-200">
              <div class="font-medium text-warning">数据合规性检测结果</div>
              <div class="mt-2 space-y-2">
                <div v-for="alert in sensitiveAlerts" :key="alert.field" class="flex items-start">
                  <i class="fa fa-user-secret text-danger mt-1 mr-2"></i>
                  <div>
                    <p>{{ alert.message }}</p>
                    <p class="text-xs text-gray-600 mt-1">涉及记录数：{{ alert.count }} 条</p>
                    <button class="text-primary text-xs hover:underline mt-1">
                      <i class="fa fa-shield mr-1"></i>一键脱敏处理
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-warning/5 p-3 rounded border border-warning/20">
              <p class="text-sm">⚠️ 敏感数据未脱敏，建议先处理再继续迁移</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 class="font-semibold mb-3 text-gray-800">迁移执行日志</h3>
        <div class="bg-gray-900 text-gray-300 p-4 rounded-md font-mono text-xs h-64 overflow-auto">
          <pre>{{ migrationLog }}</pre>
        </div>
      </div>
    </div>

    <div class="card mb-8">
      <h2 class="text-xl font-bold mb-6 flex items-center">
        <i class="fa fa-vial text-primary mr-2"></i>智能测试用例生成与回归验证
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
          <button class="btn-primary w-full mt-4 py-2">
            <i class="fa fa-magic mr-2"></i>AI生成测试用例
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
            <button class="bg-success text-white w-full mt-4 py-2 rounded-lg hover:bg-success/90 transition-colors">
              <i class="fa fa-play mr-2"></i>执行回归验证
            </button>
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="font-semibold mb-3 text-gray-800">验证进度</h3>
          <div class="flex items-center justify-center h-32">
            <div class="text-center">
              <div class="text-3xl font-bold text-primary">78%</div>
              <div class="text-sm text-gray-600 mt-1">测试用例执行中</div>
              <div class="text-xs text-gray-500 mt-2">预计剩余：8分钟</div>
            </div>
          </div>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span>已执行用例数</span>
              <span class="font-medium">1,245 / 1,600</span>
            </div>
            <div class="flex justify-between">
              <span>通过用例数</span>
              <span class="font-medium text-success">1,189</span>
            </div>
            <div class="flex justify-between">
              <span>失败用例数</span>
              <span class="font-medium text-danger">56</span>
            </div>
            <div class="flex justify-between">
              <span>平均执行耗时对比</span>
              <span class="font-medium">+12%</span>
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
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联表</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">执行状态</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 text-sm">
              <tr v-for="tc in testCases" :key="tc.id">
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
                    class="text-xs hover:underline"
                    :class="tc.status === 'running' ? 'text-gray-400 cursor-not-allowed' : 'text-primary'"
                  >{{ tc.status === 'mismatch' ? '查看差异' : '查看详情' }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold mb-3 text-gray-800">测试用例执行结果对比 (TC003)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div class="font-medium text-sm mb-2">源库 (Oracle) 执行结果</div>
              <div class="bg-white rounded p-2 text-xs font-mono h-40 overflow-auto">
                <pre>{{ oracleResult }}</pre>
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div class="font-medium text-sm mb-2">目标库 (vastbase) 执行结果</div>
              <div class="bg-white rounded p-2 text-xs font-mono h-40 overflow-auto">
                <pre>{{ vastbaseResult }}</pre>
              </div>
            </div>
          </div>
          <div class="mt-4 bg-red-50 p-3 rounded-lg border border-red-200 text-sm">
            <div class="font-medium text-danger mb-1">差异分析</div>
            <p>vastbase数据库对 NULL 值的 COUNT(*) 统计逻辑与 Oracle 不同，Oracle 返回 0，vastbase返回 NULL</p>
            <p class="mt-2 text-success">修复建议：修改SQL为 COUNT(1) 或 NVL(COUNT(*), 0) 保证结果一致</p>
          </div>
        </div>
        <div>
          <h3 class="font-semibold mb-3 text-gray-800">回归验证统计</h3>
          <div class="h-64"><canvas ref="regressionChartRef"></canvas></div>
        </div>
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

const sourceDbTypes = ['Oracle 19c', 'MySQL 8.0', 'SQL Server 2019', 'PostgreSQL 14']
const targetDbTypes = ['MySQL 8.0', 'PostgreSQL 14', 'vastbase', '达梦 8', '人大金仓']
const migrationStrategies = ['全量迁移', '增量迁移', '增量同步 (CDC)', '分批次迁移']
const consistencyOptions = ['全量校验 (MD5)', '抽样校验 (10%)', '行数校验', '不校验']
const exceptionStrategies = ['暂停迁移，人工介入', '跳过错误，继续迁移', '重试3次后跳过', '终止迁移，回滚数据']

const sourceForm = reactive({
  dbType: 'Oracle 19c',
  host: '192.168.1.100',
  port: '1521',
  user: 'system',
  password: '********',
  serviceName: 'ORCLCDB',
})

const targetForm = reactive({
  dbType: 'vastbase',
  host: '192.168.1.101',
  port: '5236',
  user: 'SYSDBA',
  password: '********',
  dbName: 'DM8',
  strategy: '全量迁移',
})

const sourceScopeOptions = reactive([
  { label: '全库迁移', checked: true },
  { label: '指定模式/表空间', checked: false },
  { label: '包含存储过程/函数', checked: true },
  { label: '包含触发器/索引', checked: true },
])

const advancedConfig = reactive({
  threads: 8,
  batchSize: 1000,
  timeout: 300,
  consistencyCheck: '全量校验 (MD5)',
  exceptionStrategy: '暂停迁移，人工介入',
})

const sqlRewriteRules = [
  { label: '层级查询', desc: 'CONNECT BY → WITH RECURSIVE 递归CTE' },
  { label: '分页语法', desc: 'ROWNUM → LIMIT/OFFSET' },
  { label: '函数转换', desc: 'STRAGG → LISTAGG，SYSDATE → CURRENT_TIMESTAMP' },
  { label: '数据类型', desc: 'NUMBER → DECIMAL，VARCHAR2 → VARCHAR' },
  { label: '运算符', desc: '|| → CONCAT，NVL → IFNULL' },
]

const sourceSql = `-- 员工层级查询
SELECT 
    empno, 
    ename, 
    mgr,
    LEVEL,
    CONNECT_BY_ROOT ename AS top_manager
FROM emp
START WITH mgr IS NULL
CONNECT BY PRIOR empno = mgr
ORDER SIBLINGS BY ename;

-- 分页查询
SELECT * FROM (
    SELECT a.*, ROWNUM rn FROM (
        SELECT empno, ename, sal, deptno
        FROM emp
        WHERE deptno = 10
        ORDER BY sal DESC
    ) a
    WHERE ROWNUM <= 20
) WHERE rn >= 10;

-- 自定义聚合函数
SELECT 
    deptno,
    STRAGG(ename) AS emp_list
FROM emp
GROUP BY deptno;`

const targetSql = `-- 员工层级查询 (自动转换)
WITH RECURSIVE emp_hierarchy (empno, ename, mgr, level, top_manager) AS (
    SELECT 
        empno, 
        ename, 
        mgr,
        1,
        ename AS top_manager
    FROM emp
    WHERE mgr IS NULL
    UNION ALL
    SELECT 
        e.empno, 
        e.ename, 
        e.mgr,
        eh.level + 1,
        eh.top_manager
    FROM emp e
    JOIN emp_hierarchy eh ON e.mgr = eh.empno
)
SELECT empno, ename, mgr, level, top_manager
FROM emp_hierarchy
ORDER BY level, ename;

-- 分页查询 (自动转换)
SELECT empno, ename, sal, deptno
FROM emp
WHERE deptno = 10
ORDER BY sal DESC
LIMIT 10 OFFSET 9;

-- 自定义聚合函数 (自动转换)
SELECT 
    deptno,
    LISTAGG(ename, ',') WITHIN GROUP (ORDER BY ename) AS emp_list
FROM emp
GROUP BY deptno;`

const migrationSteps = [
  { title: '源库连接验证', desc: '已成功连接到Oracle 19c数据库，版本验证通过', status: 'completed' },
  { title: '目标库连接验证', desc: '已成功连接到vastbase数据库，权限验证通过', status: 'completed' },
  { title: '结构解析与转换', desc: '已解析1256张表结构，完成98%的结构转换', status: 'completed' },
  { title: '数据迁移 (多线程)', desc: '8个并行线程正在迁移数据，已完成85%，当前迁移emp表', status: 'active' },
  { title: '索引与约束创建', desc: '等待数据迁移完成', status: 'pending' },
  { title: '数据一致性校验', desc: '等待索引创建完成', status: 'pending' },
  { title: '迁移完成确认', desc: '等待校验完成', status: 'pending' },
]

function stepClass(status: string) {
  if (status === 'completed') return 'bg-success'
  if (status === 'active') return 'bg-primary'
  return 'bg-gray-300'
}

const diagnosisExceptions = [
  {
    title: '异常1：emp表sal字段数据类型转换失败',
    cause: '根因分析：Oracle NUMBER(8,2) 转换为vastbase DECIMAL 时精度溢出',
    fix: '修复方案：调整目标表字段为 DECIMAL(10,2)，重新执行该表迁移',
    action: '从当前异常处继续迁移',
    icon: 'fa-play',
  },
  {
    title: '异常2：存储过程 P_GET_EMP_SAL 语法不兼容',
    cause: '根因分析：PL/SQL 游标语法与vastbase不兼容',
    fix: '修复方案：自动转换游标语法为vastbase兼容格式，生成改写脚本',
    action: '自动修复并继续',
    icon: 'fa-magic',
  },
]

const sensitiveAlerts = [
  { field: 'phone', message: '检测到customer表中包含未脱敏的手机号字段 (phone)', count: '12,589' },
  { field: 'id_card', message: '检测到order表中包含身份证号字段 (id_card) 明文存储', count: '8,745' },
]

const migrationLog = `2026-03-19 10:00:00 [INFO] 开始迁移任务: Oracle → vastbase
2026-03-19 10:00:05 [INFO] 源库连接成功: 192.168.1.100:1521/ORCLCDB
2026-03-19 10:00:08 [INFO] 目标库连接成功: 192.168.1.101:5236/DM8
2026-03-19 10:00:10 [INFO] 开始解析源库结构，共1256张表
2026-03-19 10:05:30 [INFO] 结构解析完成，开始转换表结构
2026-03-19 10:10:25 [INFO] 表结构转换完成，创建目标库表结构
2026-03-19 10:15:40 [INFO] 启动8个并行迁移线程
2026-03-19 10:15:45 [INFO] 线程1开始迁移dept表，共4条记录
2026-03-19 10:15:45 [INFO] 线程2开始迁移emp表，共14条记录
2026-03-19 10:15:46 [INFO] 线程3开始迁移salgrade表，共5条记录
2026-03-19 10:15:47 [SUCCESS] 线程1完成dept表迁移，4条记录
2026-03-19 10:15:48 [SUCCESS] 线程3完成salgrade表迁移，5条记录
2026-03-19 10:15:50 [INFO] 线程1开始迁移bonus表，共0条记录
2026-03-19 10:15:52 [ERROR] 线程2迁移emp表失败: 数据类型转换错误
2026-03-19 10:15:53 [INFO] 迁移进程暂停，保存当前状态
2026-03-19 10:15:54 [DIAGNOSIS] 根因分析: sal字段 NUMBER(8,2) 精度溢出
2026-03-19 10:15:55 [SOLUTION] 修复方案: 调整目标字段为 DECIMAL(10,2)
2026-03-19 10:15:56 [WARNING] 检测到customer表存在未脱敏手机号数据
2026-03-19 10:15:57 [INFO] 已迁移表数量: 1024/1256 (81.5%)`

const testScopeOptions = reactive([
  { label: '全量功能测试用例', checked: true },
  { label: '边界测试用例 (空值/极值)', checked: true },
  { label: '性能压测用例 (高并发)', checked: true },
  { label: '仅生成核心表测试用例', checked: false },
  { label: '基于生产慢查询日志生成', checked: true },
  { label: '基于高频SQL日志生成', checked: true },
])

const testConfig = reactive({
  concurrentUsers: 50,
  duration: 300,
})

const validationDimensions = reactive([
  { label: '返回结果一致性', checked: true },
  { label: '执行耗时对比', checked: true },
  { label: '数据行数一致性', checked: true },
  { label: '字段值精度校验', checked: true },
])

type TcStatus = 'match' | 'mismatch' | 'running'
interface TestCase {
  id: string
  name: string
  type: string
  table: string
  status: TcStatus
  statusText: string
}

const testCases: TestCase[] = [
  { id: 'TC001', name: '员工信息查询-正常参数', type: '功能测试', table: 'emp', status: 'match', statusText: '结果匹配' },
  { id: 'TC002', name: '员工薪资查询-边界值', type: '边界测试', table: 'emp, salgrade', status: 'match', statusText: '结果匹配' },
  { id: 'TC003', name: '部门员工统计-空值参数', type: '边界测试', table: 'emp, dept', status: 'mismatch', statusText: '结果不匹配' },
  { id: 'TC004', name: '订单查询-高并发场景', type: '性能测试', table: 'orders', status: 'running', statusText: '执行中' },
  { id: 'TC005', name: '生产高频SQL-客户列表查询', type: '回归测试', table: 'customer', status: 'mismatch', statusText: '耗时差异大' },
]

function resultClass(status: TcStatus) {
  if (status === 'match') return 'bg-green-50 text-success border-green-200'
  if (status === 'mismatch') return 'bg-red-50 text-danger border-red-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

function resultIcon(status: TcStatus) {
  if (status === 'match') return 'fa-check'
  if (status === 'mismatch') return 'fa-times'
  return 'fa-spinner fa-spin'
}

const oracleResult = `SELECT COUNT(*) FROM emp 
WHERE deptno IS NULL;

执行结果：
COUNT(*)
--------
0

执行耗时：0.002秒`

const vastbaseResult = `SELECT COUNT(*) FROM emp 
WHERE deptno IS NULL;

执行结果：
COUNT(*)
--------
NULL

执行耗时：0.005秒`

const sqlRewriteChartRef = ref<HTMLCanvasElement>()
const regressionChartRef = ref<HTMLCanvasElement>()
const charts: Chart[] = []

function initCharts() {
  if (sqlRewriteChartRef.value) {
    charts.push(new Chart(sqlRewriteChartRef.value, {
      type: 'bar',
      data: {
        labels: ['层级查询', '分页语法', '函数转换', '数据类型', '运算符'],
        datasets: [
          { label: '已改写', data: [12, 45, 89, 35, 23], backgroundColor: '#165DFF' },
          { label: '待改写', data: [3, 8, 15, 5, 7], backgroundColor: '#C9CDD4' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' as const } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'SQL数量' } } },
      },
    }))
  }
  if (regressionChartRef.value) {
    charts.push(new Chart(regressionChartRef.value, {
      type: 'bar',
      data: {
        labels: ['功能测试', '边界测试', '性能测试', '回归测试'],
        datasets: [
          { label: '源库平均耗时(ms)', data: [8, 12, 250, 15], backgroundColor: '#165DFF' },
          { label: '目标库平均耗时(ms)', data: [10, 15, 320, 18], backgroundColor: '#4080FF' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' as const } },
        scales: { y: { beginAtZero: true, title: { display: true, text: '耗时(ms)' } } },
      },
    }))
  }
}

nextTick(() => initCharts())

onBeforeUnmount(() => {
  charts.forEach(c => c.destroy())
})
</script>
