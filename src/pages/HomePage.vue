<template>
  <AppHeader />
  <main class="container mx-auto px-4 py-8">
    <section class="mb-10 text-center max-w-3xl mx-auto">
      <h2 class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-dark mb-4">
        一站式智能数据库全生命周期管理
      </h2>
      <p class="text-gray-600 text-lg">
        集成智能智能评估、数据迁移、故障诊断、全栈运维监控能力，为数据库管理提供智能化解决方案
      </p>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div v-for="mod in modules" :key="mod.id" :id="mod.id" class="module-card p-6">
        <div class="module-header text-2xl">
          <i class="fa" :class="mod.icon"></i>
          <span>{{ mod.title }}</span>
        </div>
        <p class="text-gray-600 mb-6">{{ mod.description }}</p>

        <div class="space-y-4 mb-6">
          <div v-for="(feat, idx) in mod.features" :key="idx" class="feature-item">
            <i class="fa fa-check-circle text-secondary mt-1"></i>
            <div>
              <strong>{{ feat.title }}</strong>
              <p class="text-sm text-gray-500">{{ feat.description }}</p>
            </div>
          </div>
        </div>

        <router-link
          :to="mod.route"
          class="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors no-underline"
        >
          <i class="fa fa-arrow-right"></i>
          <span>{{ mod.linkText }}</span>
        </router-link>
      </div>
    </div>
  </main>
  <AppFooter />
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import type { ModuleConfig } from '@/types'

const modules: ModuleConfig[] = [
  {
    id: 'module-a',
    icon: 'fa-cogs',
    title: '数据库和应用迁移评估',
    description:
      '通过自动化评估数据库配置、兼容性、应用改造点及工作量，最终一键生成全面的迁移评估报告。',
    features: [
      {
        title: '数据库配置评估',
        description: '根据源库推算目标库配置，配置合理性校验，对比目标库规格上限 / 下限',
      },
      {
        title: '数据库兼容性评估',
        description: '语法兼容、数据类型兼容、存储过程 / 函数 / 触发器兼容性',
      },
      {
        title: '应用框架评估',
        description: '应用改造复杂度评级（低/中/高），风险点（强耦合SQL、方言依赖）',
      },
    ],
    route: '/install',
    linkText: '查看功能演示',
  },
  {
    id: 'module-b',
    icon: 'fa-exchange',
    title: '智能迁移模块',
    description:
      '智能化完成跨数据库平台的数据迁移，支持语法自动适配、多线程执行与异常安全处理',
    features: [
      {
        title: '智能SQL改写',
        description: '自动将Oracle等数据库语法转换为国产数据库适配语句',
      },
      {
        title: '多线程智能执行',
        description: '自动排序迁移语句执行顺序，多线程并行迁移提升效率',
      },
      {
        title: '智能断点续传',
        description: '报错时暂停进程并保存状态，修复后从报错语句处继续执行',
      },
    ],
    route: '/migrate',
    linkText: '查看功能演示',
  },
  {
    id: 'module-c',
    icon: 'fa-question-circle',
    title: '工具报错智能答疑模块',
    description:
      '多维度接收报错信息，通过智能问答形式精准定位问题根因并提供解决方案',
    features: [
      {
        title: '多格式信息接入',
        description: '支持文本、截图、日志文件等多种形式的报错信息上传',
      },
      {
        title: '智能问答交互',
        description: '通过对话形式逐步分析问题，精准定位根因',
      },
      {
        title: '解决方案库',
        description: '内置海量解决方案，根据报错类型智能匹配最优解决路径',
      },
    ],
    route: '/support',
    linkText: '查看功能演示',
  },
  {
    id: 'module-d',
    icon: 'fa-line-chart',
    title: '智能运维监控模块',
    description:
      '全栈式智能监控体系，覆盖基础设施到用户体验，实现异常自动检测、根因分析与故障自愈',
    features: [
      {
        title: '全栈指标监控',
        description: 'CPU/内存/磁盘/网络/数据库/应用性能全链路采集',
      },
      {
        title: '智能异常检测',
        description: '机器学习基线，精准发现异常波动',
      },
      {
        title: '容量预测规划',
        description: '分析趋势，提前发出扩容建议',
      },
    ],
    route: '/monitor',
    linkText: '查看功能演示',
  },
]
</script>
