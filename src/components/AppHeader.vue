<template>
  <header class="bg-white shadow-sm sticky top-0 z-50">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <router-link to="/" class="flex items-center gap-2 no-underline">
        <i class="fa fa-database text-primary text-2xl"></i>
        <h1 class="text-xl font-bold text-primary m-0">智能数据库管理平台</h1>
      </router-link>
      <nav class="hidden md:flex items-center gap-1">
        <router-link
          v-for="item in navItems"
          :key="item.route"
          :to="item.route"
          class="nav-link"
          :class="{ active: isActive(item.route) }"
        >
          {{ item.label }}
        </router-link>
      </nav>
      <button class="md:hidden text-primary text-xl" @click="showMobile = !showMobile">
        <i class="fa" :class="showMobile ? 'fa-times' : 'fa-bars'"></i>
      </button>
    </div>
  </header>
  <div v-if="showMobile" class="md:hidden bg-white shadow-md px-4 py-2 flex flex-col gap-1">
    <router-link
      v-for="item in navItems"
      :key="item.route"
      :to="item.route"
      class="nav-link whitespace-nowrap"
      :class="{ active: isActive(item.route) }"
      @click="showMobile = false"
    >
      {{ item.label }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showMobile = ref(false)

const navItems = [
  { label: '智能评估', route: '/install' },
  { label: '智能迁移', route: '/migrate' },
  { label: '报错答疑', route: '/support' },
  { label: '运维监控', route: '/monitor' },
]

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
