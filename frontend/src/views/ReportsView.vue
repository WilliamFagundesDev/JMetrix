<template>
  <div class="reports-view animate-fade-in">
    <!-- Reports Header Banner with JMX Brand -->
    <div class="reports-header j-card">
      <div class="header-brand-box">
        <JmxLogo size="md" :withText="true" subtitle="Central Oficial de Exportações e Artefatos do Apache JMeter" />
      </div>
      <div class="header-right-hint">
        <span class="jmx-pill font-mono">ARTEFATOS: .JMX • .JTL • CSV • HTML • DASHBOARD</span>
      </div>
    </div>

    <!-- Reports Table Card -->
    <div class="reports-card j-card">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>{{ t('common.loading') }}</span>
      </div>

      <EmptyState
        v-else-if="!tests.length"
        :title="t('reports.emptyTitle')"
        :description="t('reports.emptyDesc')"
      >
        <template #action>
          <router-link to="/new">
            <BaseButton>{{ t('dashboard.btnStartFirst') }}</BaseButton>
          </router-link>
        </template>
      </EmptyState>

      <div v-else class="table-responsive">
        <table class="j-table">
          <thead>
            <tr>
              <th>{{ t('history.thNameTarget') }}</th>
              <th>{{ t('history.thType') }}</th>
              <th>{{ t('history.thDate') }}</th>
              <th style="text-align: right;">{{ t('history.thThroughput') }}</th>
              <th style="text-align: right;">{{ t('history.thAvgTime') }}</th>
              <th style="text-align: right;">{{ t('history.thErrorRate') }}</th>
              <th style="text-align: center;">Artefatos e Exportações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tests" :key="t.id">
              <td>
                <span class="test-name">{{ t.name }}</span>
                <span class="test-url font-mono">{{ t.target_url }}</span>
              </td>
              <td><span class="type-pill">{{ t.test_type }}</span></td>
              <td class="date-cell">{{ formatDate(t.started_at || t.created_at) }}</td>
              <td style="text-align: right;" class="font-mono text-cyan">{{ t.throughput ? `${t.throughput} req/s` : '-' }}</td>
              <td style="text-align: right;" class="font-mono">{{ t.avg_time ? `${t.avg_time} ms` : '-' }}</td>
              <td style="text-align: right;" class="font-mono" :class="t.error_rate > 0 ? 'text-red' : 'text-green'">
                {{ t.error_rate !== null ? `${t.error_rate}%` : '-' }}
              </td>
              <td style="text-align: center;">
                <div class="export-actions-cell">
                  <!-- JMX Plan Download -->
                  <a :href="`/api/reports/${t.id}/jmx`" target="_blank" class="export-pill pill-jmx" title="Baixar Plano de Teste .JMX para JMeter">
                    <Download :size="13" />
                    <span>Plano .JMX</span>
                  </a>

                  <!-- JMX Plan In-App XML Inspector -->
                  <button class="export-pill pill-inspect" @click="inspectJmxPlan(t)" title="Inspecionar XML do Plano JMeter">
                    <Code2 :size="13" />
                    <span>Ver XML</span>
                  </button>

                  <!-- Raw JTL Data Download -->
                  <a :href="`/api/reports/${t.id}/jtl`" target="_blank" class="export-pill" title="Baixar log CSV de amostras brutas (.JTL)">
                    <Download :size="13" />
                    <span>Dados .JTL</span>
                  </a>

                  <!-- CSV Summary -->
                  <a :href="`/api/reports/${t.id}/csv`" target="_blank" class="export-pill" title="Baixar planilha CSV consolidada">
                    <Download :size="13" />
                    <span>CSV</span>
                  </a>

                  <!-- HTML Standalone Report -->
                  <a :href="`/api/reports/${t.id}/html`" target="_blank" class="export-pill pill-html" title="Visualizar Relatório HTML autônomo com logotipo JMX">
                    <FileCode :size="13" />
                    <span>HTML</span>
                  </a>

                  <!-- Dashboard Link -->
                  <router-link :to="`/test/${t.id}`" class="export-pill" title="Visualizar Dashboard completo de métricas">
                    <BarChart2 :size="13" />
                    <span>Painel</span>
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from '../composables/useI18n.js';
import { useJMetrixStore } from '../composables/useJMetrixStore.js';
import JmxLogo from '../components/common/JmxLogo.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { Download, FileCode, ExternalLink, BarChart2, Code2 } from 'lucide-vue-next';

const api = useApi();
const toast = useToast();
const { t, locale } = useI18n();
const { state: storeState, inspectJmxPlan } = useJMetrixStore();

// Pre-fill instantly with cached store data
const completedTests = (storeState.tests || []).filter(t => t.status === 'completed');
const tests = ref(completedTests);
const loading = ref(!completedTests.length);

async function loadReports() {
  try {
    if (!tests.value.length) {
      loading.value = true;
    }
    const res = await api.get('/tests?status=completed');
    tests.value = res.items || [];
  } catch (err) {
    console.error('Erro ao carregar relatórios', err);
  } finally {
    loading.value = false;
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const loc = locale.value === 'pt' ? 'pt-BR' : (locale.value === 'es' ? 'es-ES' : 'en-US');
  return new Date(isoStr).toLocaleString(loc);
}

onMounted(() => {
  loadReports();
});
</script>

<style scoped>
.reports-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.reports-header {
  padding: 20px 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.section-subtitle {
  font-size: 12.5px;
  color: var(--text-muted);
}

.reports-card {
  padding: 0;
  overflow: hidden;
}

.test-name {
  font-weight: 600;
  color: var(--text-main);
  display: block;
}

.test-url {
  font-size: 11px;
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
  font-weight: 600;
  color: var(--text-muted);
}

.date-cell {
  font-size: 12px;
  color: var(--text-muted);
}

.export-actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.export-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-main);
  transition: all var(--transition-fast);
}

.export-pill:hover {
  background: var(--blue-glow);
  border-color: var(--electric-blue);
  color: var(--electric-blue);
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

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-subtle);
  border-top-color: var(--electric-blue);
  border-radius: 50%;
  animation: spinSlow 0.8s linear infinite;
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
  padding: 12px 14px;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.j-table td {
  padding: 14px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
  color: var(--text-main);
}

.j-table tr:hover td {
  background-color: var(--bg-surface);
}

.reports-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}

.header-brand-box {
  display: flex;
  align-items: center;
}

.jmx-pill {
  font-size: 11px;
  font-weight: 800;
  color: #00f0ff;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.25);
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.pill-jmx {
  background: rgba(0, 240, 255, 0.12) !important;
  color: #00f0ff !important;
  border: 1px solid rgba(0, 240, 255, 0.3) !important;
}

.pill-inspect {
  background: rgba(124, 58, 237, 0.12) !important;
  color: #a78bfa !important;
  border: 1px solid rgba(124, 58, 237, 0.3) !important;
  cursor: pointer;
}

.pill-html {
  background: rgba(37, 99, 235, 0.12) !important;
  color: #60a5fa !important;
}

.font-mono { font-family: var(--font-mono); }
.text-cyan { color: var(--cyan-accent); }
.text-green { color: var(--success); }
.text-red { color: var(--danger); }
</style>
