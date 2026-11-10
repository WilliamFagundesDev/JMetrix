<template>
  <div class="compare-view animate-fade-in">
    <!-- Comparison Header & Test Selectors -->
    <div class="compare-header glass-panel">
      <div class="header-left">
        <div class="header-title-row">
          <GitCompare :size="24" class="text-cyan" />
          <h2 class="page-title">{{ t('compare.title') }}</h2>
          <span class="jmx-tag font-mono">LADO A LADO</span>
        </div>
        <span class="page-subtitle">{{ t('compare.subtitle') }}</span>
      </div>
      <router-link to="/history">
        <BaseButton variant="secondary" size="sm">{{ t('compare.btnBack') }}</BaseButton>
      </router-link>
    </div>

    <!-- Interactive Selectors Bar -->
    <div class="selectors-bar j-card">
      <div class="selector-col">
        <label class="selector-label">
          <span class="badge badge-info">TESTE BASE (A)</span>
          <span>Selecione a versão de referência:</span>
        </label>
        <select v-model="selectedTestA" @change="onSelectionChange" class="test-select font-mono">
          <option value="">-- Escolha o Teste Base (A) --</option>
          <option v-for="t in availableTests" :key="t.id" :value="t.id">
            {{ t.name }} ({{ t.vus }} VUs • {{ formatDate(t.started_at || t.created_at) }})
          </option>
        </select>
      </div>

      <div class="vs-badge-middle">VS</div>

      <div class="selector-col">
        <label class="selector-label">
          <span class="badge badge-blue">TESTE COMPARATIVO (B)</span>
          <span>Selecione a versão recente:</span>
        </label>
        <select v-model="selectedTestB" @change="onSelectionChange" class="test-select font-mono">
          <option value="">-- Escolha o Teste Comparativo (B) --</option>
          <option v-for="t in availableTests" :key="t.id" :value="t.id" :disabled="t.id === selectedTestA">
            {{ t.name }} ({{ t.vus }} VUs • {{ formatDate(t.started_at || t.created_at) }})
          </option>
        </select>
      </div>
    </div>

    <!-- Empty State if fewer than 2 tests exist in DB -->
    <EmptyState
      v-if="availableTests.length < 2 && !loading"
      title="Testes insuficientes para comparação"
      description="Para comparar resultados de performance lado a lado, você precisa ter executado pelo menos dois testes no JMeter."
    >
      <template #action>
        <router-link to="/new">
          <BaseButton>{{ t('dashboard.btnStartFirst') }}</BaseButton>
        </router-link>
      </template>
    </EmptyState>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading-state j-card">
      <div class="loading-spinner"></div>
      <span>Calculando deltas estatísticos e percentis entre os testes...</span>
    </div>

    <!-- Prompt to choose tests if none selected -->
    <div v-else-if="!comparison && !loading" class="empty-selection-card j-card">
      <SlidersHorizontal :size="36" class="text-cyan mb-2" />
      <h3>Selecione dois testes acima para iniciar a comparação</h3>
      <p>O algoritmo calculará automaticamente deltas de latência média, percentis P95, vazão de requisições, taxa de falhas e pontuação APDEX.</p>
    </div>

    <!-- Comparison Content -->
    <template v-else-if="comparison">
      <!-- Tests Cards Banner -->
      <div class="tests-pair-banner">
        <div class="test-identity-card j-card">
          <div class="card-tag-row">
            <span class="badge badge-info">{{ t('compare.baseTest') }}</span>
            <span class="font-mono text-cyan">{{ comparison.testA.vus }} VUs</span>
          </div>
          <h3 class="t-name">{{ comparison.testA.name }}</h3>
          <span class="t-meta font-mono">{{ formatDate(comparison.testA.date) }}</span>
          <div class="test-actions-quick">
            <router-link :to="`/test/${comparison.testA.id}`" class="link-quick">Ver Detalhes</router-link>
            <a :href="`/api/reports/${comparison.testA.id}/jmx`" target="_blank" class="link-quick">Baixar .JMX</a>
          </div>
        </div>

        <div class="vs-circle font-mono">VS</div>

        <div class="test-identity-card j-card">
          <div class="card-tag-row">
            <span class="badge badge-blue">{{ t('compare.currentTest') }}</span>
            <span class="font-mono text-cyan">{{ comparison.testB.vus }} VUs</span>
          </div>
          <h3 class="t-name">{{ comparison.testB.name }}</h3>
          <span class="t-meta font-mono">{{ formatDate(comparison.testB.date) }}</span>
          <div class="test-actions-quick">
            <router-link :to="`/test/${comparison.testB.id}`" class="link-quick">Ver Detalhes</router-link>
            <a :href="`/api/reports/${comparison.testB.id}/jmx`" target="_blank" class="link-quick">Baixar .JMX</a>
          </div>
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

      <!-- Comparative Bar Chart -->
      <div class="chart-card j-card">
        <h3 class="section-title">{{ t('compare.chartTitle') }}</h3>
        <BaseChart :options="chartOptions" height="320px" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';
import { useTheme } from '../composables/useTheme.js';
import { useI18n } from '../composables/useI18n.js';
import BaseButton from '../components/common/BaseButton.vue';
import BaseChart from '../components/charts/BaseChart.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { ArrowRight, GitCompare, SlidersHorizontal } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const api = useApi();
const toast = useToast();
const { theme } = useTheme();
const { t, locale } = useI18n();

const loading = ref(false);
const availableTests = ref([]);
const selectedTestA = ref('');
const selectedTestB = ref('');
const comparison = ref(null);

async function loadAvailableTests() {
  try {
    const res = await api.get('/tests?status=completed&limit=50');
    availableTests.value = res.items || res.tests || [];

    // Pre-populate from query params if available
    const queryA = route.query.testA || route.query.testIdA || route.query.idA;
    const queryB = route.query.testB || route.query.testIdB || route.query.idB;

    if (queryA && availableTests.value.some(t => t.id === queryA)) {
      selectedTestA.value = queryA;
    } else if (availableTests.value.length >= 2) {
      selectedTestA.value = availableTests.value[1].id;
    }

    if (queryB && availableTests.value.some(t => t.id === queryB)) {
      selectedTestB.value = queryB;
    } else if (availableTests.value.length >= 1) {
      selectedTestB.value = availableTests.value[0].id;
    }

    if (selectedTestA.value && selectedTestB.value) {
      fetchComparison();
    }
  } catch (err) {
    console.error('Erro ao carregar testes para comparador:', err);
  }
}

function onSelectionChange() {
  if (selectedTestA.value && selectedTestB.value) {
    router.replace({
      query: { testIdA: selectedTestA.value, testIdB: selectedTestB.value }
    });
    fetchComparison();
  }
}

async function fetchComparison() {
  if (!selectedTestA.value || !selectedTestB.value) return;
  if (selectedTestA.value === selectedTestB.value) {
    toast.warning('Atenção', 'Selecione dois testes diferentes para comparação.');
    return;
  }

  try {
    loading.value = true;
    const res = await api.get(`/tests/compare?testIdA=${selectedTestA.value}&testIdB=${selectedTestB.value}`);
    comparison.value = res;
  } catch (err) {
    toast.error('Erro na comparação', err.message);
  } finally {
    loading.value = false;
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const loc = locale.value === 'pt' ? 'pt-BR' : (locale.value === 'es' ? 'es-ES' : 'en-US');
  return new Date(isoStr).toLocaleString(loc);
}

function formatDelta(delta) {
  if (!delta) return '-';
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
        `Percentil P95 (ms)`,
        `Throughput (req/s)`,
        `Taxa de Erro (%)`
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
        itemStyle: { color: '#00f0ff', borderRadius: [4, 4, 0, 0] }
      }
    ]
  };
});

onMounted(() => {
  loadAvailableTests();
});
</script>

<style scoped>
.compare-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.compare-header {
  border-radius: 14px;
  padding: 18px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title {
  font-size: 19px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}

.jmx-tag {
  font-size: 10px;
  font-weight: 800;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.12);
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid rgba(0, 240, 255, 0.3);
}

.page-subtitle {
  font-size: 12.5px;
  color: var(--text-muted);
}

.selectors-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.selector-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  width: 100%;
  overflow: hidden;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.test-select {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  font-size: 13px;
  font-weight: 600;
  outline: none;
  transition: all var(--transition-fast);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  cursor: pointer;
}

.test-select:focus {
  border-color: var(--electric-blue);
  box-shadow: 0 0 0 2px var(--blue-glow);
}

.vs-badge-middle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 12px;
  color: var(--electric-blue);
  margin: 18px auto 0 auto;
  flex-shrink: 0;
}

.empty-selection-card {
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-muted);
}

.empty-selection-card h3 {
  color: var(--text-main);
  font-size: 16px;
  margin: 8px 0 4px 0;
}

.empty-selection-card p {
  font-size: 13px;
  max-width: 580px;
  margin: 0;
}

.tests-pair-banner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}

.test-identity-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  min-width: 0;
  overflow: hidden;
}

.card-tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.t-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main);
  margin: 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.t-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.test-actions-quick {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}

.link-quick {
  font-size: 12px;
  font-weight: 700;
  color: var(--electric-blue);
  text-decoration: none;
}

.link-quick:hover {
  text-decoration: underline;
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
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.delta-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-left-width: 4px;
}

.d-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.d-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.d-badge {
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 12px;
  font-family: monospace;
}

.status-better {
  background: var(--success-bg);
  color: var(--success);
}

.status-worse {
  background: var(--danger-bg);
  color: var(--danger);
}

.status-equal {
  background: var(--bg-surface);
  color: var(--text-muted);
}

.d-vals {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.val-col {
  display: flex;
  flex-direction: column;
}

.val-lbl {
  font-size: 10.5px;
  color: var(--text-subtle);
  text-transform: uppercase;
  font-weight: 600;
}

.val-num {
  font-size: 17px;
  font-weight: 800;
  color: var(--text-main);
}

.arrow-sep {
  color: var(--text-subtle);
}

.chart-card {
  padding: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 12px;
  color: var(--text-muted);
}

@media (max-width: 860px) {
  .selectors-bar {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .vs-badge-middle {
    margin: 4px auto;
  }
  .tests-pair-banner {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .vs-circle {
    margin: 4px auto;
  }
}
</style>