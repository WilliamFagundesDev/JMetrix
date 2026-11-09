<template>
  <div class="app-layout">
    <!-- Collapsible Sidebar with New Categorized Menu -->
    <Sidebar />

    <!-- Main Content Container -->
    <div class="app-main">
      <Navbar />

      <!-- Global Running Test Persistent Bar (Shows when any JMeter execution is active in background) -->
      <transition name="slide-down">
        <div v-if="hasRunningTest" class="global-running-banner">
          <div class="banner-pulse-dot"></div>
          <div class="banner-info">
            <span class="banner-title">Teste Apache JMeter em Andamento</span>
            <span class="banner-meta font-mono">
              {{ state.runningTest?.name || state.runningTest?.id }} &bull; 
              {{ state.liveTelemetry?.elapsedSec || 0 }}s &bull; 
              {{ state.liveTelemetry?.throughput || 0 }} req/s &bull; 
              {{ state.liveTelemetry?.errorCount || 0 }} erros
            </span>
          </div>
          <div class="banner-actions">
            <router-link to="/new" class="btn-banner-view">
              Ver Telemetria
            </router-link>
            <button class="btn-banner-cancel" @click="cancelRunningTest()">
              Cancelar Teste
            </button>
          </div>
        </div>
      </transition>

      <main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>

    <!-- Global Modals: Interactive JMeter Guide & JMX XML Inspector -->
    <JmeterGuideModal
      :isOpen="state.isGuideOpen"
      @close="closeJmeterGuide"
    />

    <JmxPlanInspectorModal
      :test="state.inspectingJmxTest"
      @close="closeJmxInspector"
    />

    <!-- Global Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Sidebar from './components/common/Sidebar.vue';
import Navbar from './components/common/Navbar.vue';
import ToastContainer from './components/common/ToastContainer.vue';
import JmeterGuideModal from './components/common/JmeterGuideModal.vue';
import JmxPlanInspectorModal from './components/common/JmxPlanInspectorModal.vue';
import { useJMetrixStore } from './composables/useJMetrixStore.js';

const {
  state,
  hasRunningTest,
  refreshOverview,
  refreshEnvironment,
  cancelRunningTest,
  closeJmeterGuide,
  closeJmxInspector
} = useJMetrixStore();

onMounted(() => {
  refreshOverview();
  refreshEnvironment();
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: var(--bg-primary);
  overflow-x: hidden;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
}

.global-running-banner {
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.95), rgba(14, 165, 233, 0.95));
  color: #ffffff;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  z-index: 35;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.banner-pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00f0ff;
  box-shadow: 0 0 10px #00f0ff;
  animation: pulseRing 1.5s infinite ease-in-out;
  flex-shrink: 0;
}

.banner-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.banner-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.banner-meta {
  font-size: 11px;
  opacity: 0.9;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-banner-view {
  background: #ffffff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 6px;
  text-decoration: none;
  transition: transform var(--transition-fast);
}

.btn-banner-view:hover {
  transform: translateY(-1px);
}

.btn-banner-cancel {
  background: rgba(0, 0, 0, 0.25);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-banner-cancel:hover {
  background: rgba(239, 68, 68, 0.8);
}

.page-content {
  flex: 1;
  padding: 24px 28px;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}
</style>