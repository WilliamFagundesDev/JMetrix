<template>
  <div class="apdex-card j-card">
    <div class="apdex-header">
      <span class="apdex-label font-mono">{{ t('testResults.apdexTitle') }}</span>
      <span class="apdex-badge" :class="tierClass">{{ tierName }}</span>
    </div>

    <div class="apdex-visual">
      <div class="apdex-meter">
        <svg viewBox="0 0 100 55" class="meter-svg">
          <!-- Background arc -->
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            :stroke="meterTrackColor"
            stroke-width="8"
            stroke-linecap="round"
          />
          <!-- Value arc -->
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            :stroke="meterColor"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="251"
            :stroke-dashoffset="dashOffset"
            class="meter-fill"
          />
        </svg>
        <div class="apdex-score-display">
          <span class="apdex-number font-mono">{{ score.toFixed(2) }}</span>
          <span class="apdex-max">/ 1.00</span>
        </div>
      </div>
    </div>

    <div class="apdex-breakdown" v-if="details">
      <div class="breakdown-item">
        <span class="dot dot-green"></span>
        <span class="item-label">Satisfeitos (T &le; 500ms):</span>
        <span class="item-value font-mono">{{ details.satisfied?.toLocaleString('pt-BR') || 0 }}</span>
      </div>
      <div class="breakdown-item">
        <span class="dot dot-amber"></span>
        <span class="item-label">Tolerantes (&le; 2000ms):</span>
        <span class="item-value font-mono">{{ details.tolerating?.toLocaleString('pt-BR') || 0 }}</span>
      </div>
      <div class="breakdown-item">
        <span class="dot dot-red"></span>
        <span class="item-label">Frustrados (> 2000ms / Erros):</span>
        <span class="item-value font-mono">{{ details.frustrated?.toLocaleString('pt-BR') || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTheme } from '../../composables/useTheme.js';
import { useI18n } from '../../composables/useI18n.js';

const { theme } = useTheme();
const { t } = useI18n();

const props = defineProps({
  score: { type: Number, default: 0 },
  details: { type: Object, default: () => ({ satisfied: 0, tolerating: 0, frustrated: 0 }) }
});

const tierName = computed(() => {
  if (props.score >= 0.94) return 'Excelente';
  if (props.score >= 0.85) return 'Bom';
  if (props.score >= 0.70) return 'Razoável';
  if (props.score >= 0.50) return 'Ruim';
  return 'Inaceitável';
});

const tierClass = computed(() => {
  if (props.score >= 0.94) return 'tier-excelente';
  if (props.score >= 0.85) return 'tier-bom';
  if (props.score >= 0.70) return 'tier-razoavel';
  if (props.score >= 0.50) return 'tier-ruim';
  return 'tier-inaceitavel';
});

const meterColor = computed(() => {
  if (props.score >= 0.85) return '#059669';
  if (props.score >= 0.70) return '#0284c7';
  if (props.score >= 0.50) return '#d97706';
  return '#dc2626';
});

const meterTrackColor = computed(() => {
  return theme.value === 'dark' ? '#1e293b' : '#e2e8f0';
});

// Arc length is approximately 126 in 100x55 viewBox
const dashOffset = computed(() => {
  const arcLength = 126;
  const clamped = Math.max(0, Math.min(1, props.score));
  return arcLength * (1 - clamped);
});
</script>

<style scoped>
.apdex-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.apdex-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.apdex-label {
  font-size: 11.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.apdex-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.tier-excelente { background: var(--success-bg); color: var(--success); }
.tier-bom { background: var(--info-bg); color: var(--cyan-accent); }
.tier-razoavel { background: var(--warning-bg); color: var(--warning); }
.tier-ruim { background: var(--danger-bg); color: var(--danger); }
.tier-inaceitavel { background: rgba(220, 38, 38, 0.2); color: #dc2626; }

.apdex-visual {
  display: flex;
  justify-content: center;
  position: relative;
  padding: 10px 0;
}

.apdex-meter {
  width: 170px;
  position: relative;
}

.meter-svg {
  width: 100%;
  overflow: visible;
}

.meter-fill {
  transition: stroke-dashoffset 1s ease, stroke 0.5s ease;
}

.apdex-score-display {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
}

.apdex-number {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1;
}

.apdex-max {
  font-size: 11px;
  color: var(--text-subtle);
  margin-left: 2px;
}

.apdex-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 14px;
  font-size: 12px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  display: inline-block;
}

.dot-green { background: var(--success); }
.dot-amber { background: var(--warning); }
.dot-red { background: var(--danger); }

.item-label {
  color: var(--text-muted);
  flex: 1;
}

.item-value {
  font-weight: 700;
  color: var(--text-main);
}
</style>
