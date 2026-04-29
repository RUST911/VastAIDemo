<template>
  <div class="page-wrapper">
  <AppHeader />
  <main class="page-content">
    <div class="card p-6 mb-6">
      <h2 class="section-title">
        <i class="fa fa-cogs"></i>迁移任务配置
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
              <label class="form-label">服务名 / SID</label>
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

    <div class="card p-6 mb-6">
      <h2 class="section-title mb-8">
        <i class="fa fa-cogs"></i>智能SQL改写
      </h2>

      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="form-item">
            <label class="form-label">源数据库类型 <span class="text-red-500">*</span></label>
            <select v-model="rewriteForm.sourceDbType" class="form-input">
              <option value="">请选择数据库类型</option>
              <option v-for="db in rewriteSourceDbTypes" :key="db" :value="db">{{ db }}</option>
            </select>
          </div>

          <div class="form-item">
            <label class="form-label">源数据库版本</label>
            <input v-model="rewriteForm.sourceDbVersion" type="text" class="form-input" placeholder="如：11g、12c、14 等" />
          </div>

          <div class="form-item">
            <label class="form-label">目标数据库类型 <span class="text-red-500">*</span></label>
            <select v-model="rewriteForm.targetDbType" class="form-input">
              <option value="">请选择数据库类型</option>
              <option v-for="db in rewriteTargetDbTypes" :key="db" :value="db">{{ db }}</option>
            </select>
          </div>

          <div class="form-item">
            <label class="form-label">目标数据库版本</label>
            <input v-model="rewriteForm.targetDbVersion" type="text" class="form-input" placeholder="如：Vastbase G100 2.2 等" />
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">上传 SQL 文件 <span class="text-red-500">*</span></label>
          <div
            class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
            :class="{ 'border-primary bg-primary/5': rewriteFile }"
            @click="triggerRewriteFileInput"
          >
            <input
              ref="rewriteFileInputRef"
              type="file"
              accept=".xlsx,.xls,.sql"
              class="hidden"
              @change="handleRewriteFileChange"
            />

            <div v-if="!rewriteFile" class="space-y-3">
              <i class="fa fa-cloud-upload text-4xl text-gray-400"></i>
              <div>
                <p class="text-gray-600">点击或拖拽文件到此处上传</p>
                <p class="text-sm text-gray-400 mt-1">支持 .xlsx、.xls、.sql 格式，文件大小不超过 20MB</p>
              </div>
            </div>

            <div v-else class="space-y-3">
              <i class="fa fa-file-excel-o text-4xl text-green-500"></i>
              <div>
                <p class="font-medium text-gray-800">{{ rewriteFile.name }}</p>
                <p class="text-sm text-gray-500 mt-1">{{ formatRewriteFileSize(rewriteFile.size) }}</p>
                <button type="button" class="text-primary text-sm mt-2 hover:underline" @click.stop="removeRewriteFile">
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
              <input type="checkbox" v-model="rewriteForm.options.optimizePerformance" class="w-4 h-4 text-primary" />
              <span>性能优化（添加索引建议、优化执行计划）</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="rewriteForm.options.fixSyntaxError" class="w-4 h-4 text-primary" />
              <span>自动修复语法错误</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="rewriteForm.options.addComments" class="w-4 h-4 text-primary" />
              <span>生成改写说明注释</span>
            </label>
          </div>
        </div>
      </div>

      <div class="mt-10 flex justify-center">
        <button class="btn-primary min-w-[200px]" @click="submitRewriteForm" :disabled="rewriteLoading || rewritePolling">
          <i v-if="rewriteLoading || rewritePolling" class="fa fa-spinner fa-spin mr-2"></i>
          <span>{{ rewriteLoading ? '提交中...' : (rewritePolling ? '改写中...' : '开始智能改写') }}</span>
        </button>
      </div>
    </div>

    <div v-if="showRewriteResult" class="card p-6 mb-6">
      <div v-if="rewritePolling" class="min-h-[40vh] flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mb-6"></div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">正在进行SQL智能改写中</h3>
        <p class="text-gray-500">AI正在分析SQL语法、优化执行计划，请稍候...</p>
        <p class="text-sm text-gray-400 mt-2">执行可能需要较长时间，请勿关闭页面</p>
      </div>

      <div v-else-if="rewriteLoading" class="min-h-[40vh] flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mb-6"></div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">正在提交任务...</h3>
        <p class="text-gray-500">正在上传文件并启动改写任务，请稍候...</p>
      </div>

      <div v-else-if="rewriteErrorMessage" class="min-h-[40vh] flex flex-col items-center justify-center">
        <div class="rounded-full h-16 w-16 bg-red-100 flex items-center justify-center mb-6">
          <i class="fa fa-exclamation-triangle text-3xl text-red-500"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">执行出错</h3>
        <p class="text-gray-500 text-center max-w-md">{{ rewriteErrorMessage }}</p>
      </div>

      <div v-else>
        <div class="flex justify-between items-center mb-6">
          <h2 class="section-title">
            <i class="fa fa-bar-chart"></i>智能改写概览
          </h2>
          <button class="btn-primary" @click="exportRewriteSqlFile">
            <i class="fa fa-download mr-2"></i>
            导出.SQL文件
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

        <div class="space-y-6">
          <div
            v-for="item in rewriteFilteredItems"
            :key="item.id"
            class="p-4 rounded-lg border"
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
      </div>
    </div>



    <div class="card p-6 mb-6">
      <h2 class="section-title">
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
          <button class="btn-primary w-full mt-4 py-2" @click="callTestCaseWorkflow" :disabled="testWorkflowLoading || !showRewriteResult">
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
  </main>
  <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onBeforeUnmount } from 'vue'
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

const DIFY_API_BASE = import.meta.env.VITE_MIGRATE_DIFY_API_BASE || 'http://172.16.105.101:3001'
const WORKFLOW_API_URL = `${DIFY_API_BASE}/v1/workflows/run`
const SQLREWRITE_AUTHORIZATION_TOKEN = import.meta.env.VITE_SQLREWRITE_AUTHORIZATION_TOKEN || 'app-oIQTTwWLdyjnwPEdHUEQvBgR'
const TEST_AUTHORIZATION_TOKEN = import.meta.env.VITE_CREATE_TESTCASE_AUTHORIZATION_TOKEN || 'app-cU3nZGeSRrMYEloJN1BApyyL'
const REGRESSION_VALIDATE_WORKFLOW_TOKEN = import.meta.env.VITE_REGRESSION_VALIDATE_WORKFLOW_TOKEN || 'app-sP3NOGE2NR3oZdN6HoKdsldP'
const REGRESSION_VALIDATE_STATUS_TOKEN = import.meta.env.VITE_REGRESSION_VALIDATE_STATUS_TOKEN || 'app-kqX9lK5woZx1TzC7UqkJ5R3N'
const testWorkflowLoading = ref(false)
const testWorkflowError = ref('')
const regressionLoading = ref(false)
const testCaseWorkflowRunId = ref('')

const rewriteSourceDbTypes = [
  'Oracle',
  'MySQL',
  'PostgreSQL',
  'SQL Server',
  'DB2',
  '达梦',
  '人大金仓',
  '南大通用',
]

const rewriteTargetDbTypes = [
  'Vastbase G100',
  'Vastbase E100',
  'PostgreSQL',
  'MySQL',
  'Oracle',
]

const rewriteFileInputRef = ref<HTMLInputElement | null>(null)
const rewriteLoading = ref(false)
const rewritePolling = ref(false)
const rewriteErrorMessage = ref('')
const rewritePollingInterval = ref<number | null>(null)
const rewriteFile = ref<File | null>(null)
const showRewriteResult = ref(false)

const rewriteForm = ref({
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

const rewriteFilterStatus = ref<'all' | 'success' | 'failed'>('all')

const rewriteFilteredItems = computed(() => {
  if (rewriteFilterStatus.value === 'all') return rewriteResult.value.items
  return rewriteResult.value.items.filter(item => item.status === rewriteFilterStatus.value)
})

const rewriteSuccessRate = computed(() => {
  if (rewriteResult.value.total === 0) return 0
  return ((rewriteResult.value.success / rewriteResult.value.total) * 100).toFixed(1)
})

function setRewriteFilter(status: 'all' | 'success' | 'failed') {
  rewriteFilterStatus.value = status
}

function triggerRewriteFileInput() {
  rewriteFileInputRef.value?.click()
}

function handleRewriteFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    rewriteFile.value = target.files[0]
  }
}

function removeRewriteFile() {
  rewriteFile.value = null
  if (rewriteFileInputRef.value) {
    rewriteFileInputRef.value.value = ''
  }
}

function formatRewriteFileSize(size: number): string {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

const submitRewriteForm = async () => {
  if (!rewriteForm.value.sourceDbType) {
    alert('请选择源数据库类型')
    return
  }
  if (!rewriteForm.value.targetDbType) {
    alert('请选择目标数据库类型')
    return
  }
  if (!rewriteFile.value) {
    alert('请上传SQL文件')
    return
  }

  rewriteLoading.value = true
  rewriteErrorMessage.value = ''
  showRewriteResult.value = true

  try {
    const fileInfo = await uploadRewriteFileToDify(rewriteFile.value!)
    const workflowResponse = await callRewriteWorkflowApi(fileInfo)
    if (workflowResponse.task_id) {
      startRewritePolling(workflowResponse.task_id)
    } else {
      throw new Error('未能获取有效的 task_id')
    }
  } catch (err) {
    rewriteLoading.value = false
    rewriteErrorMessage.value = `提交失败: ${err}`
  }
}

function startRewritePolling(taskId: string) {
  rewriteLoading.value = false
  rewritePolling.value = true
  pollRewriteWorkflowStatus(taskId)
  rewritePollingInterval.value = window.setInterval(() => {
    pollRewriteWorkflowStatus(taskId)
  }, 5000)
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
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    try {
      text = JSON.parse(text)
    } catch {
      rewriteErrorMessage.value = '结果格式解析失败'
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
    success: items.filter((i: any) => i.result === 'PASS').length,
    failed: items.filter((i: any) => i.result === 'FAIL').length,
    output: rawOutput,
    items: items.map((item: any, index: number) => {
      const isSuccess = item.result === 'PASS'
      let issuesText = ''
      if (item.issues) {
        if (Array.isArray(item.issues)) {
          issuesText = item.issues.map((issue: any) => {
            if (typeof issue === 'string') return issue
            return `[${issue.type || 'ERROR'}] ${issue.detail || JSON.stringify(issue)}`
          }).join('\n\n')
        } else if (typeof item.issues === 'object') {
          const issue = item.issues
          issuesText = `[${issue.type || 'ERROR'}] ${issue.detail || JSON.stringify(issue)}`
        } else if (typeof item.issues === 'string') {
          issuesText = item.issues
        }
      }

      let rulesText = ''
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
        rulesText = filtered.map(([k, v]) => `${k} → ${v}`).join('<br>')
      }

      const desc = isSuccess && rulesText ? rulesText : ''

      return {
        id: index + 1,
        status: isSuccess ? 'success' : 'failed',
        originalSql: item.schema ? `${item.schema}.${item.objname}` : item.objname,
        srcDdl: item.srcddl || '',
        errorSql: item.tgtddl || '',
        rewrittenSql: item.tarddl || '',
        description: desc,
        failedReason: issuesText ? `<p>${issuesText.replace(/\n/g, '</p><p>')}</p>` : '',
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

async function uploadRewriteFileToDify(file: File): Promise<{ id: string; name: string; extension: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${DIFY_API_BASE}/v1/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SQLREWRITE_AUTHORIZATION_TOKEN}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`文件上传失败: ${response.status}`)
  }

  const data = await response.json()
  return {
    id: data.id,
    name: data.name,
    extension: data.extension,
  }
}

async function callRewriteWorkflowApi(fileInfo: { id: string; name: string; extension: string }): Promise<{ task_id: string }> {
  const body = {
    inputs: {
      report: {
        type: "document",
        transfer_method: "local_file",
        upload_file_id: fileInfo.id,
      },
      srcdbtype: rewriteForm.value.sourceDbType,
      tardbtype: rewriteForm.value.targetDbType,
    },
    response_mode: "streaming",
    user: "vb",
  }

  const response = await fetch(WORKFLOW_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SQLREWRITE_AUTHORIZATION_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`工作流调用失败: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法获取响应读取器')
  }
  const decoder = new TextDecoder()
  let taskId = ''
  let buffer = ''

  while (true) {
    const result = await reader.read()
    const { done, value } = result
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data && data !== '[DONE]') {
          try {
            const json = JSON.parse(data)
            if (json.workflow_run_id) {
              taskId = json.workflow_run_id
              reader.cancel()
              return { task_id: taskId }
            }
          } catch {
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

const regressionProgress = reactive({
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

const selectedTestCase = ref<TestCase | null>(null)

const oracleResult = `SELECT COUNT(*) FROM emp 
WHERE deptno IS NULL;

执行结果：COUNT(*)
--------
0

执行耗时：0.002秒`

const vastbaseResult = `SELECT COUNT(*) FROM emp 
WHERE deptno IS NULL;

执行结果：COUNT(*)
--------
NULL

执行耗时：0.005秒`

const regressionChartRef = ref<HTMLCanvasElement>()
const charts: Chart[] = []

function initCharts() {
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

/**
 * 调用AI生成测试用例工作流
 * @description 在智能改写完成后，根据改写结果生成测试用例
 */
async function callTestCaseWorkflow() {
  selectedTestCase.value = null

  if (!rewriteResult.value.output) {
    testWorkflowError.value = '没有可用的改写结果，请先执行智能改写'
    return
  }

  const output = rewriteResult.value.output

  testWorkflowLoading.value = true
  testWorkflowError.value = ''

  try {
    const body = {
      inputs: {
        srcdbtype: rewriteForm.value.sourceDbType,
        tardbtype: rewriteForm.value.targetDbType,
        output: output,
      },
      response_mode: 'streaming',
      user: 'vb',
    }

    const response = await fetch(WORKFLOW_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TEST_AUTHORIZATION_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`工作流调用失败: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应读取器')
    }

    const decoder = new TextDecoder()
    let workflowRunId = ''
    let buffer = ''

    while (true) {
      const result = await reader.read()
      const { done, value } = result
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim()
          if (dataStr && dataStr !== '[DONE]') {
            try {
              const json = JSON.parse(dataStr)
              if (json.workflow_run_id) {
                workflowRunId = json.workflow_run_id
                reader.cancel()
                break
              }
            } catch {
            }
          }
        }
      }
      if (workflowRunId) break
    }

    if (!workflowRunId) {
      throw new Error('未能在流式响应中获取 workflow_run_id')
    }

    testCaseWorkflowRunId.value = workflowRunId
    await pollTestCaseWorkflowResult(workflowRunId)
  } catch (err) {
    testWorkflowError.value = `生成测试用例失败: ${err}`
    testWorkflowLoading.value = false
  }
}

/**
 * 轮询测试用例工作流执行结果
 * @param workflowRunId 工作流运行ID
 */
async function pollTestCaseWorkflowResult(workflowRunId: string) {
  const intervalMs = 5000

  while (true) {
    try {
      const response = await fetch(`${WORKFLOW_API_URL}/${workflowRunId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TEST_AUTHORIZATION_TOKEN}`,
        },
      })

      if (!response.ok) {
        throw new Error(`查询失败: ${response.status}`)
      }

      const data = await response.json()
      console.log('测试用例轮询结果:', data)

      if (data.status === 'succeeded' || data.status === 'stopped') {
        parseTestCaseResult(data)
        testWorkflowLoading.value = false
        return
      } else if (data.status === 'failed') {
        throw new Error(data.error || '工作流执行失败')
      }
    } catch (err) {
      testWorkflowError.value = `查询失败: ${err}`
      testWorkflowLoading.value = false
      return
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
}

/**
 * 启动回归验证
 * @description 调用回归验证工作流，然后轮询状态
 */
async function startRegressionTest() {
  console.log('点击了执行回归验证按钮')
  console.log('testCaseWorkflowRunId:', testCaseWorkflowRunId.value)

  regressionLoading.value = true
  regressionProgress.statusText = '执行中'
  regressionProgress.percent = 0

  try {
    const body = {
      inputs: {
        workflow_run_id: testCaseWorkflowRunId.value,
      },
      response_mode: 'streaming',
      user: 'vb',
    }

    const response = await fetch(WORKFLOW_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REGRESSION_VALIDATE_WORKFLOW_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`回归验证工作流调用失败: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应读取器')
    }

    const decoder = new TextDecoder()
    let workflowRunId = ''
    let buffer = ''

    while (true) {
      const result = await reader.read()
      const { done, value } = result
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim()
          if (dataStr && dataStr !== '[DONE]') {
            try {
              const json = JSON.parse(dataStr)
              if (json.workflow_run_id) {
                workflowRunId = json.workflow_run_id
                reader.cancel()
                break
              }
            } catch {
            }
          }
        }
      }
      if (workflowRunId) break
    }

    if (!workflowRunId) {
      throw new Error('未能在流式响应中获取 workflow_run_id')
    }

    await pollRegressionStatus(workflowRunId)
  } catch (err) {
    regressionProgress.statusText = '执行失败'
    regressionLoading.value = false
  }
}

/**
 * 轮询回归验证状态
 * @param workflowRunId 工作流运行ID
 */
async function pollRegressionStatus(regressionWorkflowRunId: string) {
  const intervalMs = 5000

  while (true) {
    try {
      const statusResponse = await fetch(`${WORKFLOW_API_URL}/${regressionWorkflowRunId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${REGRESSION_VALIDATE_WORKFLOW_TOKEN}`,
        },
      })

      if (!statusResponse.ok) {
        throw new Error(`查询回归验证状态失败: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      console.log('回归验证状态:', statusData)

      if (statusData.status === 'succeeded' || statusData.status === 'stopped') {
        await fetchProgressStatus()
        regressionLoading.value = false
        return
      } else if (statusData.status === 'failed') {
        regressionProgress.statusText = '执行失败'
        regressionLoading.value = false
        return
      }

      await fetchProgressStatus()
    } catch (err) {
      console.error('轮询错误:', err)
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
}

/**
 * 获取验证进度状态
 * @description 调用工作流查询验证进度和测试用例状态
 */
async function fetchProgressStatus() {
  try {
    const body = {
      inputs: {
        workflow_run_id: testCaseWorkflowRunId.value,
      },
      response_mode: 'blocking',
      user: 'vb',
    }

    const response = await fetch(WORKFLOW_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REGRESSION_VALIDATE_STATUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`查询验证进度失败: ${response.status}`)
    }

    const data = await response.json()
    console.log('验证进度状态:', data)
    parseRegressionStatus(data)
  } catch (err) {
    console.error('获取验证进度错误:', err)
  }
}

/**
 * 解析回归验证状态
 * @param responseData 工作流返回的完整响应数据
 */
function parseRegressionStatus(responseData: any) {
  if (!responseData) return

  console.log('回归验证状态数据:', JSON.stringify(responseData, null, 2))

  const data = responseData.data
  if (!data || !data.outputs) return

  const outputs = data.outputs
  const resultArray = outputs.data?.[0]?.result

  if (!Array.isArray(resultArray) || resultArray.length === 0) return

  const firstItem = resultArray[0]

  resultArray.forEach((item: any) => {
    const tcId = item.id
    const existing = generatedTestCases.value.find(tc => tc.id === tcId)
    if (existing) {
      existing.name = item.case_name || existing.name
      existing.type = item.case_type || existing.type
      existing.table = item.relation || existing.table
      existing.status = mapTestCaseStatus(item.status)
      existing.statusText = item.status || existing.statusText
      existing.opt = item.opt || existing.opt
    }
  })

  regressionProgress.executedCount = firstItem.executed_count || 0
  regressionProgress.passedCount = firstItem.passed_count || 0
  regressionProgress.failedCount = firstItem.failed_count || 0
  regressionProgress.totalCount = firstItem.total_count || 0
  regressionProgress.percent = firstItem.total_count > 0
    ? Math.round((firstItem.executed_count / firstItem.total_count) * 100)
    : 0
  regressionProgress.avgTimeDiff = firstItem.cost_ratio > 0 ? `${(firstItem.cost_ratio * 100).toFixed(1)}%` : ''
  regressionProgress.statusText = '执行中'
}

/**
 * 解析测试用例生成结果
 * @param responseData 工作流返回的完整响应数据
 */
function parseTestCaseResult(responseData: any) {
  if (!responseData) {
    testWorkflowError.value = '工作流返回结果为空'
    return
  }

  console.log('完整响应数据:', JSON.stringify(responseData, null, 2))

  const outputs = responseData.outputs || {}
  const dataArray = outputs.data

  if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
    testWorkflowError.value = '工作流返回结果格式错误: data 数组为空'
    return
  }

  const resultArray = dataArray[0]?.result
  if (!resultArray || !Array.isArray(resultArray)) {
    testWorkflowError.value = '工作流返回结果格式错误: result 数组为空'
    return
  }

  generatedTestCases.value = resultArray.map((item: any) => ({
    id: item.id || 0,
    name: item.case_name || '',
    type: item.case_type || '',
    table: item.relation || '',
    status: mapTestCaseStatus(item.status),
    statusText: item.status || '未知',
    opt: item.opt || '查看详情',
    srcCase: item.src_case || '',
    tarCase: item.tar_case || '',
  }))

  regressionProgress.percent = 0
  regressionProgress.statusText = '测试用例已就绪'
  regressionProgress.totalCount = generatedTestCases.value.length
  regressionProgress.executedCount = 0
  regressionProgress.passedCount = 0
  regressionProgress.failedCount = 0
  regressionProgress.avgTimeDiff = ''

  console.log('解析后的测试用例:', generatedTestCases.value)
}

/**
 * 映射测试用例状态
 * @param status 原始状态字符串
 */
function mapTestCaseStatus(status: string): TcStatus {
  if (!status) return 'pending'
  const statusMap: Record<string, TcStatus> = {
    '初始化': 'pending',
    '执行中': 'running',
    '成功': 'match',
    '失败': 'mismatch',
    '通过': 'match',
    '不匹配': 'mismatch',
    '结果不匹配': 'mismatch',
    '结果匹配': 'match',
  }
  return statusMap[status] || 'pending'
}

onBeforeUnmount(() => {
  charts.forEach(c => c.destroy())
  stopRewritePolling()
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
