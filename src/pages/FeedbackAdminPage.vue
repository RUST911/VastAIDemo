<template>
  <div class="fb-admin">

    <!-- Login -->
    <div v-if="!authed" class="fb-login-wrap">
      <div class="fb-login-card">
        <div class="fb-login-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 class="fb-login-title">反馈管理后台</h2>
        <p class="fb-login-desc">请输入访问密钥以继续</p>
        <input v-model="tokenInput" type="password" class="fb-login-input" placeholder="Admin Token" @keypress.enter="doLogin" />
        <p v-if="loginError" class="fb-login-error">{{ loginError }}</p>
        <button class="fb-login-btn" @click="doLogin">进入管理台</button>
      </div>
    </div>

    <template v-else>
      <!-- Header -->
      <header class="fb-header">
        <div class="fb-header-inner">
          <div class="fb-header-brand">
            <div class="fb-header-brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <span class="fb-header-title">用户反馈管理</span>
          </div>
          <div class="fb-header-tabs">
            <button class="fb-tab-btn" :class="{ active: activeTab === 'stats' }" @click="activeTab = 'stats'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>
              统计概览
            </button>
            <button class="fb-tab-btn" :class="{ active: activeTab === 'sessions' }" @click="activeTab = 'sessions'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              会话列表
              <span class="fb-tab-badge" v-if="total > 0">{{ total }}</span>
            </button>
          </div>
        </div>
      </header>

      <!-- ── Stats Dashboard ── -->
      <div v-if="activeTab === 'stats'" class="fb-stats-page">
        <div v-if="loadingStats" class="fb-loading">
          <div class="fb-spinner"></div>
          加载统计中...
        </div>
        <template v-else-if="stats">

          <!-- KPI Cards -->
          <div class="fb-kpi-grid">
            <div class="fb-kpi-card kpi-primary">
              <div class="fb-kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div class="fb-kpi-body">
                <div class="fb-kpi-value">{{ stats.totalFeedbacks }}</div>
                <div class="fb-kpi-label">反馈总数</div>
              </div>
              <div class="fb-kpi-trend">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              </div>
            </div>
            <div class="fb-kpi-card kpi-purple">
              <div class="fb-kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div class="fb-kpi-body">
                <div class="fb-kpi-value">{{ stats.totalUsers }}</div>
                <div class="fb-kpi-label">反馈用户</div>
              </div>
              <div class="fb-kpi-sub">{{ stats.totalConversations }} 个会话</div>
            </div>
            <div class="fb-kpi-card kpi-green">
              <div class="fb-kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              </div>
              <div class="fb-kpi-body">
                <div class="fb-kpi-value">{{ stats.likeCount }}</div>
                <div class="fb-kpi-label">好评数</div>
              </div>
              <div class="fb-kpi-rate rate-green">{{ likeRate }}%</div>
            </div>
            <div class="fb-kpi-card kpi-red">
              <div class="fb-kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
              </div>
              <div class="fb-kpi-body">
                <div class="fb-kpi-value">{{ stats.dislikeCount }}</div>
                <div class="fb-kpi-label">差评数</div>
              </div>
              <div class="fb-kpi-rate rate-red">{{ dislikeRate }}%</div>
            </div>
            <div class="fb-kpi-card kpi-orange">
              <div class="fb-kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="fb-kpi-body">
                <div class="fb-kpi-value">{{ stats.todayCount }}</div>
                <div class="fb-kpi-label">今日新增</div>
              </div>
              <div class="fb-kpi-badge" :class="stats.todayCount > 0 ? 'badge-on' : 'badge-off'">
                {{ stats.todayCount > 0 ? '活跃' : '暂无' }}
              </div>
            </div>
            <div class="fb-kpi-card kpi-teal">
              <div class="fb-kpi-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div class="fb-kpi-body">
                <div class="fb-kpi-value">{{ stats.recentWeekCount }}</div>
                <div class="fb-kpi-label">近 7 天</div>
              </div>
              <div class="fb-kpi-sub">均 {{ stats.recentWeekCount > 0 ? (stats.recentWeekCount / 7).toFixed(1) : 0 }}/天</div>
            </div>
          </div>

          <!-- Middle row: satisfaction + distribution -->
          <div class="fb-mid-row">
            <!-- Satisfaction donut -->
            <div class="fb-panel fb-panel-donut">
              <div class="fb-panel-header">
                <span class="fb-panel-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>
                  满意度概览
                </span>
              </div>
              <div class="fb-donut-wrap">
                <svg class="fb-donut-svg" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#F2F3F5" stroke-width="14"/>
                  <!-- dislike arc -->
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#F53F3F" stroke-width="14"
                    stroke-dasharray="289.03"
                    :stroke-dashoffset="289.03 * (1 - dislikeRate / 100)"
                    stroke-linecap="butt"
                    transform="rotate(-90 60 60)"
                    style="transition: stroke-dashoffset 0.8s ease"
                    :style="{ strokeDashoffset: 289.03 * (1 - dislikeRate / 100), transform: `rotate(${-90 + likeRate * 3.6}deg)`, transformOrigin: '60px 60px', transition: 'stroke-dashoffset 0.8s ease' }"
                  />
                  <!-- like arc -->
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#00B42A" stroke-width="14"
                    stroke-dasharray="289.03"
                    :stroke-dashoffset="289.03 * (1 - likeRate / 100)"
                    stroke-linecap="butt"
                    transform="rotate(-90 60 60)"
                    style="transition: stroke-dashoffset 0.8s ease"
                  />
                  <text x="60" y="55" text-anchor="middle" font-size="20" font-weight="800" fill="#1D2129">{{ likeRate }}%</text>
                  <text x="60" y="70" text-anchor="middle" font-size="9" fill="#86909C">好评率</text>
                </svg>
                <div class="fb-donut-legend">
                  <div class="fb-donut-leg-item">
                    <span class="fb-donut-dot" style="background:#00B42A"></span>
                    <div>
                      <div class="fb-donut-leg-val">{{ stats.likeCount }}</div>
                      <div class="fb-donut-leg-lbl">好评</div>
                    </div>
                  </div>
                  <div class="fb-donut-leg-item">
                    <span class="fb-donut-dot" style="background:#C9CDD4"></span>
                    <div>
                      <div class="fb-donut-leg-val">{{ stats.nullRatingCount }}</div>
                      <div class="fb-donut-leg-lbl">未评分</div>
                    </div>
                  </div>
                  <div class="fb-donut-leg-item">
                    <span class="fb-donut-dot" style="background:#F53F3F"></span>
                    <div>
                      <div class="fb-donut-leg-val">{{ stats.dislikeCount }}</div>
                      <div class="fb-donut-leg-lbl">差评</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Distribution bars -->
            <div class="fb-panel fb-panel-dist">
              <div class="fb-panel-header">
                <span class="fb-panel-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  评分分布
                </span>
                <span class="fb-panel-meta">共 {{ stats.totalFeedbacks }} 条</span>
              </div>
              <div class="fb-dist-list">
                <div class="fb-dist-row">
                  <div class="fb-dist-label-wrap">
                    <span class="fb-dist-dot" style="background:#00B42A"></span>
                    <span class="fb-dist-lbl">好评</span>
                  </div>
                  <div class="fb-dist-track">
                    <div class="fb-dist-fill" style="background:linear-gradient(90deg,#00B42A,#36D35A)" :style="{ width: likeRate + '%' }"></div>
                  </div>
                  <span class="fb-dist-pct">{{ likeRate }}%</span>
                  <span class="fb-dist-num">{{ stats.likeCount }}</span>
                </div>
                <div class="fb-dist-row">
                  <div class="fb-dist-label-wrap">
                    <span class="fb-dist-dot" style="background:#C9CDD4"></span>
                    <span class="fb-dist-lbl">未评分</span>
                  </div>
                  <div class="fb-dist-track">
                    <div class="fb-dist-fill" style="background:linear-gradient(90deg,#C9CDD4,#E0E3E8)" :style="{ width: nullRate + '%' }"></div>
                  </div>
                  <span class="fb-dist-pct">{{ nullRate }}%</span>
                  <span class="fb-dist-num">{{ stats.nullRatingCount }}</span>
                </div>
                <div class="fb-dist-row">
                  <div class="fb-dist-label-wrap">
                    <span class="fb-dist-dot" style="background:#F53F3F"></span>
                    <span class="fb-dist-lbl">差评</span>
                  </div>
                  <div class="fb-dist-track">
                    <div class="fb-dist-fill" style="background:linear-gradient(90deg,#F53F3F,#FF7070)" :style="{ width: dislikeRate + '%' }"></div>
                  </div>
                  <span class="fb-dist-pct">{{ dislikeRate }}%</span>
                  <span class="fb-dist-num">{{ stats.dislikeCount }}</span>
                </div>
                <div class="fb-dist-row">
                  <div class="fb-dist-label-wrap">
                    <span class="fb-dist-dot" style="background:#FF7D00"></span>
                    <span class="fb-dist-lbl">有说明</span>
                  </div>
                  <div class="fb-dist-track">
                    <div class="fb-dist-fill" style="background:linear-gradient(90deg,#FF7D00,#FFA040)"
                      :style="{ width: (stats.totalFeedbacks > 0 ? Math.round(stats.withContentCount / stats.totalFeedbacks * 100) : 0) + '%' }"></div>
                  </div>
                  <span class="fb-dist-pct">{{ stats.totalFeedbacks > 0 ? Math.round(stats.withContentCount / stats.totalFeedbacks * 100) : 0 }}%</span>
                  <span class="fb-dist-num">{{ stats.withContentCount }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Trend chart -->
          <div class="fb-panel fb-panel-trend" v-if="stats.dailyTrend.length > 0">
            <div class="fb-panel-header">
              <span class="fb-panel-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                近 30 天反馈趋势
              </span>
              <span class="fb-panel-meta">峰值 {{ trendMax }} 条</span>
            </div>
            <div class="fb-trend-wrap">
              <div class="fb-trend-y">
                <span>{{ trendMax }}</span>
                <span>{{ Math.round(trendMax / 2) }}</span>
                <span>0</span>
              </div>
              <div class="fb-trend-chart">
                <div class="fb-trend-grid">
                  <div class="fb-trend-gridline"></div>
                  <div class="fb-trend-gridline"></div>
                  <div class="fb-trend-gridline"></div>
                </div>
                <div class="fb-trend-bars">
                  <div
                    v-for="(d, i) in stats.dailyTrend" :key="i"
                    class="fb-trend-col"
                    :title="d.date + ': ' + d.count + ' 条'"
                  >
                    <div class="fb-trend-bar-wrap">
                      <div
                        class="fb-trend-bar"
                        :class="{ 'bar-peak': parseInt(d.count) === trendMax, 'bar-zero': parseInt(d.count) === 0 }"
                        :style="{ height: (parseInt(d.count) / trendMax * 100) + '%' }"
                      ></div>
                    </div>
                    <span class="fb-trend-lbl" v-if="stats.dailyTrend.length <= 15 || i % 3 === 0">{{ formatChartDate(d.date) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </template>
      </div>

      <!-- ── Sessions List View ── -->
      <div v-else class="fb-body">

        <!-- Sidebar -->
        <aside class="fb-sidebar">
          <div class="fb-sidebar-header">
            <div class="fb-sidebar-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="searchQuery" class="fb-search-input" placeholder="搜索会话 ID..." />
              <button v-if="searchQuery" class="fb-search-clear" @click="searchQuery = ''">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="fb-rating-filter">
              <button class="fb-filter-btn" :class="{ active: ratingFilter === '' }" @click="setRatingFilter('')">
                全部
              </button>
              <button class="fb-filter-btn filter-like" :class="{ active: ratingFilter === 'like' }" @click="setRatingFilter('like')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                好评
              </button>
              <button class="fb-filter-btn filter-dislike" :class="{ active: ratingFilter === 'dislike' }" @click="setRatingFilter('dislike')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                差评
              </button>
            </div>
            <div class="fb-sidebar-count" v-if="!loadingList">
              共 <strong>{{ total }}</strong> 个会话
            </div>
          </div>

          <div v-if="loadingList" class="fb-loading"><div class="fb-spinner"></div> 加载中...</div>
          <div v-else-if="filteredGroups.length === 0" class="fb-sidebar-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{{ searchQuery ? '未找到匹配会话' : '暂无反馈数据' }}</span>
          </div>
          <template v-else>
            <div class="fb-sidebar-list">
              <div
                v-for="g in filteredGroups" :key="g.conversation_id"
                class="fb-conv-item" :class="{ active: selectedConvId === g.conversation_id }"
                @click="selectConversation(g.conversation_id)"
              >
                <div class="fb-conv-top">
                  <div class="fb-conv-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div class="fb-conv-main">
                    <div class="fb-conv-id-row">
                      <span class="fb-conv-id">{{ shortId(g.conversation_id) }}</span>
                      <span class="fb-conv-time">{{ formatTime(g.last_feedback_at) }}</span>
                    </div>
                    <div class="fb-conv-bottom">
                      <span class="fb-conv-count-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {{ g.feedback_count }} 条反馈
                      </span>
                      <div class="fb-conv-rating-tags">
                        <span v-if="parseInt(g.like_count) > 0" class="fb-conv-tag tag-like">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                          {{ g.like_count }}
                        </span>
                        <span v-if="parseInt(g.dislike_count) > 0" class="fb-conv-tag tag-dislike">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                          {{ g.dislike_count }}
                        </span>
                        <button class="fb-copy-btn" @click.stop="copyConvId(g.conversation_id, $event)" title="复制会话ID">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          复制
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="fb-pagination" v-if="totalPages > 1">
              <button class="fb-page-btn" :disabled="page <= 1" @click="loadPage(page - 1)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span class="fb-page-info">{{ page }} / {{ totalPages }}</span>
              <button class="fb-page-btn" :disabled="page >= totalPages" @click="loadPage(page + 1)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </template>
        </aside>

        <!-- Detail panel -->
        <main class="fb-detail" ref="detailRef">

          <!-- Empty state -->
          <div v-if="!selectedConvId" class="fb-detail-empty">
            <div class="fb-detail-empty-inner">
              <div class="fb-detail-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p class="fb-detail-empty-title">选择一个会话</p>
              <p class="fb-detail-empty-desc">从左侧列表选择会话，查看完整对话记录和用户反馈</p>
            </div>
          </div>

          <template v-else>
            <!-- Detail header -->
            <div class="fb-detail-header">
              <div class="fb-detail-header-main">
                <div class="fb-detail-header-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div class="fb-detail-header-info">
                  <div class="fb-detail-header-title">会话详情</div>
                  <div class="fb-detail-conv-id">{{ selectedConvId }}</div>
                </div>
              </div>
              <div class="fb-detail-header-actions">
                <div class="fb-detail-header-meta" v-if="detailRecords.length > 0">
                  <span class="fb-detail-meta-chip chip-feedback">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                    {{ detailRecords.length }} 条反馈
                  </span>
                  <span class="fb-detail-meta-chip chip-like" v-if="detailRecords.filter(r=>r.rating==='like').length > 0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    {{ detailRecords.filter(r=>r.rating==='like').length }}
                  </span>
                  <span class="fb-detail-meta-chip chip-dislike" v-if="detailRecords.filter(r=>r.rating==='dislike').length > 0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                    {{ detailRecords.filter(r=>r.rating==='dislike').length }}
                  </span>
                </div>
                <button class="fb-action-btn" @click="copyText(selectedConvId)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  复制 ID
                </button>
              </div>
            </div>

            <div v-if="loadingDetail" class="fb-loading"><div class="fb-spinner"></div> 加载中...</div>
            <div v-else-if="chatItems.length === 0 && detailRecords.length === 0" class="fb-empty">暂无数据</div>

            <template v-else>
              <!-- Feedback records -->
              <div class="fb-feedback-section" v-if="detailRecords.length > 0">
                <div class="fb-feedback-section-header">
                  <div class="fb-feedback-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                    用户反馈记录
                  </div>
                  <span class="fb-feedback-count-badge">{{ detailRecords.length }} 条</span>
                </div>
                <div class="fb-timeline">
                  <div v-for="(rec, idx) in detailRecords" :key="rec.id" class="fb-timeline-item">
                    <div class="fb-timeline-line"></div>
                    <div class="fb-timeline-dot-wrap">
                      <div class="fb-timeline-dot" :class="ratingDotClass(rec.rating)">
                        <template v-if="rec.rating === 'like'">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                        </template>
                        <template v-else-if="rec.rating === 'dislike'">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                        </template>
                        <template v-else>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </template>
                      </div>
                    </div>
                    <div class="fb-timeline-card" :class="'tcard-' + (rec.rating || 'null')">
                      <div class="fb-timeline-card-header">
                        <span class="fb-timeline-index">#{{ detailRecords.length - idx }}</span>
                        <span class="fb-rating-badge" :class="ratingBadgeClass(rec.rating)">{{ ratingLabel(rec.rating) }}</span>
                        <span class="fb-timeline-time">{{ formatTime(rec.created_at) }}</span>
                      </div>
                      <div v-if="rec.content" class="fb-timeline-content">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {{ rec.content }}
                      </div>
                      <div v-else class="fb-timeline-no-content">无文字说明</div>
                      <div class="fb-timeline-meta">
                        <span v-if="rec.message_id" class="fb-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          {{ rec.message_id.slice(0, 12) }}...
                        </span>
                        <span class="fb-meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          {{ rec.user_id }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Chat messages -->
              <div class="fb-messages" v-if="chatItems.length > 0">
                <template v-for="item in chatItems" :key="item.key">
                  <div v-if="item.type === 'user'" class="fb-msg-row user">
                    <div class="fb-user-wrap">
                      <div class="fb-user-bubble"><div class="fb-md" v-html="renderMd(item.content)" /></div>
                      <div class="fb-user-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="item.type === 'assistant'" class="fb-msg-row assistant">
                    <div class="fb-assistant-wrap">
                      <div class="fb-bot-avatar"><img src="/avatar.png" alt="量仔" /></div>
                      <div class="fb-assistant-bubble"><div class="fb-md" v-html="renderMd(item.content)" /></div>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </template>
        </main>
      </div>
    </template>

    <!-- Toast -->
    <div v-if="copyToast" class="fb-toast">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      {{ copyToast }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import { fetchFeedbackList, fetchFeedbacksByConversation, fetchAdminConversationMessages, fetchFeedbackStats } from '@/api'
import type { FeedbackGroup, FeedbackRecord, DifyMessage, FeedbackStats } from '@/api'

marked.setOptions({ breaks: true, gfm: true })

const TOKEN_KEY = 'fb_admin_token'
const tokenInput = ref('')
const authed = ref(false)
const loginError = ref('')
const adminToken = ref('')

function doLogin() {
  if (!tokenInput.value.trim()) { loginError.value = '请输入密钥'; return }
  adminToken.value = tokenInput.value.trim()
  sessionStorage.setItem(TOKEN_KEY, adminToken.value)
  authed.value = true
  loginError.value = ''
  activeTab.value = 'stats'
  loadStats()
  loadPage(1)
}

onMounted(() => {
  const saved = sessionStorage.getItem(TOKEN_KEY)
  if (saved) { adminToken.value = saved; authed.value = true; loadStats(); loadPage(1) }
})

const activeTab = ref<'stats' | 'sessions'>('stats')

const stats = ref<FeedbackStats | null>(null)
const loadingStats = ref(false)

async function loadStats() {
  loadingStats.value = true
  try { stats.value = await fetchFeedbackStats(adminToken.value) }
  catch (e: any) { if (e.message.includes('401')) { authed.value = false; sessionStorage.removeItem(TOKEN_KEY) } }
  finally { loadingStats.value = false }
}

const likeRate = computed(() => {
  if (!stats.value || stats.value.totalFeedbacks === 0) return 0
  return Math.round(stats.value.likeCount / stats.value.totalFeedbacks * 100)
})
const dislikeRate = computed(() => {
  if (!stats.value || stats.value.totalFeedbacks === 0) return 0
  return Math.round(stats.value.dislikeCount / stats.value.totalFeedbacks * 100)
})
const nullRate = computed(() => {
  if (!stats.value || stats.value.totalFeedbacks === 0) return 0
  return 100 - likeRate.value - dislikeRate.value
})
const trendMax = computed(() => {
  if (!stats.value || stats.value.dailyTrend.length === 0) return 1
  return Math.max(...stats.value.dailyTrend.map(d => parseInt(d.count))) || 1
})

function formatChartDate(date: string) {
  if (!date) return ''
  const p = date.split('-')
  return p[1] + '/' + p[2]
}

const groups = ref<FeedbackGroup[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loadingList = ref(false)
const totalPages = computed(() => Math.ceil(total.value / limit))
const searchQuery = ref('')
const ratingFilter = ref<'like' | 'dislike' | ''>('')
const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) return groups.value
  const q = searchQuery.value.trim().toLowerCase()
  return groups.value.filter(g => g.conversation_id.toLowerCase().includes(q))
})

async function loadPage(p: number) {
  loadingList.value = true
  try {
    const res = await fetchFeedbackList(p, limit, adminToken.value, ratingFilter.value || undefined)
    groups.value = res.data; total.value = res.total; page.value = p
  } catch (e: any) { if (e.message.includes('401')) { authed.value = false; sessionStorage.removeItem(TOKEN_KEY) } }
  finally { loadingList.value = false }
}

function setRatingFilter(val: 'like' | 'dislike' | '') {
  ratingFilter.value = val
  selectedConvId.value = ''
  loadPage(1)
}

const selectedConvId = ref('')
const detailRecords = ref<FeedbackRecord[]>([])
const difyMessages = ref<DifyMessage[]>([])
const loadingDetail = ref(false)
const detailRef = ref<HTMLElement>()

type ChatItem = { type: 'user'; key: string; content: string } | { type: 'assistant'; key: string; content: string }

const chatItems = computed<ChatItem[]>(() => {
  const items: ChatItem[] = []
  for (const msg of difyMessages.value) {
    if (msg.query?.trimStart().startsWith('{"type":"feedback"')) continue
    items.push({ type: 'user', key: `u-${msg.id}`, content: msg.query || '' })
    if (msg.answer?.trim()) items.push({ type: 'assistant', key: `a-${msg.id}`, content: msg.answer })
  }
  return items
})

async function selectConversation(convId: string) {
  selectedConvId.value = convId
  loadingDetail.value = true
  difyMessages.value = []; detailRecords.value = []
  try {
    const group = groups.value.find(g => g.conversation_id === convId)
    const userId = group?.user_id || ''
    const [msgs, feedbacks] = await Promise.all([
      fetchAdminConversationMessages(convId, userId, adminToken.value),
      fetchFeedbacksByConversation(convId, adminToken.value),
    ])
    difyMessages.value = msgs; detailRecords.value = feedbacks
  } catch (e: any) { if (e.message.includes('401')) { authed.value = false; sessionStorage.removeItem(TOKEN_KEY) } }
  finally { loadingDetail.value = false }
}

function renderMd(text: string): string {
  if (!text) return ''
  const cleaned = text.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '').trim()
  try { return marked.parse(cleaned) as string } catch { return text }
}

function shortId(id: string) {
  if (!id) return '未知会话'
  return id.length > 20 ? id.slice(0, 8) + '...' + id.slice(-6) : id
}

function formatTime(ts: string) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function ratingLabel(r: string | null) {
  if (r === 'like') return '有帮助'
  if (r === 'dislike') return '没帮助'
  return '未评分'
}

function ratingBadgeClass(r: string | null) {
  if (r === 'like') return 'badge-like'
  if (r === 'dislike') return 'badge-dislike'
  return 'badge-null'
}

function ratingDotClass(r: string | null) {
  if (r === 'like') return 'tdot-like'
  if (r === 'dislike') return 'tdot-dislike'
  return 'tdot-null'
}

const copyToast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showCopyToast(msg: string) {
  copyToast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { copyToast.value = '' }, 2000)
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(() => showCopyToast('已复制到剪贴板')).catch(() => showCopyToast('复制失败'))
}

function copyConvId(id: string, e: Event) {
  e.stopPropagation(); copyText(id)
}
</script>

<style scoped>
/* ── Base ── */
.fb-admin { min-height: 100vh; background: #F4F6FB; display: flex; flex-direction: column; font-family: inherit; }

/* ── Loading / Empty ── */
.fb-loading { display: flex; align-items: center; gap: 10px; justify-content: center; padding: 48px; color: var(--text-3); font-size: 14px; }
.fb-spinner { width: 18px; height: 18px; border: 2px solid var(--border-strong); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.fb-empty { display: flex; align-items: center; justify-content: center; padding: 48px; color: var(--text-3); font-size: 14px; }

/* ── Login ── */
.fb-login-wrap { flex: 1; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #EEF3FF 0%, #F4F6FB 100%); }
.fb-login-card { background: white; border-radius: 20px; padding: 44px 40px; box-shadow: 0 8px 40px rgba(22,93,255,0.10), 0 1px 4px rgba(0,0,0,0.06); width: 360px; text-align: center; }
.fb-login-icon { width: 56px; height: 56px; background: linear-gradient(135deg, var(--primary), var(--primary-light)); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
.fb-login-icon svg { width: 26px; height: 26px; stroke: white; }
.fb-login-title { font-size: 20px; font-weight: 700; color: var(--text-1); margin: 0 0 6px; }
.fb-login-desc { font-size: 13px; color: var(--text-3); margin: 0 0 24px; }
.fb-login-input { width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: 10px; border: 1.5px solid var(--border-strong); font-size: 14px; outline: none; margin-bottom: 10px; transition: border-color 0.15s, box-shadow 0.15s; }
.fb-login-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-dim); }
.fb-login-error { color: var(--danger); font-size: 12px; margin: 0 0 10px; }
.fb-login-btn { width: 100%; padding: 11px; border-radius: 10px; border: none; cursor: pointer; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; font-size: 14px; font-weight: 600; transition: filter 0.15s, box-shadow 0.15s; box-shadow: 0 4px 14px rgba(22,93,255,0.28); }
.fb-login-btn:hover { filter: brightness(1.07); box-shadow: 0 6px 20px rgba(22,93,255,0.36); }

/* ── Header ── */
.fb-header { background: white; border-bottom: 1px solid var(--border); padding: 0 24px; height: 56px; display: flex; align-items: center; flex-shrink: 0; box-shadow: 0 1px 0 rgba(0,0,0,0.04); }
.fb-header-inner { display: flex; align-items: center; gap: 0; width: 100%; }
.fb-header-brand { display: flex; align-items: center; gap: 10px; margin-right: 32px; }
.fb-header-brand-icon { width: 32px; height: 32px; background: var(--primary-dim); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.fb-header-brand-icon svg { width: 16px; height: 16px; stroke: var(--primary); }
.fb-header-title { font-size: 15px; font-weight: 700; color: var(--text-1); white-space: nowrap; }
.fb-header-tabs { display: flex; gap: 4px; }
.fb-tab-btn { display: inline-flex; align-items: center; gap: 7px; padding: 6px 16px; border-radius: 20px; border: 1px solid transparent; background: none; cursor: pointer; color: var(--text-3); font-size: 13px; font-weight: 500; font-family: inherit; transition: all 0.15s; }
.fb-tab-btn svg { width: 14px; height: 14px; }
.fb-tab-btn:hover { color: var(--primary); background: var(--primary-dim); }
.fb-tab-btn.active { color: var(--primary); background: var(--primary-dim); border-color: rgba(22,93,255,0.25); font-weight: 600; }
.fb-tab-badge { background: var(--primary); color: white; font-size: 11px; padding: 1px 7px; border-radius: 10px; line-height: 16px; }

/* ── Stats Page ── */
.fb-stats-page { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }

/* KPI Grid */
.fb-kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
.fb-kpi-card { background: white; border-radius: 14px; padding: 18px 20px; display: flex; align-items: center; gap: 14px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: box-shadow 0.2s, transform 0.2s; position: relative; overflow: hidden; }
.fb-kpi-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }
.fb-kpi-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fb-kpi-icon svg { width: 18px; height: 18px; }
.kpi-primary .fb-kpi-icon { background: rgba(22,93,255,0.1); stroke: var(--primary); }
.kpi-primary .fb-kpi-icon svg { stroke: var(--primary); }
.kpi-purple .fb-kpi-icon { background: rgba(114,46,209,0.1); }
.kpi-purple .fb-kpi-icon svg { stroke: #722ED1; }
.kpi-green .fb-kpi-icon { background: rgba(0,180,42,0.1); }
.kpi-green .fb-kpi-icon svg { stroke: var(--success); }
.kpi-red .fb-kpi-icon { background: rgba(245,63,63,0.1); }
.kpi-red .fb-kpi-icon svg { stroke: var(--danger); }
.kpi-orange .fb-kpi-icon { background: rgba(255,125,0,0.1); }
.kpi-orange .fb-kpi-icon svg { stroke: #FF7D00; }
.kpi-teal .fb-kpi-icon { background: rgba(15,198,194,0.1); }
.kpi-teal .fb-kpi-icon svg { stroke: var(--info); }
.fb-kpi-body { flex: 1; min-width: 0; }
.fb-kpi-value { font-size: 26px; font-weight: 800; color: var(--text-1); line-height: 1; letter-spacing: -0.5px; }
.fb-kpi-label { font-size: 12px; color: var(--text-3); margin-top: 3px; }
.fb-kpi-trend svg { width: 20px; height: 20px; stroke: var(--success); opacity: 0.6; }
.fb-kpi-rate { font-size: 13px; font-weight: 700; padding: 3px 10px; border-radius: 20px; flex-shrink: 0; }
.rate-green { background: rgba(0,180,42,0.1); color: var(--success); }
.rate-red { background: rgba(245,63,63,0.1); color: var(--danger); }
.fb-kpi-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; flex-shrink: 0; }
.badge-on { background: rgba(0,180,42,0.1); color: var(--success); }
.badge-off { background: var(--surface-3); color: var(--text-3); }
.fb-kpi-sub { font-size: 11px; color: var(--text-3); flex-shrink: 0; }

/* Middle row */
.fb-mid-row { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }

/* Panel base */
.fb-panel { background: white; border-radius: 16px; padding: 22px 24px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.fb-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.fb-panel-title { font-size: 14px; font-weight: 700; color: var(--text-1); display: flex; align-items: center; gap: 8px; }
.fb-panel-title svg { width: 15px; height: 15px; stroke: var(--primary); }
.fb-panel-meta { font-size: 12px; color: var(--text-3); background: #F4F6FB; padding: 3px 12px; border-radius: 20px; }

/* Donut */
.fb-panel-donut { display: flex; flex-direction: column; }
.fb-donut-wrap { display: flex; align-items: center; gap: 20px; }
.fb-donut-svg { width: 120px; height: 120px; flex-shrink: 0; }
.fb-donut-legend { display: flex; flex-direction: column; gap: 12px; flex: 1; }
.fb-donut-leg-item { display: flex; align-items: center; gap: 10px; }
.fb-donut-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.fb-donut-leg-val { font-size: 18px; font-weight: 700; color: var(--text-1); line-height: 1; }
.fb-donut-leg-lbl { font-size: 11px; color: var(--text-3); margin-top: 1px; }

/* Distribution */
.fb-dist-list { display: flex; flex-direction: column; gap: 14px; }
.fb-dist-row { display: flex; align-items: center; gap: 10px; }
.fb-dist-label-wrap { display: flex; align-items: center; gap: 6px; width: 56px; flex-shrink: 0; }
.fb-dist-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.fb-dist-lbl { font-size: 12px; color: var(--text-2); }
.fb-dist-track { flex: 1; height: 24px; background: #F4F6FB; border-radius: 6px; overflow: hidden; }
.fb-dist-fill { height: 100%; border-radius: 6px; transition: width 0.7s cubic-bezier(0.4,0,0.2,1); min-width: 3px; }
.fb-dist-pct { width: 36px; text-align: right; font-size: 12px; font-weight: 600; color: var(--text-2); flex-shrink: 0; }
.fb-dist-num { width: 32px; text-align: right; font-size: 12px; color: var(--text-3); flex-shrink: 0; }

/* Trend */
.fb-panel-trend { }
.fb-trend-wrap { display: flex; gap: 0; height: 180px; }
.fb-trend-y { display: flex; flex-direction: column; justify-content: space-between; padding-right: 12px; font-size: 11px; color: var(--text-3); text-align: right; min-width: 28px; padding-bottom: 22px; }
.fb-trend-chart { flex: 1; position: relative; display: flex; flex-direction: column; }
.fb-trend-grid { position: absolute; inset: 0; bottom: 22px; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
.fb-trend-gridline { border-top: 1px dashed rgba(0,0,0,0.06); width: 100%; }
.fb-trend-bars { flex: 1; display: flex; align-items: flex-end; gap: 3px; border-bottom: 1px solid var(--border); padding-bottom: 22px; }
.fb-trend-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative; }
.fb-trend-bar-wrap { width: 100%; flex: 1; display: flex; align-items: flex-end; justify-content: center; }
.fb-trend-bar { width: 65%; max-width: 18px; min-height: 2px; background: linear-gradient(180deg, #6EA8FF, var(--primary)); border-radius: 3px 3px 0 0; transition: height 0.4s ease; opacity: 0.7; }
.fb-trend-bar:hover { opacity: 1; }
.fb-trend-bar.bar-peak { background: linear-gradient(180deg, #FFB340, #FF7D00); opacity: 1; }
.fb-trend-bar.bar-zero { opacity: 0.2; }
.fb-trend-lbl { position: absolute; bottom: -18px; font-size: 10px; color: var(--text-3); white-space: nowrap; transform: rotate(-30deg); transform-origin: top center; }

/* ── Sessions Layout ── */
.fb-body { flex: 1; display: flex; overflow: hidden; height: calc(100vh - 56px); }

/* Sidebar */
.fb-sidebar { width: 320px; min-width: 280px; background: white; border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
.fb-sidebar-header { padding: 14px 16px 0; flex-shrink: 0; }
.fb-sidebar-search { display: flex; align-items: center; gap: 8px; background: #F4F6FB; border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; transition: border-color 0.15s, box-shadow 0.15s; }
.fb-sidebar-search:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-dim); background: white; }
.fb-sidebar-search svg { width: 14px; height: 14px; stroke: var(--text-3); flex-shrink: 0; }
.fb-search-input { flex: 1; border: none; background: none; outline: none; font-size: 13px; color: var(--text-1); font-family: inherit; }
.fb-search-input::placeholder { color: var(--text-3); }
.fb-search-clear { background: none; border: none; cursor: pointer; padding: 0; display: flex; color: var(--text-3); transition: color 0.15s; }
.fb-search-clear:hover { color: var(--text-1); }
.fb-search-clear svg { width: 14px; height: 14px; }
.fb-sidebar-count { font-size: 12px; color: var(--text-3); padding: 8px 2px 10px; }
.fb-sidebar-count strong { color: var(--text-2); font-weight: 600; }

/* Rating filter */
.fb-rating-filter { display: flex; gap: 6px; padding: 10px 0 2px; }
.fb-filter-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border-strong); background: none; cursor: pointer; font-size: 12px; font-weight: 500; color: var(--text-3); font-family: inherit; transition: all 0.15s; }
.fb-filter-btn svg { width: 12px; height: 12px; }
.fb-filter-btn:hover { border-color: var(--text-2); color: var(--text-2); }
.fb-filter-btn.active { background: var(--text-1); color: white; border-color: var(--text-1); }
.fb-filter-btn.filter-like.active { background: var(--success); border-color: var(--success); color: white; }
.fb-filter-btn.filter-like.active svg { stroke: white; }
.fb-filter-btn.filter-dislike.active { background: var(--danger); border-color: var(--danger); color: white; }
.fb-filter-btn.filter-dislike.active svg { stroke: white; }
.fb-filter-btn.filter-like svg { stroke: var(--success); }
.fb-filter-btn.filter-dislike svg { stroke: var(--danger); }
.fb-sidebar-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--text-3); padding: 40px 20px; }
.fb-sidebar-empty svg { width: 36px; height: 36px; opacity: 0.3; }
.fb-sidebar-empty span { font-size: 13px; }
.fb-sidebar-list { flex: 1; overflow-y: auto; }

.fb-conv-item { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.12s; }
.fb-conv-item:hover { background: #F8F9FD; }
.fb-conv-item.active { background: var(--primary-dim); border-left: 3px solid var(--primary); }
.fb-conv-top { display: flex; gap: 10px; align-items: flex-start; }
.fb-conv-avatar { width: 34px; height: 34px; border-radius: 10px; background: #EEF3FF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.fb-conv-avatar svg { width: 16px; height: 16px; stroke: var(--primary); }
.fb-conv-item.active .fb-conv-avatar { background: rgba(22,93,255,0.15); }
.fb-conv-main { flex: 1; min-width: 0; }
.fb-conv-id-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.fb-conv-id { font-size: 12px; font-weight: 600; color: var(--text-1); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.fb-conv-time { font-size: 11px; color: var(--text-3); flex-shrink: 0; }
.fb-conv-bottom { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.fb-conv-count-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-3); }
.fb-conv-count-badge svg { width: 11px; height: 11px; }
.fb-conv-rating-tags { display: flex; align-items: center; gap: 4px; }
.fb-conv-tag { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 10px; }
.fb-conv-tag svg { width: 10px; height: 10px; }
.tag-like { background: rgba(0,180,42,0.1); color: var(--success); }
.tag-like svg { stroke: var(--success); }
.tag-dislike { background: rgba(245,63,63,0.1); color: var(--danger); }
.tag-dislike svg { stroke: var(--danger); }
.fb-copy-btn { background: none; border: 1px solid var(--border-strong); border-radius: 6px; padding: 3px 8px; cursor: pointer; color: var(--text-3); display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-family: inherit; opacity: 0; transition: opacity 0.15s, color 0.15s, border-color 0.15s; flex-shrink: 0; }
.fb-copy-btn svg { width: 11px; height: 11px; }
.fb-conv-item:hover .fb-copy-btn { opacity: 1; }
.fb-copy-btn:hover { color: var(--primary); border-color: var(--primary); background: var(--primary-dim); }

.fb-pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px; border-top: 1px solid var(--border); flex-shrink: 0; }
.fb-page-btn { background: white; border: 1px solid var(--border-strong); border-radius: 8px; padding: 6px 10px; cursor: pointer; color: var(--text-2); display: inline-flex; align-items: center; transition: all 0.15s; font-family: inherit; }
.fb-page-btn svg { width: 14px; height: 14px; }
.fb-page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: var(--primary-dim); }
.fb-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.fb-page-info { font-size: 12px; color: var(--text-3); }

/* Detail panel */
.fb-detail { flex: 1; overflow-y: auto; display: flex; flex-direction: column; background: #F4F6FB; }

.fb-detail-empty { display: flex; align-items: center; justify-content: center; height: 100%; }
.fb-detail-empty-inner { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.fb-detail-empty-icon { width: 72px; height: 72px; background: white; border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid var(--border); }
.fb-detail-empty-icon svg { width: 32px; height: 32px; stroke: var(--text-3); opacity: 0.5; }
.fb-detail-empty-title { font-size: 15px; font-weight: 600; color: var(--text-2); margin: 0; }
.fb-detail-empty-desc { font-size: 13px; color: var(--text-3); margin: 0; max-width: 240px; line-height: 1.5; }

.fb-detail-header { padding: 16px 24px; border-bottom: 1px solid var(--border); background: white; position: sticky; top: 0; z-index: 10; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.fb-detail-header-main { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
.fb-detail-header-icon { width: 38px; height: 38px; background: var(--primary-dim); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fb-detail-header-icon svg { width: 18px; height: 18px; stroke: var(--primary); }
.fb-detail-header-info { min-width: 0; }
.fb-detail-header-title { font-size: 13px; font-weight: 700; color: var(--text-1); }
.fb-detail-conv-id { font-size: 11px; color: var(--text-3); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 360px; }
.fb-detail-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.fb-detail-header-meta { display: flex; align-items: center; gap: 6px; }
.fb-detail-meta-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
.fb-detail-meta-chip svg { width: 12px; height: 12px; }
.chip-feedback { background: #F4F6FB; color: var(--text-2); }
.chip-feedback svg { stroke: var(--text-3); }
.chip-like { background: rgba(0,180,42,0.1); color: var(--success); }
.chip-like svg { stroke: var(--success); }
.chip-dislike { background: rgba(245,63,63,0.1); color: var(--danger); }
.chip-dislike svg { stroke: var(--danger); }
.fb-action-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: 1px solid var(--border-strong); border-radius: 8px; padding: 6px 14px; cursor: pointer; color: var(--text-2); font-size: 12px; font-family: inherit; transition: all 0.15s; flex-shrink: 0; }
.fb-action-btn svg { width: 13px; height: 13px; }
.fb-action-btn:hover { color: var(--primary); border-color: var(--primary); background: var(--primary-dim); }

/* Messages */
.fb-messages { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.fb-msg-row { display: flex; }
.fb-msg-row.user { justify-content: flex-end; }
.fb-user-wrap { display: flex; align-items: flex-end; gap: 10px; max-width: 72%; }
.fb-user-bubble { background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; border-radius: 18px 4px 18px 18px; padding: 12px 16px; font-size: 14px; line-height: 1.65; box-shadow: 0 2px 8px rgba(22,93,255,0.2); }
.fb-user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #EEF3FF; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fb-user-avatar svg { width: 15px; height: 15px; stroke: var(--primary); }
.fb-assistant-wrap { display: flex; align-items: flex-end; gap: 10px; max-width: 80%; }
.fb-bot-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.fb-bot-avatar img { width: 100%; height: 100%; object-fit: cover; }
.fb-assistant-bubble { background: white; border: 1px solid var(--border); border-radius: 4px 18px 18px 18px; padding: 12px 16px; font-size: 14px; line-height: 1.65; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }

/* Feedback section */
.fb-feedback-section { margin: 0 24px 32px; }
.fb-feedback-section-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 0 14px; border-top: 1px dashed var(--border-strong); margin-bottom: 4px; }
.fb-feedback-section-title { font-size: 13px; font-weight: 700; color: var(--text-2); display: flex; align-items: center; gap: 7px; }
.fb-feedback-section-title svg { width: 14px; height: 14px; stroke: var(--warning); }
.fb-feedback-count-badge { font-size: 11px; font-weight: 600; background: #F4F6FB; color: var(--text-3); padding: 2px 10px; border-radius: 20px; }

/* Timeline */
.fb-timeline { display: flex; flex-direction: column; gap: 0; }
.fb-timeline-item { display: flex; gap: 0; position: relative; padding-bottom: 16px; }
.fb-timeline-line { position: absolute; left: 15px; top: 32px; bottom: 0; width: 2px; background: var(--border); }
.fb-timeline-item:last-child .fb-timeline-line { display: none; }
.fb-timeline-dot-wrap { width: 32px; flex-shrink: 0; display: flex; justify-content: center; padding-top: 10px; }
.fb-timeline-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 0 2px currentColor; flex-shrink: 0; }
.fb-timeline-dot svg { width: 13px; height: 13px; }
.tdot-like { color: var(--success); background: rgba(0,180,42,0.12); }
.tdot-like svg { stroke: var(--success); }
.tdot-dislike { color: var(--danger); background: rgba(245,63,63,0.12); }
.tdot-dislike svg { stroke: var(--danger); }
.tdot-null { color: var(--text-3); background: #F4F6FB; }
.tdot-null svg { stroke: var(--text-3); }
.fb-timeline-card { flex: 1; background: white; border-radius: 12px; padding: 14px 16px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-left: 10px; }
.tcard-like { border-left: 3px solid var(--success); }
.tcard-dislike { border-left: 3px solid var(--danger); }
.tcard-null { border-left: 3px solid var(--border-strong); }
.fb-timeline-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.fb-timeline-index { font-size: 11px; color: var(--text-3); font-weight: 600; background: #F4F6FB; padding: 1px 7px; border-radius: 10px; }
.fb-rating-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 20px; }
.badge-like { background: rgba(0,180,42,0.1); color: var(--success); }
.badge-dislike { background: rgba(245,63,63,0.1); color: var(--danger); }
.badge-null { background: var(--surface-3); color: var(--text-3); }
.fb-timeline-time { font-size: 11px; color: var(--text-3); margin-left: auto; }
.fb-timeline-content { font-size: 13px; color: var(--text-1); line-height: 1.6; margin-bottom: 10px; display: flex; gap: 8px; align-items: flex-start; }
.fb-timeline-content svg { width: 14px; height: 14px; stroke: var(--text-3); flex-shrink: 0; margin-top: 2px; }
.fb-timeline-no-content { font-size: 12px; color: var(--text-3); font-style: italic; margin-bottom: 10px; }
.fb-timeline-meta { display: flex; gap: 14px; flex-wrap: wrap; }
.fb-meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-3); }
.fb-meta-item svg { width: 11px; height: 11px; }

/* Toast */
.fb-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1D2129; color: white; padding: 10px 20px; border-radius: 10px; font-size: 13px; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 9999; animation: toast-in 0.2s ease; }
.fb-toast svg { width: 14px; height: 14px; stroke: var(--success); }
@keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* Responsive */
@media (max-width: 1200px) { .fb-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) { .fb-kpi-grid { grid-template-columns: repeat(2, 1fr); } .fb-mid-row { grid-template-columns: 1fr; } }
</style>
