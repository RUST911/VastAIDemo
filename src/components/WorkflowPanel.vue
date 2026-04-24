<template>
  <div class="workflow-panel">
    <button class="workflow-header" @click="expanded = !expanded">
      <span class="header-node-icon">
        <svg viewBox="0 0 28 28" width="22" height="22">
          <defs>
            <linearGradient id="wf-hdr-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#a78bfa"/>
              <stop offset="100%" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>
          <rect width="28" height="28" rx="7" fill="url(#wf-hdr-g)"/>
          <circle cx="9"  cy="10" r="2.2" fill="#fff"/>
          <circle cx="19" cy="10" r="2.2" fill="#fff"/>
          <circle cx="14" cy="19" r="2.2" fill="#fff"/>
          <line x1="11.2" y1="10"   x2="16.8" y2="10"   stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
          <line x1="9"    y1="12.2" x2="13.2" y2="16.8" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
          <line x1="19"   y1="12.2" x2="14.8" y2="16.8" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </span>
      <span class="workflow-label">工作流</span>
      <span v-if="allDone" class="header-check-circle">
        <svg viewBox="0 0 20 20" width="18" height="18">
          <circle cx="10" cy="10" r="10" fill="#10b981"/>
          <path d="M6 10.5l3 3 5-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </span>
      <span v-else-if="running" class="header-running-badge">
        Running
        <svg class="gear-spin" viewBox="0 0 16 16" width="13" height="13" fill="none">
          <path d="M8 5a3 3 0 100 6A3 3 0 008 5z" fill="currentColor" opacity="0.35"/>
          <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </span>
      <svg v-else class="chevron-icon" :style="{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }" viewBox="0 0 16 16" width="12" height="12" fill="none">
        <path d="M4 6l4 4 4-4" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <transition name="wf-expand">
      <div v-if="expanded" class="workflow-nodes">
        <div v-for="node in nodes" :key="node.nodeId" class="workflow-node">
          <svg viewBox="0 0 16 16" width="10" height="10" fill="none" style="flex-shrink:0;color:#d1d5db">
            <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="node-icon-wrap">
            <component :is="getNodeIcon(node.nodeType)" />
          </div>
          <div class="node-info">
            <span class="node-title">{{ node.title }}</span>
          </div>
          <div class="node-right">
            <span v-if="node.totalTokens || node.elapsedTime" class="node-stats">
              <span v-if="node.totalTokens" class="node-tokens">{{ node.totalTokens }} tokens</span>
              <span v-if="node.totalTokens && node.elapsedTime" class="node-sep">·</span>
              <span v-if="node.elapsedTime" class="node-time">{{ fmtTime(node.elapsedTime) }}</span>
            </span>
            <div class="node-status" :class="node.status">
              <span v-if="node.status === 'running'" class="node-running-badge">
                Running
                <svg class="spinner-ring" viewBox="0 0 16 16" width="14" height="14" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#e0e7ff" stroke-width="2"/>
                  <path d="M8 2a6 6 0 0 1 6 6" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
              <template v-else-if="node.status === 'succeeded'">
                <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
                  <circle cx="9" cy="9" r="9" fill="#10b981"/>
                  <path d="M5 9.5l3 3 5-5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </template>
              <svg v-else-if="node.status === 'failed'" viewBox="0 0 18 18" fill="none" width="18" height="18">
                <circle cx="9" cy="9" r="9" fill="#ef4444"/>
                <path d="M6 6l6 6M12 6l-6 6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineComponent, h } from 'vue'
import type { WorkflowNode } from '@/types'

const props = defineProps<{
  nodes: WorkflowNode[]
  running: boolean
  done?: boolean
}>()

const allDone = computed(() =>
  props.nodes.length > 0 && props.nodes.every(n => n.status === 'succeeded')
)

const expanded = ref(!allDone.value)

watch(allDone, (done) => {
  if (done) {
    setTimeout(() => { expanded.value = false }, 300)
  }
})

function mkIcon(stops: [string, string], children: ReturnType<typeof h>[]) {
  const id = `ic-${Math.random().toString(36).slice(2, 7)}`
  return defineComponent({ render: () => h('svg', { viewBox: '0 0 28 28', width: 28, height: 28 }, [
    h('defs', {}, [h('linearGradient', { id, x1: '0', y1: '0', x2: '1', y2: '1' }, [
      h('stop', { offset: '0%', 'stop-color': stops[0] }),
      h('stop', { offset: '100%', 'stop-color': stops[1] }),
    ])]),
    h('rect', { width: 28, height: 28, rx: 7, fill: `url(#${id})` }),
    ...children,
  ]) })
}

const W = '#fff'
const IconLLM       = mkIcon(['#9b59f5','#6c3ce1'], [h('path', { d:'M15.5 7l-5 8h4.5l-2 6 6-9h-4.5z', fill:W, 'fill-rule':'evenodd' })])
const IconKnowledge = mkIcon(['#2ecc71','#27ae60'], [h('rect',{x:8,y:8,width:12,height:14,rx:2,fill:'none',stroke:W,'stroke-width':1.5}),h('line',{x1:10,y1:12,x2:18,y2:12,stroke:W,'stroke-width':1.3,'stroke-linecap':'round'}),h('line',{x1:10,y1:15,x2:18,y2:15,stroke:W,'stroke-width':1.3,'stroke-linecap':'round'}),h('line',{x1:10,y1:18,x2:15,y2:18,stroke:W,'stroke-width':1.3,'stroke-linecap':'round'})])
const IconAnswer    = mkIcon(['#ff9f43','#e67e22'], [h('path', { d:'M7 9a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2h-5l-4 3v-3H9a2 2 0 01-2-2V9z', fill:W })])
const IconAgent     = mkIcon(['#a78bfa','#7c3aed'], [h('circle',{cx:14,cy:14,r:4,fill:'none',stroke:W,'stroke-width':1.8}),h('path',{d:'M14 7v2M14 19v2M7 14h2M19 14h2M9.1 9.1l1.4 1.4M17.5 17.5l1.4 1.4M9.1 18.9l1.4-1.4M17.5 10.5l1.4-1.4',stroke:W,'stroke-width':1.5,'stroke-linecap':'round'})])
const IconClassifier = mkIcon(['#1abc9c','#16a085'], [h('rect',{x:8,y:10,width:3,height:10,rx:1,fill:W}),h('rect',{x:12.5,y:7,width:3,height:13,rx:1,fill:W}),h('rect',{x:17,y:12,width:3,height:8,rx:1,fill:W})])
const IconIfElse    = mkIcon(['#26d0ce','#1a9e9c'], [h('path', { d:'M14 8v4M14 12l-4 4v3M14 12l4 4v3', stroke:W, 'stroke-width':1.8, 'stroke-linecap':'round', 'stroke-linejoin':'round', fill:'none' })])
const IconCode      = mkIcon(['#4facfe','#2563eb'], [h('path', { d:'M11 10l-4 4 4 4M17 10l4 4-4 4', stroke:W, 'stroke-width':1.8, 'stroke-linecap':'round', 'stroke-linejoin':'round', fill:'none' })])
const IconHttp      = mkIcon(['#4facfe','#2563eb'], [h('circle',{cx:14,cy:14,r:6,fill:'none',stroke:W,'stroke-width':1.5}),h('path',{d:'M14 8c-2 2-2 8 0 12M14 8c2 2 2 8 0 12M8 14h12',stroke:W,'stroke-width':1.3,'stroke-linecap':'round',fill:'none'})])
const IconTool      = mkIcon(['#ff9f43','#e67e22'], [h('path', { d:'M18.5 8a3.5 3.5 0 00-3.4 4.2L9 18.3a1.2 1.2 0 001.7 1.7l6.1-6.1A3.5 3.5 0 0018.5 8z', fill:W })])
const IconStart     = mkIcon(['#4facfe','#2563eb'], [h('path', { d:'M14 7l7 6v9h-4v-5h-6v5H7v-9z', fill:W })])
const IconEnd       = mkIcon(['#2ecc71','#27ae60'], [h('path', { d:'M10 7v14M10 7l8 4-8 4', fill:W })])
const IconVariable  = mkIcon(['#4facfe','#2563eb'], [h('rect',{x:7,y:9,width:14,height:10,rx:2,fill:'none',stroke:W,'stroke-width':1.5}),h('path',{d:'M11 13l2 2-2 2M15 17h2',stroke:W,'stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'})])
const IconIteration = mkIcon(['#26d0ce','#1a9e9c'], [h('path',{d:'M9 14a5 5 0 019.9-1M19 14a5 5 0 01-9.9 1',stroke:W,'stroke-width':1.8,'stroke-linecap':'round',fill:'none'}),h('path',{d:'M18 10l1 3 3-1',stroke:W,'stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'})])
const IconDefault   = defineComponent({ render: () => h('svg', { viewBox:'0 0 28 28', width:28, height:28 }, [h('rect',{width:28,height:28,rx:7,fill:'#e5e7eb'}),h('circle',{cx:14,cy:14,r:5,fill:'#9ca3af'})]) })

const ICON_MAP: Record<string, ReturnType<typeof defineComponent>> = {
  start:IconStart, end:IconEnd, llm:IconLLM,
  knowledge_retrieval:IconKnowledge, 'knowledge-retrieval':IconKnowledge,
  answer:IconAnswer, 'direct-answer':IconAnswer,
  agent:IconAgent,
  question_classifier:IconClassifier, 'question-classifier':IconClassifier,
  if_else:IconIfElse, 'if-else':IconIfElse,
  iteration:IconIteration, loop:IconIteration,
  code:IconCode,
  http_request:IconHttp, 'http-request':IconHttp,
  tool:IconTool,
  variable_assigner:IconVariable, 'variable-assigner':IconVariable,
  variable_aggregator:IconVariable, 'variable-aggregator':IconVariable,
}

function getNodeIcon(type: string) { return ICON_MAP[type] ?? IconDefault }

function fmtTime(s: number) {
  if (s < 0.001) return `${(s * 1e6).toFixed(0)}μs`
  if (s < 1)     return `${(s * 1000).toFixed(3)} ms`
  return `${s.toFixed(2)}s`
}
</script>

<style scoped>
.workflow-panel { border-radius:12px; overflow:hidden; border:1px solid #e5e7eb; background:#fff; font-size:13px; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
.workflow-header { width:100%; display:flex; align-items:center; gap:8px; padding:10px 14px; cursor:pointer; user-select:none; background:none; border:none; border-bottom:1px solid #f3f4f6; text-align:left; }
.header-node-icon { display:flex; align-items:center; flex-shrink:0; }
.workflow-label { flex:1; font-size:13px; font-weight:600; color:#374151; }
.header-check-circle { display:flex; align-items:center; flex-shrink:0; }
.header-running-badge, .node-running-badge { display:flex; align-items:center; gap:4px; font-size:12px; font-weight:500; color:#3b82f6; white-space:nowrap; }
.chevron-icon { flex-shrink:0; transition:transform 0.2s; }
.workflow-nodes { display:flex; flex-direction:column; }
.workflow-node { display:flex; align-items:center; gap:10px; padding:10px 14px; border-bottom:1px solid #f3f4f6; transition:background 0.15s; }
.workflow-node:last-child { border-bottom:none; }
.workflow-node:hover { background:#f9fafb; }
.node-icon-wrap { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
.node-info { flex:1; min-width:0; }
.node-title { font-size:13px; font-weight:500; color:#374151; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.node-right { display:flex; align-items:center; gap:6px; flex-shrink:0; }
.node-stats { display:flex; align-items:center; gap:4px; font-size:11px; }
.node-tokens { color:#6b7280; }
.node-sep    { color:#d1d5db; }
.node-time   { color:#9ca3af; }
.node-status { display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; min-width:18px; }
.node-status.running { min-width:unset; }
.gear-spin { animation:gear-spin 1.5s linear infinite; flex-shrink:0; }
@keyframes gear-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.spinner-ring { animation:spinner-spin 0.8s linear infinite; flex-shrink:0; }
@keyframes spinner-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.wf-expand-enter-active, .wf-expand-leave-active { transition:all 0.25s ease; overflow:hidden; }
.wf-expand-enter-from, .wf-expand-leave-to  { max-height:0; opacity:0; }
.wf-expand-enter-to, .wf-expand-leave-from { max-height:1200px; opacity:1; }
</style>
