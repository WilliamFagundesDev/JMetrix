<template>
  <div class="compare-view animate-fade-in" v-if="comparison">
    <!-- Comparison Header -->
    <div class="compare-header glass-panel">
      <div class="header-left">
        <h2 class="page-title">{{ t('compare.title') }}</h2>
        <span class="page-subtitle">{{ t('compare.subtitle') }}</span>
      </div>
      <router-link to="/history">
        <BaseButton variant="secondary" size="sm">{{ t('compare.btnBack') }}</BaseButton>
      </router-link>
    </div>

    <!-- Tests Cards Banner -->
    <div class="tests-pair-banner">
      <div class="test-identity-card j-card">
        <span class="badge badge-info">{{ t('compare.baseTest') }}</span>
        <h3 class="t-name">{{ comparison.testA.name }}</h3>
        <span class="t-meta font-mono">{{ formatDate(comparison.testA.date) }} &bull; {{ comparison.testA.vus }} VUs</span>
      </div>

      <div class="vs-circle font-mono">VS</div>

      <div class="test-identity-card j-card">
        <span class="badge badge-blue">{{ t('compare.currentTest') }}</span>
        <h3 class="t-name">{{ comparison.testB.name }}</h3>
        <span class="t-meta font-mono">{{ formatDate(comparison.testB.date) }} &bull; {{ comparison.testB.vus }} VUs</span>
      </div>
    </div>

    <!-- Delta Metrics Grid -->
    <div class="deltas-grid">
      <!-- Tempo Médio -->
      <div class="delta-card j-card" :class="`border-${comparison.metrics.avgTime.status}`">
        <div class="d-top">
          <span class="d-title">Tempo Médio</span>
          <span class="d-badge" :class="`status-${comparison.metrics.avgTime.status}`">
            {{ formatDelta(comparison.metrics.avgTime) }}
          </span>
        </div>
        <div class="d-vals">
          <div class="val-col">
            <span class="val-lbl">{{ t('compare.testA') }}</span>
            <span class="val-num font-mono">{{ comparison.metrics.avgTime.valA }} ms</span>
          </div>
          <ArrowRight :size="16" class="arrow-sep" />
          <div class="val-col">
            <span class="val-lbl">{{ t('compare.testB') }}</span>
            <span class="val-num font-mono text-cyan">{{ comparison.metrics.avgTime.valB }} ms</span>
          </div>
        </div>
      </div>

      <!-- Percentil 95 (P95) -->
      <div class="delta-card j-card" :class="`border-${comparison.metrics.p95.status}`">
        <div class="d-top">
          <span class="d-title">Percentil 95 (P95)</span>
          <span class="d-badge" :class="`status-${comparison.metrics.p95.status}`">
            {{ formatDelta(comparison.metrics.p95) }}
          </span>
        </div>
        <div class="d-vals">
          <div class="val-col">
            <span class="val-lbl">{{ t('compare.testA') }}</span>
            <span class="val-num font-mono">{{ comparison.metrics.p95.valA }} ms</span>
          </div>
          <ArrowRight :size="16" class="arrow-sep" />
          <div class="val-col">
            <span class="val-lbl">{{ t('compare.testB') }}</span>
            <span class="val-num font-mono text-amber">{{ comparison.metrics.p95.valB }} ms</span>
          </div>
        </div>
      </div>

      <!-- Throughput -->
      <div class="delta-card j-card" :class="`border-${comparison.metrics.throughput.status}`">
        <div class="d-top">
          <span class="d-title">Throughput Médio</span>
          <span class="d-badge" :class="`status-${comparison.metrics.throughput.status}`">
            {{ formatDelta(comparison.metrics.throughput) }}
          </span>
        </div>
        <div class="d-vals">
          <div class="val-col">
            <span class="val-lbl">{{ t('compare.testA') }}</span>
            <span class="val-num font-mono">{{ comparison.metrics.throughput.valA }} req/s</span>
          </div>
          <ArrowRight :size="16" class="arrow-sep" />
          <div class="val-col">
            <span class="val-lbl">{{ t('compare.testB') }}</span>
            <span class="val-num font-mono text-cyan">{{ comparison.metrics.throughput.valB }} req/s</span>
          </div>
        </div>
      </div>

      <!-- Taxa de Erros -->
      <div class="delta-card j-card" :class="`border-${comparison.metrics.errorRate.status}`">
        <div class="d-top">
          <span class="d-title">Taxa de Erros</span>
          <span class="d-badge" :class="`status-${comparison.metrics.errorRate.status}`">
            {{ formatDelta(comparison.metrics.errorRate) }}
          </span>
        </div>
        <div class="d-vals">
          <div class="val-col">
            <span class="val-lbl">{{ t('compare.testA') }}</span>
            <span class="val-num font-mono">{{ comparison.metrics.errorRate.valA }}%</span>
          </div>
          <ArrowRight :size="16" class="arrow-sep" />
          <div class="val-col">
            <span class="val-lbl">{{ t('compare.testB') }}</span>
            <span class="val-num font-mono" :class="comparison.metrics.errorRate.valB > 0 ? 'text-red' : 'text-green'">
              {{ comparison.metrics.errorRate.valB }}%
            </span>
          </div>
        </div>
      </div>

      <!-- APDEX -->
      <div class="delta-card j-card" :class="`border-${comparison.metrics.apdexScore.status}`">
        <div class="d-top">
          <span class="d-title">Índice APDEX</span>
          <span class="d-badge" :class="`status-${comparison.metrics.apdexScore.status}`">
            {{ formatDelta(comparison.metrics.apdexScore) }}
          </span>
        </div>
        <div class="d-vals">
          <div class="val-col">
            <span class="val-lbl">{{ t('compare.testA') }}</span>
            <span class="val-num font-mono">{{ comparison.metrics.apdexScore.valA }}</span>
          </div>
          <ArrowRight :size="16" class="arrow-sep" />
          <div class="val-col">
            <span class="val-lbl">{{ t('compare.testB') }}</span>
            <span class="val-num font-mono text-green">{{ comparison.metrics.apdexScore.valB }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparative Chart -->
    <div class="chart-card j-card">
      <h3 class="section-title">{{ t('compare.chartTitle') }}</h3>
      <BaseChart :options="chartOptions" height="320px" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';
import { useTheme } from '../composables/useTheme.js';
import { useI18n } from '../composables/useI18n.js';
import BaseButton from '../components/common/BaseButton.vue';
import BaseChart from '../components/charts/BaseChart.vue';
import { ArrowRight } from 'lucide-vue-next';

const route = useRoute();
const api = useApi();
const toast = useToast();
const { theme } = useTheme();
const { t, locale } = useI18n();

const comparison = ref(null);

async function loadComparison() {
  const { testA, testB } = route.query;
  if (!testA || !testB) {
    toast.error('Parâmetros inválidos', 'Selecione dois testes no histórico para comparar.');
    return;
  }

  try {
    const res = await api.get(`/tests/compare?testIdA=${testA}&testIdB=${testB}`);
    comparison.value = res;
  } catch (err) {
    toast.error('Erro na comparação', err.message);
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const loc = locale.value === 'pt' ? 'pt-BR' : (locale.value === 'es' ? 'es-ES' : 'en-US');
  return new Date(isoStr).toLocaleString(loc);
}

function formatDelta(delta) {
  if (delta.status === 'equal') return `${t('compare.equal')} (0%)`;
  const prefix = delta.diff > 0 ? '+' : '';
  const label = delta.status === 'better' ? t('compare.better') : t('compare.worse');
  return `${label} (${prefix}${delta.percent}%)`;
}

const chartOptions = computed(() => {
  if (!comparison.value) return {};
  const isDark = theme.value === 'dark';
  const labelColor = isDark ? '#cbd5e1' : '#334155';
  const splitColor = isDark ? '#1e293b' : '#e2e8f0';

  const m = comparison.value.metrics;

  return {
    legend: {
      data: [comparison.value.testA.name, comparison.value.testB.name],
      textStyle: { color: labelColor, fontWeight: 600 },
      top: 0
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: {
      top: 40,
      right: 25,
      bottom: 25,
      left: 55
    },
    xAxis: {
      type: 'category',
      data: [
        `${t('testResults.avgTime')} (ms)`,
        `${t('testResults.p95')} (ms)`,
        `${t('history.thThroughput')} (req/s)`,
        `${t('history.thErrorRate')} (%)`
      ],
      axisLine: { lineStyle: { color: splitColor } },
      axisLabel: { color: labelColor, fontWeight: 600 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: splitColor, type: 'dashed' } },
      axisLabel: { color: labelColor }
    },
    series: [
      {
        name: comparison.value.testA.name,
        type: 'bar',
        data: [m.avgTime.valA, m.p95.valA, m.throughput.valA, m.errorRate.valA],
        itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: comparison.value.testB.name,
        type: 'bar',
        data: [m.avgTime.valB, m.p95.valB, m.throughput.valB, m.errorRate.valB],
        itemStyle: { color: '#0284c7', borderRadius: [4, 4, 0, 0] }
      }
    ]
  };
});

onMounted(() => {
  loadComparison();
});
</script>

<style scoped>
.compare-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.compare-header {
  border-radius: 14px;
  padding: 20px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 19px;
  font-weight: 800;
  color: var(--text-main);
}

.page-subtitle {
  font-size: 12.5px;
  color: var(--text-muted);
}

.tests-pair-banner {
  display: grid;
  grid-template-columns: 1fr 64px 1fr;
  gap: 16px;
  align-items: center;
}

.test-identity-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.t-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main);
}

.t-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.vs-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  color: var(--electric-blue);
  margin: 0 auto;
  box-shadow: var(--shadow-sm);
}

.deltas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.delta-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-left: 4px solid var(--border-subtle);
}

.border-better { border-left-color: var(--success); }
.border-worse { border-left-color: var(--danger); }
.border-equal { border-left-color: var(--text-subtle); }

.d-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.d-title {
  font-size: 11.5px;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-muted);
}

.d-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

.status-better { background: var(--success-bg); color: var(--success); }
.status-worse { background: var(--danger-bg); color: var(--danger); }
.status-equal { background: rgba(100, 116, 139, 0.12); color: var(--text-muted); }

.d-vals {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface);
  border-radius: 10px;
  padding: 12px 16px;
}

.val-col {
  display: flex;
  flex-direction: column;
}

.val-lbl {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-subtle);
  font-weight: 600;
}

.val-num {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main);
}

.arrow-sep {
  color: var(--text-subtle);
}

.chart-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main);
}
</style>
