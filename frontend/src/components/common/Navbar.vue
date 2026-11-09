<template>
  <header class="j-navbar">
    <div class="nav-left">
      <div class="title-with-badge">
        <h1 class="page-title">{{ pageTitle }}</h1>
        <span class="jmx-header-pill">JMX ENGINE</span>
      </div>
      <span v-if="pageSubtitle" class="page-subtitle">{{ pageSubtitle }}</span>
    </div>

    <div class="nav-right">
      <!-- Quick JMeter Guide Button -->
      <button class="btn-guide-pill" @click="openJmeterGuide" title="Abrir Dicionário e Guia de Testes do JMeter">
        <BookOpen :size="14" class="text-cyan" />
        <span>Guia JMeter</span>
      </button>

      <!-- Language Selector (PT / EN / ES) -->
      <div class="lang-selector-group">
        <button
          v-for="lang in availableLanguages"
          :key="lang.code"
          class="lang-pill"
          :class="{ 'is-active': locale === lang.code }"
          @click="setLocale(lang.code)"
          :title="lang.label"
        >
          <span class="flag-icon">{{ lang.flag }}</span>
          <span class="lang-code">{{ lang.code.toUpperCase() }}</span>
        </button>
      </div>

      <!-- Theme Switcher (Sun / Moon) -->
      <button
        class="theme-toggle-btn"
        @click="toggleTheme"
        :title="theme === 'light' ? 'Mudar para Tema Escuro' : 'Mudar para Tema Claro'"
        aria-label="Alternar tema"
      >
        <transition name="scale" mode="out-in">
          <Sun v-if="theme === 'light'" class="theme-icon-animate sun-icon" :size="18" />
          <Moon v-else class="theme-icon-animate moon-icon" :size="18" />
        </transition>
      </button>

      <!-- Engine Status Pill -->
      <div class="status-pill" :class="{ 'is-running': hasRunningTest }">
        <span class="pulse-light" :class="{ 'pulse-orange': hasRunningTest }"></span>
        <span class="status-text">{{ hasRunningTest ? 'JMeter Executando' : t('header.envActive') }}</span>
      </div>

      <!-- Action Button -->
      <router-link to="/new" class="btn-new-analysis">
        <Zap :size="15" />
        <span>{{ t('header.btnNew') }}</span>
      </router-link>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from '../../composables/useTheme.js';
import { useI18n } from '../../composables/useI18n.js';
import { useJMetrixStore } from '../../composables/useJMetrixStore.js';
import { Zap, Sun, Moon, BookOpen } from 'lucide-vue-next';

const route = useRoute();
const { theme, toggleTheme } = useTheme();
const { locale, setLocale, t } = useI18n();
const { hasRunningTest, openJmeterGuide } = useJMetrixStore();

const availableLanguages = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' }
];

const pageTitle = computed(() => {
  if (route.path.startsWith('/test/')) return t('header.resultsTitle');
  if (route.path.startsWith('/compare')) return t('header.compareTitle');
  if (route.path.startsWith('/sites/')) return t('header.siteDetailTitle');
  if (route.path === '/new') return t('header.newAnalysisTitle');
  if (route.path === '/history') return t('header.historyTitle');
  if (route.path === '/sites') return t('header.sitesTitle');
  if (route.path === '/reports') return t('header.reportsTitle');
  if (route.path === '/settings') return t('header.settingsTitle');
  return t('header.overviewTitle');
});

const pageSubtitle = computed(() => {
  if (route.path.startsWith('/test/')) return t('header.resultsSubtitle');
  if (route.path.startsWith('/compare')) return t('header.compareSubtitle');
  if (route.path === '/new') return t('header.newAnalysisSubtitle');
  if (route.path === '/history') return t('header.historySubtitle');
  if (route.path === '/sites') return t('header.sitesSubtitle');
  if (route.path === '/reports') return t('header.reportsSubtitle');
  if (route.path === '/settings') return t('header.settingsSubtitle');
  return t('header.overviewSubtitle');
});
</script>

<style scoped>
.j-navbar {
  height: var(--navbar-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 40;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.nav-left {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  margin-right: 16px;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.page-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.3px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.jmx-header-pill {
  font-size: 9.5px;
  font-weight: 800;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.25);
  padding: 1px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.page-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.btn-guide-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  padding: 6px 12px;
  border-radius: 18px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-guide-pill:hover {
  background: var(--bg-surface-hover);
  border-color: #00f0ff;
  color: #00f0ff;
}

/* Language Selector Pills */
.lang-selector-group {
  display: flex;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 3px;
  border-radius: 20px;
  gap: 2px;
}

.lang-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  transition: all var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
}

.lang-pill:hover {
  color: var(--text-main);
}

.lang-pill.is-active {
  background: var(--bg-card);
  color: var(--electric-blue);
  box-shadow: var(--shadow-sm);
}

.flag-icon {
  font-size: 12px;
}

/* Theme Switcher Sun/Moon */
.theme-toggle-btn {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.theme-toggle-btn:hover {
  background: var(--bg-surface-hover);
  border-color: var(--electric-blue);
  transform: scale(1.05);
}

.sun-icon {
  color: #f59e0b;
}

.moon-icon {
  color: #38bdf8;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--success-bg);
  border: 1px solid rgba(5, 150, 105, 0.25);
  padding: 6px 13px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--success);
}

.status-pill.is-running {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.35);
  color: #f59e0b;
}

.pulse-light {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 8px var(--success);
  animation: pulseRing 2s infinite ease-in-out;
}

.pulse-light.pulse-orange {
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
}

.btn-new-analysis {
  display: flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, var(--electric-blue), #1d4ed8);
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 2px 10px var(--blue-glow);
  transition: all var(--transition-fast);
  text-decoration: none;
}

.btn-new-analysis:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 18px var(--blue-glow);
  color: #ffffff;
}

@media (max-width: 1100px) {
  .btn-guide-pill span {
    display: none;
  }
  .btn-guide-pill {
    padding: 7px;
    border-radius: 50%;
  }
}

@media (max-width: 950px) {
  .page-subtitle {
    display: none;
  }
  .status-text {
    display: none;
  }
  .status-pill {
    padding: 7px 10px;
  }
}
</style>