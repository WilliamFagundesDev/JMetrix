<template>
  <div class="live-engine-widget glass-panel">
    <div class="engine-top">
      <div class="engine-header">
        <JmxLogo size="sm" :withText="false" />
        <div class="engine-header-info">
          <div class="engine-title-row">
            <h3 class="engine-title">{{ t('engineWidget.runningTitle') }}</h3>
            <span class="jmx-telemetry-tag font-mono">JMX TELEMETRY</span>
          </div>
          <p class="engine-subtitle" :title="`${testName} • ${targetUrl}`">
            <span class="subtitle-name">{{ testName }}</span>
            <span class="subtitle-dot">&bull;</span>
            <span class="subtitle-url">{{ targetUrl }}</span>
          </p>
        </div>
      </div>
      <div class="engine-stage">
        <span class="stage-tag">{{ stageText }}</span>
      </div>
    </div>

    <!-- Central Telemetry Visualizer -->
    <div class="telemetry-grid">
      <div class="core-visualizer">
        <div class="radar-circle circle-outer"></div>
        <div class="radar-circle circle-mid"></div>
        <div class="radar-circle circle-inner">
          <div class="core-glow"></div>
          <span class="core-icon">⚡</span>
          <span class="core-vus">{{ activeVus }}</span>
          <span class="core-label">{{ t('engineWidget.activeVUs') }}</span>
        </div>
      </div>

      <div class="stats-col">
        <div class="stat-box">
          <span class="stat-label">{{ t('engineWidget.completedRequests') }}</span>
          <span class="stat-value text-cyan">{{ requestsCount.toLocaleString() }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">{{ t('engineWidget.instantThroughput') }}</span>
          <span class="stat-value text-blue">{{ throughput }} <span class="unit">req/s</span></span>
        </div>
        <div class="stat-box">
          <span class="stat-label">{{ t('engineWidget.avgResponseTime') }}</span>
          <span class="stat-value">{{ avgTime }} <span class="unit">ms</span></span>
        </div>
        <div class="stat-box">
          <span class="stat-label">{{ t('engineWidget.failuresErrors') }}</span>
          <span class="stat-value" :class="errorsCount > 0 ? 'text-red' : 'text-green'">{{ errorsCount }}</span>
        </div>
      </div>
    </div>

    <!-- Progress Bar & Actions -->
    <div class="engine-bottom">
      <div class="progress-info">
        <span>{{ t('engineWidget.progressTitle', { elapsed: elapsedSec }) }}</span>
        <span class="progress-percent">{{ progressPercent }}%</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>

      <div class="engine-controls">
        <span class="disclaimer-note">{{ t('engineWidget.realtimeNote') }}</span>
        <BaseButton variant="danger" size="sm" @click="$emit('cancel')">
          {{ t('engineWidget.cancelExecution') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import BaseButton from './BaseButton.vue';
import JmxLogo from './JmxLogo.vue';

const { t } = useI18n();

const props = defineProps({
  testName: { type: String, default: 'Análise de Desempenho' },
  targetUrl: { type: String, default: '' },
  stage: { type: String, default: 'running' },
  progressPercent: { type: Number, default: 0 },
  elapsedSec: { type: Number, default: 0 },
  activeVus: { type: Number, default: 0 },
  requestsCount: { type: Number, default: 0 },
  throughput: { type: Number, default: 0 },
  avgTime: { type: Number, default: 0 },
  errorsCount: { type: Number, default: 0 }
});

defineEmits(['cancel']);

const stageText = computed(() => {
  if (props.stage === 'preparing') return t('engineWidget.stagePreparing');
  if (props.stage === 'running') return t('engineWidget.stageRunning');
  if (props.stage === 'finalizing') return t('engineWidget.stageFinalizing');
  return t('engineWidget.stageExecuting');
});
</script>

<style scoped>
.live-engine-widget {
  border-radius: 16px;
  padding: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg), 0 0 30px var(--blue-glow);
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

.engine-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 16px;
  gap: 16px;
  min-width: 0;
}

.engine-header {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.engine-header-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.engine-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pulse-indicator {
  position: relative;
  width: 16px;
  height: 16px;
}

.pulse-core {
  width: 12px;
  height: 12px;
  background: var(--cyan-accent);
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  box-shadow: 0 0 12px var(--cyan-accent);
}

.pulse-wave {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid var(--cyan-accent);
  animation: pulseRing 1.8s infinite ease-out;
}

.jmx-telemetry-tag {
  font-size: 10px;
  font-weight: 800;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.12);
  border: 1px solid rgba(0, 240, 255, 0.3);
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.engine-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
}

.engine-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

.subtitle-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

.subtitle-dot {
  flex-shrink: 0;
}

.subtitle-url {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.engine-stage {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.stage-tag {
  background: var(--info-bg);
  color: var(--cyan-accent);
  border: 1px solid rgba(2, 132, 199, 0.35);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1.3;
}

.telemetry-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 32px;
  align-items: center;
  padding: 10px 0;
}

.core-visualizer {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-circle {
  position: absolute;
  border-radius: 50%;
}

.circle-outer {
  width: 100%;
  height: 100%;
  border: 1px dashed rgba(37, 99, 235, 0.4);
  animation: spinSlow 20s linear infinite;
}

.circle-mid {
  width: 80%;
  height: 80%;
  border: 1px solid rgba(2, 132, 199, 0.3);
  animation: spinSlow 12s linear infinite reverse;
}

.circle-inner {
  width: 60%;
  height: 60%;
  background: var(--bg-surface);
  border: 2px solid var(--cyan-accent);
  box-shadow: 0 0 25px var(--cyan-glow);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.core-icon {
  font-size: 14px;
}

.core-vus {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main);
  font-family: var(--font-mono);
  line-height: 1;
}

.core-label {
  font-size: 9px;
  text-transform: uppercase;
  color: var(--cyan-accent);
  letter-spacing: 0.5px;
  font-weight: 700;
}

.stats-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 14px 16px;
}

.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-main);
}

.stat-value .unit {
  font-size: 12px;
  color: var(--text-subtle);
  font-weight: 400;
}

.text-cyan { color: var(--cyan-accent); }
.text-blue { color: var(--electric-blue); }
.text-green { color: var(--success); }
.text-red { color: var(--danger); }

.engine-bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--text-muted);
}

.progress-percent {
  font-weight: 700;
  color: var(--cyan-accent);
  font-family: var(--font-mono);
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: var(--bg-surface);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--electric-blue), var(--cyan-accent));
  border-radius: 4px;
  transition: width 0.8s ease;
  box-shadow: 0 0 10px var(--cyan-glow);
}

.engine-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.disclaimer-note {
  font-size: 11.5px;
  color: var(--text-subtle);
}

@media (max-width: 640px) {
  .engine-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .telemetry-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .stats-col {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
}

@media (max-width: 440px) {
  .stats-col {
    grid-template-columns: 1fr;
  }
}
</style>
