<template>
  <div class="page-wrapper">
    <AppHeader />
    <main class="page-content">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-badge">
          <i class="fa fa-bolt"></i>
          <span>AI 驱动 · 智能化数据库管理</span>
        </div>
        <h1 class="hero-title">一站式智能数据库<br />全生命周期管理</h1>
        <p class="hero-desc">
          集成智能评估、数据迁移、故障诊断、全栈运维监控能力，为数据库管理提供智能化解决方案
        </p>
      </section>

      <!-- Module Cards -->
      <div class="modules-grid">
        <div
          v-for="mod in modules"
          :key="mod.id"
          :id="mod.id"
          class="module-card"
        >
          <div class="module-icon-wrap" :class="mod.colorClass">
            <img v-if="mod.img" :src="mod.img" :alt="mod.title" class="module-icon-img" />
            <i v-else class="fa" :class="mod.icon"></i>
          </div>
          <div class="module-body">
            <h3 class="module-title">{{ mod.title }}</h3>
            <p class="module-desc">{{ mod.description }}</p>
            <ul class="feature-list">
              <li v-for="(feat, idx) in mod.features" :key="idx" class="feature-list-item">
                <i class="fa fa-check-circle feature-check"></i>
                <div>
                  <span class="feature-title">{{ feat.title }}</span>
                  <span class="feature-desc">{{ feat.description }}</span>
                </div>
              </li>
            </ul>
          </div>
          <div class="module-footer">
            <router-link :to="mod.route" class="module-btn">
              <span>{{ mod.linkText }}</span>
              <i class="fa fa-arrow-right"></i>
            </router-link>
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import imgAssess from '@/assets/images/智能评估.png'
import imgMigrate from '@/assets/images/智能迁移.png'
import imgChat from '@/assets/images/logo.png'
import imgMonitor from '@/assets/images/智能运维.png'

const modules: Array<{
  id: string
  img?: string
  icon?: string
  colorClass: string
  title: string
  description: string
  features: { title: string; description: string }[]
  route: string
  linkText: string
}> = [
  {
    id: 'module-a',
    img: imgAssess,
    colorClass: 'icon-blue',
    title: '数据库和应用迁移评估',
    description: '通过自动化评估数据库配置、兼容性、应用改造点及工作量，一键生成全面的迁移评估报告。',
    features: [
      { title: '数据库配置评估', description: '根据源库推算目标库配置，配置合理性校验，对比目标库规格上限/下限' },
      { title: '数据库兼容性评估', description: '语法兼容、数据类型兼容、存储过程/函数/触发器兼容性' },
      { title: '应用框架评估', description: '应用改造复杂度评级（低/中/高），风险点（强耦合SQL、方言依赖）' },
    ],
    route: '/install',
    linkText: '查看功能演示',
  },
  {
    id: 'module-b',
    img: imgMigrate,
    colorClass: 'icon-purple',
    title: '智能迁移模块',
    description: '智能化完成跨数据库平台的数据迁移，支持语法自动适配、多线程执行与异常安全处理。',
    features: [
      { title: '智能SQL改写', description: '自动将Oracle等数据库语法转换为国产数据库适配语句' },
      { title: '多线程智能执行', description: '自动排序迁移语句执行顺序，多线程并行迁移提升效率' },
      { title: '智能断点续传', description: '报错时暂停进程并保存状态，修复后从报错语句处继续执行' },
    ],
    route: '/migrate',
    linkText: '查看功能演示',
  },
  {
    id: 'module-c',
    img: imgChat,
    colorClass: 'icon-teal',
    title: '工具报错智能答疑',
    description: '多维度接收报错信息，通过智能问答形式精准定位问题根因并提供解决方案。',
    features: [
      { title: '多格式信息接入', description: '支持文本、截图、日志文件等多种形式的报错信息上传' },
      { title: '智能问答交互', description: '通过对话形式逐步分析问题，精准定位根因' },
      { title: '解决方案库', description: '内置海量解决方案，根据报错类型智能匹配最优解决路径' },
    ],
    route: '/support',
    linkText: '开始智能答疑',
  },
  {
    id: 'module-d',
    img: imgMonitor,
    colorClass: 'icon-orange',
    title: '智能运维监控模块',
    description: '全栈式智能监控体系，覆盖基础设施到用户体验，实现异常自动检测、根因分析与故障自愈。',
    features: [
      { title: '全栈指标监控', description: 'CPU/内存/磁盘/网络/数据库/应用性能全链路采集' },
      { title: '智能异常检测', description: '机器学习基线，精准发现异常波动' },
      { title: '容量预测规划', description: '分析趋势，提前发出扩容建议' },
    ],
    route: '/monitor',
    linkText: '查看功能演示',
  },
  {
    id: 'module-e',
    icon: 'fa fa-code',
    colorClass: 'icon-green',
    title: 'SQL智能改写',
    description: 'AI驱动的SQL语法转换与性能优化工具，支持多数据库平台兼容改写，自动识别性能瓶颈。',
    features: [
      { title: '多数据库语法转换', description: '自动转换Oracle/MySQL/SQL Server等语法为国产数据库适配语句' },
      { title: '智能性能优化', description: '识别慢SQL、全表扫描等问题，给出索引建议和执行计划优化方案' },
      { title: '批量改写支持', description: '支持Excel/SQL文件批量上传，一次性完成上百条SQL改写' },
    ],
    route: '/sql-rewrite',
    linkText: '开始智能改写',
  },
]
</script>

<style scoped>
/* Hero */
.hero {
  text-align: center;
  padding: 48px 0 40px;
  max-width: 680px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  background: rgba(22, 93, 255, 0.08);
  border: 1px solid rgba(22, 93, 255, 0.15);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  color: #165DFF;
  margin-bottom: 20px;
}

.hero-badge i { font-size: 11px; }

.hero-title {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  color: #1D2129;
  line-height: 1.2;
  letter-spacing: -0.5px;
  margin: 0 0 16px;
}

.hero-desc {
  font-size: 16px;
  color: #4E5969;
  line-height: 1.7;
  margin: 0;
}

/* Grid */
.modules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 900px) {
  .modules-grid { grid-template-columns: 1fr; }
}

/* Module Card */
.module-card {
  background: white;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: all 0.25s ease;
}

.module-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.10);
  transform: translateY(-3px);
  border-color: rgba(22, 93, 255, 0.12);
}

/* Icon */
.module-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.icon-blue { background: rgba(22, 93, 255, 0.1); color: #165DFF; }
.icon-purple { background: rgba(114, 46, 209, 0.1); color: #722ED1; }
.icon-teal { background: rgba(15, 198, 194, 0.1); color: #0FC6C2; }
.icon-orange { background: rgba(255, 125, 0, 0.1); color: #FF7D00; }

.module-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Body */
.module-body { flex: 1; }

.module-title {
  font-size: 17px;
  font-weight: 700;
  color: #1D2129;
  margin: 0 0 8px;
}

.module-desc {
  font-size: 14px;
  color: #4E5969;
  line-height: 1.6;
  margin: 0 0 16px;
}

/* Feature list */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.feature-list-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #F2F3F5;
}

.feature-list-item:last-child { border-bottom: none; }

.feature-check {
  color: #00B42A;
  font-size: 14px;
  margin-top: 2px;
  flex-shrink: 0;
}

.feature-title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1D2129;
  margin-bottom: 2px;
}

.feature-desc {
  display: block;
  font-size: 12px;
  color: #86909C;
  line-height: 1.5;
}

/* Footer */
.module-footer { padding-top: 4px; }

.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #165DFF, #4080FF);
  color: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.25);
}

.module-btn:hover {
  filter: brightness(1.08);
  box-shadow: 0 6px 20px rgba(22, 93, 255, 0.35);
  transform: translateY(-1px);
}

.module-btn i { font-size: 12px; }
</style>
