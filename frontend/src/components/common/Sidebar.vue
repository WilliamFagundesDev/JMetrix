<template>
  <aside class="j-sidebar" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Brand Header -->
    <div class="sidebar-brand">
      <div class="logo-mark">
        <svg viewBox="0 0 100 100" class="brand-svg">
          <defs>
            <linearGradient id="sbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0284c7" />
              <stop offset="100%" stop-color="#2563eb" />
            </linearGradient>
          </defs>
          <path d="M28 24 L52 24 C64 24 72 32 72 44 C72 56 64 64 52 64 L40 64 L40 76" stroke="url(#sbGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="70" cy="72" r="6" fill="#0284c7" />
        </svg>
      </div>
      <div v-if="!isCollapsed" class="brand-info">
        <span class="brand-name">JMETRIX</span>
        <span class="brand-slogan">{{ t('nav.slogan') }}</span>
      </div>
      <button class="toggle-btn" @click="toggleSidebar" :title="isCollapsed ? 'Expandir' : 'Recolher'">
        <component :is="isCollapsed ? ChevronRight : ChevronLeft" :size="16" />
      </button>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ 'is-active': isActive(item.path) }"
      >
        <div class="nav-icon-wrapper">
          <component :is="item.icon" :size="19" />
        </div>
        <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- Footer System Status -->
    <div class="sidebar-footer" v-if="!isCollapsed">
      <div class="engine-status-box">
        <div class="status-indicator">
          <span class="pulsing-dot"></span>
          <span class="engine-title">{{ t('nav.engineStatus') }}</span>
        </div>
        <span class="engine-subtitle">{{ t('nav.engineReady') }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from '../../composables/useI18n.js';
import {
  LayoutDashboard,
  Zap,
  History,
  Globe,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next';

const route = useRoute();
const { t } = useI18n();
const isCollapsed = ref(false);

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
}

const menuItems = computed(() => [
  { path: '/', label: t('nav.overview'), icon: LayoutDashboard },
  { path: '/new', label: t('nav.newAnalysis'), icon: Zap },
  { path: '/history', label: t('nav.history'), icon: History },
  { path: '/sites', label: t('nav.sites'), icon: Globe },
  { path: '/reports', label: t('nav.reports'), icon: FileBarChart },
  { path: '/settings', label: t('nav.settings'), icon: Settings }
]);

function isActive(path) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}
</script>

<style scoped>
.j-sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal), background-color 0.25s ease, border-color 0.25s ease;
  position: sticky;
  top: 0;
  z-index: 50;
  user-select: none;
}

.j-sidebar.is-collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar-brand {
  height: var(--navbar-height);
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.logo-mark {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--blue-glow);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-svg {
  width: 26px;
  height: 26px;
}

.brand-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.brand-name {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #0284c7, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-slogan {
  font-size: 10px;
  color: var(--text-subtle);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toggle-btn {
  color: var(--text-muted);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.toggle-btn:hover {
  background: var(--bg-surface);
  color: var(--text-main);
}

.sidebar-nav {
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  color: var(--text-muted);
  font-weight: 600;
  transition: all var(--transition-fast);
  position: relative;
}

.nav-item:hover {
  color: var(--text-main);
  background: var(--bg-surface);
}

.nav-item.is-active {
  color: var(--electric-blue);
  background: var(--blue-glow);
  border: 1px solid rgba(37, 99, 235, 0.25);
  box-shadow: 0 2px 8px var(--blue-glow);
}

.nav-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.nav-item:hover .nav-icon-wrapper {
  transform: scale(1.1);
}

.nav-label {
  white-space: nowrap;
  font-size: 13.5px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-subtle);
}

.engine-status-box {
  background: var(--success-bg);
  border: 1px solid rgba(5, 150, 105, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulsing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 8px var(--success);
  animation: pulseRing 2s infinite ease-in-out;
}

.engine-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--success);
}

.engine-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
