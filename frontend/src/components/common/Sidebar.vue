<template>
  <aside class="j-sidebar" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Brand Header with JMX Logo -->
    <div class="sidebar-brand" :class="{ 'is-collapsed': isCollapsed }">
      <router-link to="/" class="brand-link" :title="isCollapsed ? 'JMETRIX — Dashboard' : 'JMETRIX — Plataforma de Performance JMeter'">
        <JmxLogo size="md" :withText="!isCollapsed" />
      </router-link>
      <button v-if="!isCollapsed" class="toggle-btn" @click="toggleSidebar" title="Recolher Menu Lateral">
        <ChevronLeft :size="16" />
      </button>
    </div>

    <!-- Running Test Indicator Badge in Sidebar -->
    <div v-if="hasRunningTest && !isCollapsed" class="running-indicator-badge">
      <span class="pulsing-radar"></span>
      <div class="running-badge-text">
        <span class="badge-title">Motor JMeter Ativo</span>
        <span class="badge-sub font-mono">{{ state.liveTelemetry?.elapsedSec || 0 }}s &bull; {{ state.liveTelemetry?.activeThreads || state.runningTest?.vus || 1 }} VUs</span>
      </div>
    </div>

    <!-- Categorized Navigation Menu -->
    <nav class="sidebar-nav">
      <!-- Sections -->
      <div class="menu-section" v-for="section in menuSections" :key="section.title">
        <span v-if="!isCollapsed && section.title" class="section-heading">{{ section.title }}</span>
        
        <div class="section-items">
          <router-link
            v-for="item in section.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ 'is-active': isActive(item.path), 'has-badge': item.hasRunningBadge && hasRunningTest }"
            :title="item.label"
          >
            <div class="nav-icon-wrapper">
              <component :is="item.icon" :size="18" />
            </div>
            <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
            <span v-if="!isCollapsed && item.hasRunningBadge && hasRunningTest" class="live-pill">AO VIVO</span>
            <span v-if="!isCollapsed && item.tag" class="menu-tag font-mono">{{ item.tag }}</span>
          </router-link>
        </div>
      </div>

      <!-- Quick Action: Guia e Dicionário JMeter -->
      <div class="menu-section">
        <span v-if="!isCollapsed" class="section-heading">APRENDIZADO & SUPORTE</span>
        <button
          class="nav-item guide-trigger-btn"
          @click="openJmeterGuide"
          :title="isCollapsed ? 'Guia & Glossário JMeter (Ajuda)' : 'Guia do Apache JMeter e Testes de Carga'"
        >
          <div class="nav-icon-wrapper text-cyan">
            <BookOpen :size="18" />
          </div>
          <span v-if="!isCollapsed" class="nav-label">Guia & Glossário JMeter</span>
          <span v-if="!isCollapsed" class="badge-help">AJUDA</span>
        </button>
      </div>
    </nav>

    <!-- Footer System Status & Toggle Expand/Collapse -->
    <div class="sidebar-footer">
      <div v-if="!isCollapsed" class="engine-status-box">
        <div class="status-indicator">
          <span class="pulsing-dot"></span>
          <span class="engine-title">Apache JMeter 5.6.3</span>
        </div>
        <span class="engine-subtitle">Motor CLI + Java SE Operacionais</span>
      </div>

      <button
        class="collapse-toggle-bar"
        :class="{ 'is-collapsed': isCollapsed }"
        @click="toggleSidebar"
        :title="isCollapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral'"
      >
        <component :is="isCollapsed ? ChevronRight : ChevronLeft" :size="16" />
        <span v-if="!isCollapsed" class="collapse-label">Recolher Menu</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import JmxLogo from './JmxLogo.vue';
import { useJMetrixStore } from '../../composables/useJMetrixStore.js';
import { useI18n } from '../../composables/useI18n.js';
import {
  LayoutDashboard,
  Zap,
  History,
  GitCompare,
  Globe,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-vue-next';

const route = useRoute();
const { t } = useI18n();
const { state, hasRunningTest, openJmeterGuide } = useJMetrixStore();
const isCollapsed = ref(false);

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
}

const menuSections = computed(() => [
  {
    title: 'EXECUÇÃO & MONITORAMENTO',
    items: [
      { path: '/', label: t('nav.overview'), icon: LayoutDashboard },
      { path: '/new', label: t('nav.newAnalysis'), icon: Zap, hasRunningBadge: true },
      { path: '/compare', label: 'Comparador de Testes', icon: GitCompare, tag: 'VS' }
    ]
  },
  {
    title: 'APLICAÇÕES & RESULTADOS',
    items: [
      { path: '/history', label: t('nav.history'), icon: History },
      { path: '/sites', label: t('nav.sites'), icon: Globe },
      { path: '/reports', label: t('nav.reports'), icon: FileBarChart, tag: 'JMX' }
    ]
  },
  {
    title: 'SISTEMA',
    items: [
      { path: '/settings', label: t('nav.settings'), icon: Settings }
    ]
  }
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
  transition: width 0.18s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease;
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
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-subtle);
  transition: all 0.18s ease;
  overflow: hidden;
}

.sidebar-brand.is-collapsed {
  padding: 0;
  justify-content: center;
}

.brand-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: transform 0.15s ease;
}

.sidebar-brand.is-collapsed .brand-link {
  justify-content: center;
  width: 100%;
}

.brand-link:hover {
  transform: scale(1.02);
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
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle-btn:hover {
  background: var(--bg-surface);
  color: var(--text-main);
}

.running-indicator-badge {
  margin: 12px 14px 4px 14px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(0, 240, 255, 0.1));
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pulsing-radar {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00f0ff;
  box-shadow: 0 0 10px #00f0ff;
  animation: pulseRing 1.4s infinite ease-in-out;
  flex-shrink: 0;
}

.running-badge-text {
  display: flex;
  flex-direction: column;
}

.badge-title {
  font-size: 11px;
  font-weight: 800;
  color: #00f0ff;
  text-transform: uppercase;
}

.badge-sub {
  font-size: 10.5px;
  color: var(--text-muted);
}

.sidebar-nav {
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-heading {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-subtle);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 0 10px 4px 10px;
}

.section-items {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 9px;
  color: var(--text-muted);
  font-weight: 600;
  transition: all 0.12s ease;
  text-decoration: none;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.j-sidebar.is-collapsed .nav-item {
  justify-content: center;
  padding: 10px 0;
  gap: 0;
}

.nav-item:hover {
  color: var(--text-main);
  background: var(--bg-surface);
}

.nav-item.is-active {
  color: var(--electric-blue);
  background: var(--blue-glow);
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 2px 8px var(--blue-glow);
}

.nav-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.12s ease;
}

.nav-item:hover .nav-icon-wrapper {
  transform: scale(1.08);
}

.nav-label {
  white-space: nowrap;
  font-size: 13px;
  flex: 1;
}

.live-pill {
  font-size: 9px;
  font-weight: 800;
  color: #ffffff;
  background: #ef4444;
  padding: 1px 6px;
  border-radius: 4px;
  animation: pulseRing 1.5s infinite ease-in-out;
}

.menu-tag {
  font-size: 9.5px;
  font-weight: 700;
  color: var(--text-subtle);
  background: var(--bg-card);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}

.badge-help {
  font-size: 8.5px;
  font-weight: 800;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.12);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid rgba(0, 240, 255, 0.25);
  flex-shrink: 0;
  margin-left: auto;
}

.guide-trigger-btn {
  border: 1px dashed rgba(0, 240, 255, 0.3);
  background: rgba(0, 240, 255, 0.04);
  gap: 8px;
  padding: 8px 10px;
}

.guide-trigger-btn .nav-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guide-trigger-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: #00f0ff;
}

.j-sidebar.is-collapsed .guide-trigger-btn {
  justify-content: center;
  padding: 10px 0;
}

.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.j-sidebar.is-collapsed .sidebar-footer {
  padding: 10px 6px;
}

.engine-status-box {
  background: var(--success-bg);
  border: 1px solid rgba(5, 150, 105, 0.25);
  border-radius: 9px;
  padding: 8px 10px;
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
  font-size: 11.5px;
  font-weight: 800;
  color: var(--success);
}

.engine-subtitle {
  font-size: 10px;
  color: var(--text-muted);
}

.collapse-toggle-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--text-muted);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.12s ease;
  font-size: 11.5px;
  font-weight: 600;
}

.collapse-toggle-bar:hover {
  background: var(--bg-surface-hover);
  color: var(--electric-blue);
  border-color: rgba(37, 99, 235, 0.3);
}

.collapse-toggle-bar.is-collapsed {
  justify-content: center;
  padding: 9px 0;
}
</style>
