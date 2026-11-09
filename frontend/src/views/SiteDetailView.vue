<template>
  <div class="site-detail-view animate-fade-in" v-if="site">
    <!-- Header -->
    <div class="site-header j-card">
      <div class="header-left">
        <div class="site-avatar">
          <Globe :size="24" />
        </div>
        <div>
          <h2 class="site-title">{{ site.name }}</h2>
          <a :href="site.url" target="_blank" class="site-url-link font-mono">{{ site.url }}</a>
        </div>
      </div>

      <div class="header-right">
        <router-link :to="`/new?target=${encodeURIComponent(site.url)}`">
          <BaseButton>
            <template #icon><Zap :size="15" /></template>
            {{ t('sites.btnNewAnalysisDomain') }}
          </BaseButton>
        </router-link>
      </div>
    </div>

    <!-- Tests on this Site -->
    <div class="tests-section j-card">
      <div class="card-header">
        <h3 class="section-title">{{ t('header.historyTitle') }}</h3>
        <span class="badge badge-info">{{ site.tests?.length || 0 }} {{ t('dashboard.unitExecs') }}</span>
      </div>

      <div v-if="!site.tests?.length" class="empty-box">
        {{ t('dashboard.emptyRecent') }}
      </div>

      <div v-else class="table-responsive">
        <table class="j-table">
          <thead>
            <tr>
              <th>{{ t('history.thNameTarget') }}</th>
              <th>{{ t('history.thType') }}</th>
              <th>{{ t('history.thVUs') }}</th>
              <th style="text-align: right;">{{ t('history.thAvgTime') }}</th>
              <th style="text-align: right;">{{ t('history.thP95') }}</th>
              <th style="text-align: right;">{{ t('history.thThroughput') }}</th>
              <th style="text-align: right;">{{ t('history.thErrorRate') }}</th>
              <th>{{ t('history.thStatus') }}</th>
              <th>{{ t('history.thDate') }}</th>
              <th style="text-align: right;">{{ t('history.thActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in site.tests" :key="t.id">
              <td>
                <router-link :to="`/test/${t.id}`" class="test-link">
                  {{ t.name }}
                </router-link>
              </td>
              <td><span class="type-pill">{{ t.test_type }}</span></td>
              <td class="font-mono">{{ t.vus }}</td>
              <td style="text-align: right;" class="font-mono text-cyan">{{ t.avg_time ? `${t.avg_time} ms` : '-' }}</td>
              <td style="text-align: right;" class="font-mono text-amber">{{ t.p95 ? `${t.p95} ms` : '-' }}</td>
              <td style="text-align: right;" class="font-mono">{{ t.throughput ? `${t.throughput} req/s` : '-' }}</td>
              <td style="text-align: right;" class="font-mono" :class="t.error_rate > 0 ? 'text-red' : 'text-green'">
                {{ t.error_rate !== null ? `${t.error_rate}%` : '-' }}
              </td>
              <td><StatusBadge :status="t.status" /></td>
              <td class="date-cell">{{ formatDate(t.created_at) }}</td>
              <td style="text-align: right;">
                <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                  <button class="action-btn text-cyan" @click="inspectJmxPlan(t)" title="Inspecionar Plano JMX (XML)">
                    <Code2 :size="15" />
                  </button>
                  <a :href="`/api/reports/${t.id}/jmx`" target="_blank" class="action-btn text-blue" title="Baixar Plano .JMX">
                    <Download :size="15" />
                  </a>
                  <router-link :to="`/test/${t.id}`">
                    <BaseButton size="sm" variant="outline">{{ t('testResults.thActions') }}</BaseButton>
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
import { useRoute } from 'vue-router';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from '../composables/useI18n.js';
import BaseButton from '../components/common/BaseButton.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { useJMetrixStore } from '../composables/useJMetrixStore.js';
import { Globe, Zap, Code2, Download } from 'lucide-vue-next';

const route = useRoute();
const api = useApi();
const toast = useToast();
const { t, locale } = useI18n();
const { inspectJmxPlan } = useJMetrixStore();

const site = ref(null);

async function loadSite() {
  try {
    const id = route.params.id;
    const res = await api.get(`/sites/${id}`);
    site.value = res;
  } catch (err) {
    toast.error('Erro ao carregar detalhes', err.message);
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const loc = locale.value === 'pt' ? 'pt-BR' : (locale.value === 'es' ? 'es-ES' : 'en-US');
  return new Date(isoStr).toLocaleString(loc);
}

onMounted(() => {
  loadSite();
});
</script>

<style scoped>
.site-detail-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.site-header {
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.site-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--blue-glow);
  color: var(--cyan-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.site-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main);
}

.site-url-link {
  font-size: 12px;
  color: var(--text-muted);
}

.site-url-link:hover {
  color: var(--cyan-accent);
}

.tests-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.test-link {
  font-weight: 600;
  color: var(--text-main);
}

.test-link:hover {
  color: var(--cyan-accent);
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

.empty-box {
  padding: 32px;
  text-align: center;
  color: var(--text-subtle);
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

.font-mono { font-family: var(--font-mono); }
.text-cyan { color: var(--cyan-accent); }
.text-amber { color: var(--warning); }
.text-green { color: var(--success); }
.text-red { color: var(--danger); }
</style>
