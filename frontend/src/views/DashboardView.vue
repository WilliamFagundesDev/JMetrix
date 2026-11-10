<template>
  <div class="dashboard-view animate-fade-in">
    <!-- First Time Onboarding Banner (Shown when no tests yet) -->
    <div v-if="overview.totalTests === 0 && !loading" class="onboarding-hero glass-panel">
      <div class="onboarding-content">
        <div class="hero-badge">
          <JmxLogo size="sm" :withText="false" />
          <span>{{ t('dashboard.welcomeBadge') }}</span>
        </div>
        <h2 class="hero-title">{{ t('dashboard.welcomeTitle') }}</h2>
        <p class="hero-desc">
          {{ t('dashboard.welcomeDesc') }}
        </p>
        <div class="hero-actions">
          <router-link to="/new">
            <BaseButton size="lg">
              <template #icon><Zap :size="16" /></template>
              {{ t('dashboard.btnStartFirst') }}
            </BaseButton>
          </router-link>
          <BaseButton variant="secondary" size="lg" @click="openJmeterGuide">
            <template #icon><BookOpen :size="16" /></template>
            Guia & Dicionário JMeter
          </BaseButton>
          <router-link to="/settings">
            <BaseButton variant="secondary" size="lg">
              <template #icon><Sliders :size="16" /></template>
              {{ t('dashboard.btnCheckEnv') }}
            </BaseButton>
          </router-link>
        </div>
      </div>
      <div class="hero-graphic">
        <div class="engine-preview-card">
          <div class="preview-header">
            <span class="preview-dot green"></span>
            <span class="preview-dot amber"></span>
            <span class="preview-dot red"></span>
            <span class="preview-title">Apache JMeter 5.6.3 Engine</span>
          </div>
          <div class="preview-code">
            <code>&gt; jmeter -n -t plan.jmx -l results.jtl</code>
            <code>&gt; Parsing percentiles P50, P90, P95, P99...</code>
            <code>&gt; Generating APDEX satisfaction score...</code>
            <code>&gt; Real-time WebSocket telemetry active!</code>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Running Test Card (If any test is currently running) -->
    <div v-if="overview.runningTests?.length" class="running-section">
      <LiveEngineWidget
        v-for="rt in overview.runningTests"
        :key="rt.id"
        :testName="rt.name"
        :targetUrl="rt.target_url"
        :stage="rt.status"
        :progressPercent="liveTelemetry.progressPercent || 30"
        :elapsedSec="liveTelemetry.elapsedSec || 15"
        :activeVus="liveTelemetry.activeThreads || rt.vus"
        :requestsCount="liveTelemetry.totalRequests || 0"
        :throughput="liveTelemetry.throughput || 0"
        :avgTime="liveTelemetry.avgResponseTime || 0"
        :errorsCount="liveTelemetry.errorCount || 0"
        @cancel="cancelTest(rt.id)"
      />
    </div>

    <!-- Top KPI Metrics Grid -->
    <div class="metrics-grid">
      <MetricCard
        :label="t('dashboard.kpiTests')"
        :value="overview.totalTests"
        :unit="t('dashboard.unitExecs')"
        :icon="Activity"
        variant="blue"
        :subtext="t('dashboard.kpiTestsSub')"
      />
      <MetricCard
        :label="t('dashboard.kpiSites')"
        :value="overview.totalSites"
        :unit="t('dashboard.unitDomains')"
        :icon="Globe"
        variant="cyan"
        :subtext="t('dashboard.kpiSitesSub')"
      />
      <MetricCard
        :label="t('dashboard.kpiRequests')"
        :value="overview.totalRequests"
        :unit="t('dashboard.unitReqs')"
        :icon="Layers"
        variant="blue"
        :subtext="t('dashboard.kpiRequestsSub')"
      />
      <MetricCard
        :label="t('dashboard.kpiAvgTime')"
        :value="overview.overallAvgTime"
        unit="ms"
        :icon="Clock"
        variant="amber"
        :subtext="t('dashboard.kpiAvgTimeSub')"
      />
      <MetricCard
        :label="t('dashboard.kpiErrorRate')"
        :value="`${overview.overallErrorRate}%`"
        :icon="AlertCircle"
        :variant="overview.overallErrorRate > 3 ? 'red' : 'green'"
        :subtext="t('dashboard.kpiErrorRateSub')"
      />
    </div>

    <!-- Charts Section (When tests exist) -->
    <div v-if="overview.chartHistory?.length" class="charts-row">
      <div class="chart-card j-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">{{ t('dashboard.chartLatencyTitle') }}</h3>
            <span class="card-subtitle">{{ t('dashboard.chartLatencySub') }}</span>
          </div>
        </div>
        <BaseChart :options="responseTimeHistoryOptions" height="290px" />
      </div>

      <div class="chart-card j-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">{{ t('dashboard.chartThroughputTitle') }}</h3>
            <span class="card-subtitle">{{ t('dashboard.chartThroughputSub') }}</span>
          </div>
        </div>
        <BaseChart :options="throughputHistoryOptions" height="290px" />
      </div>
    </div>

    <!-- Bottom Lists Grid -->
    <div class="dashboard-bottom-grid">
      <!-- Recent Tests Table -->
      <div class="table-card j-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">{{ t('dashboard.recentTestsTitle') }}</h3>
            <span class="card-subtitle">{{ t('dashboard.recentTestsSub') }}</span>
          </div>
          <router-link to="/history" class="view-all-link">
            <span>{{ t('dashboard.viewAll') }}</span>
            <ArrowRight :size="14" />
          </router-link>
        </div>

        <div v-if="!overview.recentTests?.length" class="empty-box">
          {{ t('dashboard.emptyRecent') }}
        </div>

        <div v-else class="table-responsive">
          <table class="j-table">
            <thead>
              <tr>
                <th>{{ t('history.thNameTarget') }}</th>
                <th>{{ t('history.thType') }}</th>
                <th>{{ t('history.thVUs') }}</th>
                <th>{{ t('history.thThroughput') }}</th>
                <th>{{ t('history.thAvgTime') }}</th>
                <th>{{ t('history.thStatus') }}</th>
                <th style="text-align: right;">{{ t('history.thActions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="test in overview.recentTests" :key="test.id">
                <td>
                  <router-link :to="`/test/${test.id}`" class="test-name-link">
                    {{ test.name }}
                  </router-link>
                  <span class="target-subtext font-mono">{{ test.target_url }}</span>
                </td>
                <td>
                  <span class="type-pill">{{ test.test_type }}</span>
                </td>
                <td class="font-mono">{{ test.vus }}</td>
                <td class="font-mono text-cyan">{{ test.throughput ? `${test.throughput} req/s` : '-' }}</td>
                <td class="font-mono">{{ test.avg_time ? `${test.avg_time} ms` : '-' }}</td>
                <td>
                  <StatusBadge :status="test.status" />
                </td>
                <td style="text-align: right;">
                  <router-link :to="`/test/${test.id}`">
                    <BaseButton size="sm" variant="outline">{{ t('testResults.thActions') }}</BaseButton>
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Top & Problematic Sites -->
      <div class="side-rankings">
        <!-- Top Performing Sites -->
        <div class="ranking-card j-card">
          <div class="card-header">
            <div class="card-title-group">
              <h3 class="card-title text-green">{{ t('dashboard.topSitesTitle') }}</h3>
              <span class="card-subtitle">{{ t('dashboard.topSitesSub') }}</span>
            </div>
          </div>

          <div v-if="!overview.topSites?.length" class="empty-box">
            {{ t('dashboard.emptyTopSites') }}
          </div>
          <div v-else class="ranking-list">
            <div v-for="site in overview.topSites" :key="site.id" class="ranking-item">
              <div class="ranking-info">
                <span class="ranking-name">{{ site.name }}</span>
                <span class="ranking-url font-mono">{{ site.url }}</span>
              </div>
              <div class="ranking-stat">
                <span class="ranking-metric text-green font-mono">{{ site.avg_latency }} ms</span>
                <span class="ranking-sub font-mono">{{ site.avg_error }}% erro</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Problematic Sites -->
        <div class="ranking-card j-card">
          <div class="card-header">
            <div class="card-title-group">
              <h3 class="card-title text-amber">{{ t('dashboard.problematicSitesTitle') }}</h3>
              <span class="card-subtitle">{{ t('dashboard.problematicSitesSub') }}</span>
            </div>
          </div>

          <div v-if="!overview.problematicSites?.length" class="empty-box">
            {{ t('dashboard.emptyProblemSites') }}
          </div>
          <div v-else class="ranking-list">
            <div v-for="site in overview.problematicSites" :key="site.id" class="ranking-item">
              <div class="ranking-info">
                <span class="ranking-name">{{ site.name }}</span>
                <span class="ranking-url font-mono">{{ site.url }}</span>
              </div>
              <div class="ranking-stat">
                <span class="ranking-metric text-red font-mono">{{ site.avg_error }}% erros</span>
                <span class="ranking-sub font-mono">{{ site.avg_latency }} ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useWebSocket } from '../composables/useWebSocket.js';
import { useToast } from '../composables/useToast.js';
import { useTheme } from '../composables/useTheme.js';
import { useI18n } from '../composables/useI18n.js';
import { useJMetrixStore } from '../composables/useJMetrixStore.js';
import MetricCard from '../components/common/MetricCard.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import BaseButton from '../components/common/BaseButton.vue';
import BaseChart from '../components/charts/BaseChart.vue';
import LiveEngineWidget from '../components/common/LiveEngineWidget.vue';
import JmxLogo from '../components/common/JmxLogo.vue';
import {
  Activity,
  Globe,
  Layers,
  Clock,
  AlertCircle,
  Zap,
  Sliders,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-vue-next';

const api = useApi();
const toast = useToast();
const { theme } = useTheme();
const { t } = useI18n();
const { subscribe } = useWebSocket();
const { state: storeState, openJmeterGuide } = useJMetrixStore();

// Pre-fill instantly from store memory if available
const hasInitialData = Boolean(storeState.overview && (storeState.overview.totalTests > 0 || storeState.overview.recentTests?.length > 0));
const loading = ref(!hasInitialData);
const overview = ref(hasInitialData ? { ...storeState.overview } : {
  totalTests: 0,
  totalSites: 0,
  totalRequests: 0,
  overallAvgTime: 0,
  overallErrorRate: 0,
  runningTests: [],
  recentTests: [],
  topSites: [],
  problematicSites: [],
  chartHistory: []
});

const liveTelemetry = ref({});

async function loadDashboard() {
  try {
    if (!overview.value.totalTests && !overview.value.recentTests?.length) {
      loading.value = true;
    }
    const data = await api.get('/dashboard/overview');
    overview.value = data;
    storeState.overview = data;
  } catch (err) {
    console.error('Falha ao carregar dashboard', err);
  } finally {
    loading.value = false;
  }
}

async function cancelTest(testId) {
  try {
    await api.post(`/tests/${testId}/cancel`);
    toast.warning('Teste cancelado', 'A execução do JMeter foi abortada.');
    loadDashboard();
  } catch (err) {
    toast.error('Erro ao cancelar teste', err.message);
  }
}

// Chart Options: Response Time History
const responseTimeHistoryOptions = computed(() => {
  const isDark = theme.value === 'dark';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const splitColor = isDark ? '#1e293b' : '#e2e8f0';

  const items = overview.value.chartHistory || [];
  const names = items.map(t => t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name);
  const avg = items.map(t => t.avg_time);
  const p95 = items.map(t => t.p95);

  return {
    legend: {
      data: ['Tempo Médio (ms)', 'P95 (ms)'],
      textStyle: { color: labelColor, fontWeight: 600 },
      top: 0
    },
    tooltip: { trigger: 'axis' },
    grid: {
      top: 35,
      right: 20,
      bottom: 45,
      left: 55
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: splitColor } },
      axisLabel: { color: labelColor, fontSize: 11, rotate: 15 }
    },
    yAxis: {
      type: 'value',
      name: 'ms',
      nameTextStyle: { color: labelColor, fontWeight: 600 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: splitColor, type: 'dashed' } },
      axisLabel: { color: labelColor }
    },
    series: [
      {
        name: 'Tempo Médio (ms)',
        type: 'bar',
        data: avg,
        itemStyle: { color: '#0284c7', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: 'P95 (ms)',
        type: 'bar',
        data: p95,
        itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }
      }
    ]
  };
});

// Chart Options: Throughput History
const throughputHistoryOptions = computed(() => {
  const isDark = theme.value === 'dark';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const splitColor = isDark ? '#1e293b' : '#e2e8f0';

  const items = overview.value.chartHistory || [];
  const names = items.map(t => t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name);
  const throughput = items.map(t => t.throughput);

  return {
    legend: {
      data: ['Throughput (req/s)'],
      textStyle: { color: labelColor, fontWeight: 600 },
      top: 0
    },
    tooltip: { trigger: 'axis' },
    grid: {
      top: 35,
      right: 20,
      bottom: 45,
      left: 55
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: splitColor } },
      axisLabel: { color: labelColor, fontSize: 11, rotate: 15 }
    },
    yAxis: {
      type: 'value',
      name: 'req/s',
      nameTextStyle: { color: labelColor, fontWeight: 600 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: splitColor, type: 'dashed' } },
      axisLabel: { color: labelColor }
    },
    series: [
      {
        name: 'Throughput (req/s)',
        type: 'line',
        smooth: true,
        data: throughput,
        lineStyle: { width: 3, color: '#2563eb' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.25)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.0)' }
            ]
          }
        }
      }
    ]
  };
});

onMounted(() => {
  loadDashboard();

  subscribe('test:telemetry', (data) => {
    liveTelemetry.value = data;
  });

  subscribe('test:status', () => {
    loadDashboard();
  });

  subscribe('test:completed', () => {
    toast.success('Teste Concluído!', 'Resultados processados.');
    loadDashboard();
  });
});
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Onboarding Hero */
.onboarding-hero {
  border-radius: 16px;
  padding: 28px 32px;
  display: grid;
  grid-template-columns: 1fr minmax(280px, 420px);
  gap: 28px;
  align-items: center;
  box-shadow: var(--shadow-md);
  min-width: 0;
}

.onboarding-content {
  min-width: 0;
}

.hero-graphic {
  min-width: 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--info-bg);
  color: var(--cyan-accent);
  border: 1px solid rgba(2, 132, 199, 0.25);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 14px;
}

.hero-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.5px;
  line-height: 1.3;
  margin-bottom: 12px;
  word-break: break-word;
}

.hero-desc {
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 22px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.engine-preview-card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
  width: 100%;
}

.preview-header {
  background: #0f172a;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #1e293b;
}

.preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.preview-dot.green { background: #10b981; }
.preview-dot.amber { background: #f59e0b; }
.preview-dot.red { background: #ef4444; }

.preview-title {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 6px;
  font-family: var(--font-mono);
  font-weight: 600;
}

.preview-code {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: #38bdf8;
  overflow-x: auto;
  white-space: nowrap;
}

.preview-code code {
  line-height: 1.4;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

@media (min-width: 1240px) {
  .metrics-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

/* Charts Row */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
  line-height: 1.3;
}

.card-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.3;
}

.view-all-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--electric-blue);
}

/* Bottom Grid */
.dashboard-bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1.2fr);
  gap: 20px;
  min-width: 0;
}

.table-responsive {
  overflow-x: auto;
}

.j-table {
  width: 100%;
  border-collapse: collapse;
}

.j-table th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-subtle);
  letter-spacing: 0.5px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.j-table td {
  padding: 13px 14px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
}

.test-name-link {
  font-weight: 700;
  color: var(--text-main);
  display: block;
}

.test-name-link:hover {
  color: var(--electric-blue);
}

.target-subtext {
  font-size: 11.5px;
  color: var(--text-subtle);
  display: block;
}

.type-pill {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-muted);
}

.side-rankings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ranking-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  transition: all var(--transition-fast);
  gap: 12px;
}

.ranking-item:hover {
  border-color: var(--electric-blue);
}

.ranking-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.ranking-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-url {
  font-size: 11px;
  color: var(--text-subtle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-stat {
  text-align: right;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.ranking-metric {
  font-size: 13.5px;
  font-weight: 700;
}

.ranking-sub {
  font-size: 11px;
  color: var(--text-subtle);
}

.empty-box {
  padding: 28px 16px;
  text-align: center;
  color: var(--text-subtle);
  font-size: 13px;
}

@media (max-width: 1280px) {
  .onboarding-hero {
    grid-template-columns: 1fr;
  }
  .dashboard-bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
