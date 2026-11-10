<template>
  <div class="test-results-view animate-fade-in" v-if="test">
    <!-- Header with Test Summary & Action Buttons -->
    <div class="results-header glass-panel">
      <div class="header-main">
        <div class="title-row">
          <h2 class="test-title">{{ test.name }}</h2>
          <span class="type-pill">{{ test.test_type }}</span>
          <StatusBadge :status="test.status" />
        </div>
        <div class="meta-row">
          <div class="meta-item">
            <Globe :size="15" class="text-cyan" />
            <a :href="test.target_url" target="_blank" class="target-link font-mono">{{ test.target_url }}</a>
          </div>
          <div class="meta-item">
            <Calendar :size="15" />
            <span>{{ formatDate(test.started_at || test.created_at) }}</span>
          </div>
          <div class="meta-item">
            <Clock :size="15" />
            <span>{{ test.duration }}s planejados &bull; {{ test.vus }} VUs</span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <BaseButton size="sm" variant="outline" @click="inspectJmxPlan(test)">
          <template #icon><Code2 :size="14" /></template>
          Inspecionar .JMX
        </BaseButton>

        <BaseButton size="sm" variant="outline" @click="goToCompare">
          <template #icon><GitCompare :size="14" /></template>
          Comparar
        </BaseButton>

        <a :href="`/api/reports/${test.id}/jmx`" target="_blank" class="btn-export-link" title="Baixar Plano JMeter .JMX">
          <Download :size="14" />
          <span>Plano .JMX</span>
        </a>

        <BaseButton size="sm" variant="secondary" @click="downloadCsv">
          <template #icon><Download :size="14" /></template>
          {{ t('testResults.btnCsv') }}
        </BaseButton>

        <BaseButton size="sm" variant="secondary" @click="openHtmlReport">
          <template #icon><FileCode :size="14" /></template>
          {{ t('testResults.btnHtml') }}
        </BaseButton>

        <BaseButton size="sm" variant="secondary" @click="printReport">
          <template #icon><Printer :size="14" /></template>
          {{ t('testResults.btnPrint') }}
        </BaseButton>

        <BaseButton size="sm" variant="outline" @click="openNativeReport">
          <template #icon><ExternalLink :size="14" /></template>
          {{ t('testResults.btnNative') }}
        </BaseButton>
      </div>
    </div>

    <!-- Core KPI Metrics Grid -->
    <div class="kpi-grid">
      <MetricCard
        :label="t('testResults.avgThroughput')"
        :value="test.throughput"
        unit="req/s"
        :icon="Zap"
        variant="cyan"
        :subtext="t('testResults.avgThroughputSub')"
      />
      <MetricCard
        :label="t('testResults.avgTime')"
        :value="test.avg_time"
        unit="ms"
        :icon="Clock"
        variant="blue"
        :subtext="t('testResults.avgTimeSub')"
      />
      <MetricCard
        label="Percentil 95 (P95)"
        :value="test.p95"
        unit="ms"
        :icon="TrendingUp"
        variant="amber"
        :subtext="t('testResults.p95Sub')"
      />
      <MetricCard
        :label="t('testResults.errorRate')"
        :value="`${test.error_rate}%`"
        :icon="AlertCircle"
        :variant="test.error_rate > 3 ? 'red' : 'green'"
        :subtext="`${test.error_requests} falhas de ${test.total_requests} reqs`"
      />
      <MetricCard
        :label="t('testResults.totalReqs')"
        :value="test.total_requests"
        unit="reqs"
        :icon="Layers"
        variant="blue"
        :subtext="t('testResults.totalReqsSub')"
      />
    </div>

    <!-- Second Row: Latency Percentiles & APDEX Gauge -->
    <div class="middle-grid">
      <!-- Detailed Percentile Summary Table -->
      <div class="percentiles-card j-card">
        <h3 class="section-title">{{ t('testResults.percentilesTitle') }}</h3>
        <span class="section-subtitle">{{ t('testResults.percentilesSub') }}</span>

        <div class="percentile-items-grid">
          <div class="pct-box">
            <span class="pct-name">{{ t('testResults.min') }}</span>
            <span class="pct-val font-mono text-green">{{ test.min_time }} ms</span>
          </div>
          <div class="pct-box">
            <span class="pct-name">{{ t('testResults.median') }}</span>
            <span class="pct-val font-mono text-cyan">{{ test.p50 }} ms</span>
          </div>
          <div class="pct-box">
            <span class="pct-name">{{ t('testResults.p90') }}</span>
            <span class="pct-val font-mono">{{ test.p90 }} ms</span>
          </div>
          <div class="pct-box">
            <span class="pct-name">{{ t('testResults.p95') }}</span>
            <span class="pct-val font-mono text-amber">{{ test.p95 }} ms</span>
          </div>
          <div class="pct-box">
            <span class="pct-name">{{ t('testResults.p99') }}</span>
            <span class="pct-val font-mono text-red">{{ test.p99 }} ms</span>
          </div>
          <div class="pct-box">
            <span class="pct-name">{{ t('testResults.max') }}</span>
            <span class="pct-val font-mono text-red">{{ test.max_time }} ms</span>
          </div>
        </div>

        <div class="success-ratio-bar">
          <div class="ratio-labels">
            <span>{{ t('testResults.successRate') }}: <strong>{{ (100 - test.error_rate).toFixed(1) }}%</strong></span>
            <span>{{ test.success_requests.toLocaleString('pt-BR') }} {{ t('testResults.successes') }} &bull; {{ test.error_requests }} {{ t('testResults.failures') }}</span>
          </div>
          <div class="ratio-bar-track">
            <div class="ratio-bar-fill-success" :style="{ width: `${100 - test.error_rate}%` }"></div>
            <div class="ratio-bar-fill-error" :style="{ width: `${test.error_rate}%` }"></div>
          </div>
        </div>
      </div>

      <!-- APDEX Gauge Visualizer -->
      <ApdexGauge
        :score="test.apdex_score || 0"
        :details="{
          satisfied: test.success_requests,
          tolerating: 0,
          frustrated: test.error_requests
        }"
      />
    </div>

    <!-- Charts Tabs and Container -->
    <div class="charts-section j-card">
      <div class="charts-header">
        <h3 class="section-title">Comportamento Temporal e Gráficos de Desempenho</h3>
        <div class="chart-tab-buttons">
          <button
            class="tab-btn"
            :class="{ active: activeChartTab === 'latency' }"
            @click="activeChartTab = 'latency'"
          >
            {{ t('testResults.tabResponseTime') }}
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeChartTab === 'throughput' }"
            @click="activeChartTab = 'throughput'"
          >
            {{ t('testResults.tabThroughput') }}
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeChartTab === 'errors' }"
            @click="activeChartTab = 'errors'"
          >
            {{ t('testResults.tabErrors') }}
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeChartTab === 'endpoints' }"
            @click="activeChartTab = 'endpoints'"
          >
            {{ t('testResults.tabEndpoints') }}
          </button>
        </div>
      </div>

      <div class="chart-body">
        <ResponseTimeChart
          v-if="activeChartTab === 'latency'"
          :timeseries="test.timeseries || []"
          height="340px"
        />
        <ThroughputChart
          v-else-if="activeChartTab === 'throughput'"
          :timeseries="test.timeseries || []"
          height="340px"
        />
        <ErrorRateChart
          v-else-if="activeChartTab === 'errors'"
          :timeseries="test.timeseries || []"
          height="340px"
        />
        <EndpointBarChart
          v-else-if="activeChartTab === 'endpoints'"
          :endpoints="test.endpointsMetrics || []"
          height="340px"
        />
      </div>
    </div>

    <!-- Endpoints Breakdown Table -->
    <div class="endpoints-card j-card">
      <div class="card-header">
        <div>
          <h3 class="section-title">{{ t('testResults.endpointsTitle') }}</h3>
          <span class="section-subtitle">{{ t('testResults.endpointsSub') }}</span>
        </div>
        <span class="badge badge-info">{{ (test.endpointsMetrics || []).length }} rotas</span>
      </div>

      <div class="table-responsive">
        <table class="j-table">
          <thead>
            <tr>
              <th>{{ t('testResults.thEndpoint') }}</th>
              <th style="text-align: right;">{{ t('testResults.thRequests') }}</th>
              <th style="text-align: right;">{{ t('testResults.thAvgTime') }}</th>
              <th style="text-align: right;">{{ t('testResults.thP95') }}</th>
              <th style="text-align: right;">{{ t('testResults.thThroughput') }}</th>
              <th style="text-align: right;">{{ t('testResults.thErrorRate') }}</th>
              <th style="text-align: center;">{{ t('testResults.thStatus') }}</th>
              <th style="text-align: right;">{{ t('testResults.thActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ep in test.endpointsMetrics"
              :key="ep.endpoint"
              class="endpoint-row"
              @click="openEndpointModal(ep)"
            >
              <td>
                <span class="endpoint-name">{{ (ep.endpoint || 'Endpoint').replace(/["\\]/g, '').trim() }}</span>
                <span class="endpoint-url font-mono" v-if="ep.url">{{ ep.url }}</span>
              </td>
              <td style="text-align: right;" class="font-mono">{{ (ep.totalRequests || 0).toLocaleString('pt-BR') }}</td>
              <td style="text-align: right;" class="font-mono text-cyan">{{ ep.avgTime }} ms</td>
              <td style="text-align: right;" class="font-mono text-amber">{{ ep.p95 }} ms</td>
              <td style="text-align: right;" class="font-mono">{{ ep.throughput }} req/s</td>
              <td style="text-align: right;" class="font-mono" :class="ep.errorRate > 0 ? 'text-red' : 'text-green'">
                {{ ep.errorRate }}%
              </td>
              <td style="text-align: center;">
                <span class="badge" :class="ep.errorRate > 0 ? 'badge-danger' : 'badge-success'">
                  {{ ep.predominantStatus || '200' }}
                </span>
              </td>
              <td style="text-align: right;">
                <button class="btn-inspect" title="Inspecionar">
                  <ChevronRight :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Automated Technical Diagnostics Card (with redesigned score badge!) -->
    <DiagnosticCard :diagnostics="test.diagnostics || {}" />

    <!-- Endpoint Inspection Modal -->
    <BaseModal
      :isOpen="isEndpointModalOpen"
      :title="`Detalhes do Endpoint: ${activeEndpoint?.endpoint}`"
      maxWidth="540px"
      @close="isEndpointModalOpen = false"
    >
      <div v-if="activeEndpoint" class="endpoint-inspect-body">
        <div class="inspect-metric-row">
          <div class="inspect-box">
            <span class="lbl">{{ t('testResults.thAvgTime') }}</span>
            <span class="val font-mono text-cyan">{{ activeEndpoint.avgTime }} ms</span>
          </div>
          <div class="inspect-box">
            <span class="lbl">{{ t('testResults.thP95') }}</span>
            <span class="val font-mono text-amber">{{ activeEndpoint.p95 }} ms</span>
          </div>
          <div class="inspect-box">
            <span class="lbl">{{ t('testResults.thThroughput') }}</span>
            <span class="val font-mono">{{ activeEndpoint.throughput }} req/s</span>
          </div>
        </div>

        <h4 class="inspect-title">Distribuição de Códigos HTTP</h4>
        <div class="status-codes-list">
          <div
            v-for="(count, code) in activeEndpoint.statusCodes"
            :key="code"
            class="status-code-item"
          >
            <span class="code-badge" :class="code.startsWith('2') ? 'badge-success' : code.startsWith('3') ? 'badge-blue' : 'badge-danger'">
              HTTP {{ code }}
            </span>
            <span class="code-count font-mono">{{ count }} requisições</span>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from '../composables/useI18n.js';
import { useJMetrixStore } from '../composables/useJMetrixStore.js';
import MetricCard from '../components/common/MetricCard.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import BaseButton from '../components/common/BaseButton.vue';
import BaseModal from '../components/common/BaseModal.vue';
import ResponseTimeChart from '../components/charts/ResponseTimeChart.vue';
import ThroughputChart from '../components/charts/ThroughputChart.vue';
import ErrorRateChart from '../components/charts/ErrorRateChart.vue';
import EndpointBarChart from '../components/charts/EndpointBarChart.vue';
import ApdexGauge from '../components/charts/ApdexGauge.vue';
import DiagnosticCard from '../components/diagnostics/DiagnosticCard.vue';
import {
  Globe,
  Calendar,
  Clock,
  Download,
  FileCode,
  Printer,
  ExternalLink,
  Zap,
  TrendingUp,
  AlertCircle,
  Layers,
  ChevronRight,
  Code2,
  GitCompare
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const api = useApi();
const toast = useToast();
const { t, locale } = useI18n();
const { inspectJmxPlan } = useJMetrixStore();

function goToCompare() {
  if (test.value) {
    router.push({ path: '/compare', query: { testIdA: test.value.id } });
  }
}

const test = ref(null);
const activeChartTab = ref('latency');
const isEndpointModalOpen = ref(false);
const activeEndpoint = ref(null);

async function loadTest(testId) {
  try {
    const id = testId || route.params.id;
    if (!id) return;
    const data = await api.get(`/tests/${id}`);
    test.value = data;
  } catch (err) {
    toast.error('Erro ao carregar teste', err.message);
  }
}

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      test.value = null;
      loadTest(newId);
    }
  }
);

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const loc = locale.value === 'pt' ? 'pt-BR' : (locale.value === 'es' ? 'es-ES' : 'en-US');
  return new Date(isoStr).toLocaleString(loc);
}

function openEndpointModal(ep) {
  activeEndpoint.value = ep;
  isEndpointModalOpen.value = true;
}

function downloadCsv() {
  window.open(`/api/reports/${test.value.id}/csv`, '_blank');
}

function openHtmlReport() {
  window.open(`/api/reports/${test.value.id}/html`, '_blank');
}

function openNativeReport() {
  window.open(`/api/reports/${test.value.id}/native`, '_blank');
}

function printReport() {
  window.print();
}

onMounted(() => {
  loadTest();
});
</script>

<style scoped>
.test-results-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.results-header {
  border-radius: 14px;
  padding: 22px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.test-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-main);
  word-break: break-word;
}

.type-pill {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--electric-blue);
  white-space: nowrap;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 12.5px;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.target-link {
  color: var(--text-main);
  font-weight: 600;
  word-break: break-all;
}

.target-link:hover {
  color: var(--electric-blue);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
}

/* Middle Grid */
.middle-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
}

.percentiles-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main);
}

.section-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: -12px;
  display: block;
}

.percentile-items-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.pct-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pct-name {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-subtle);
  font-weight: 600;
}

.pct-val {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main);
}

.success-ratio-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 14px;
}

.ratio-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
}

.ratio-labels strong {
  color: var(--success);
}

.ratio-bar-track {
  width: 100%;
  height: 8px;
  background: var(--bg-surface);
  border-radius: 4px;
  display: flex;
  overflow: hidden;
}

.ratio-bar-fill-success {
  background: var(--success);
}

.ratio-bar-fill-error {
  background: var(--danger);
}

/* Charts Section */
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.charts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 14px;
  flex-wrap: wrap;
  gap: 12px;
}

.chart-tab-buttons {
  display: flex;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
}

.tab-btn {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--text-main);
}

.tab-btn.active {
  background: var(--electric-blue);
  color: #ffffff;
  box-shadow: 0 2px 8px var(--blue-glow);
}

/* Endpoints Card */
.endpoints-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.endpoint-row {
  cursor: pointer;
  transition: background var(--transition-fast);
}

.endpoint-row:hover {
  background: var(--bg-surface);
}

.endpoint-name {
  font-weight: 700;
  color: var(--text-main);
  display: block;
}

.endpoint-url {
  font-size: 11px;
  color: var(--text-subtle);
  display: block;
}

.btn-inspect {
  color: var(--text-subtle);
  transition: color var(--transition-fast);
}

.endpoint-row:hover .btn-inspect {
  color: var(--electric-blue);
}

/* Endpoint Inspect Modal */
.endpoint-inspect-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.inspect-metric-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.inspect-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.inspect-box .lbl {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-subtle);
  font-weight: 600;
}

.inspect-box .val {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main);
}

.inspect-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.status-codes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-code-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.code-count {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 600;
}

.btn-export-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.btn-export-link:hover {
  background: var(--bg-surface-hover);
  border-color: var(--electric-blue);
  color: var(--electric-blue);
}

@media (max-width: 1024px) {
  .results-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .middle-grid {
    grid-template-columns: 1fr;
  }
  .percentile-items-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .percentile-items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
