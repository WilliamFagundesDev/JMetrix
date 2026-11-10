<template>
  <div class="history-view animate-fade-in">
    <!-- Filter and Search Toolbar -->
    <div class="history-toolbar j-card">
      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input
          v-model="filters.search"
          type="text"
          :placeholder="t('history.searchPlaceholder')"
          @input="debounceSearch"
        />
      </div>

      <div class="filter-controls">
        <select v-model="filters.testType" @change="loadTests">
          <option value="">{{ t('history.allTypes') }}</option>
          <option value="smoke">Smoke Test</option>
          <option value="load">Load Test</option>
          <option value="stress">Stress Test</option>
          <option value="spike">Spike Test</option>
          <option value="endurance">Endurance Test</option>
        </select>

        <select v-model="filters.status" @change="loadTests">
          <option value="">{{ t('history.allStatuses') }}</option>
          <option value="completed">Concluídos</option>
          <option value="running">Em Execução</option>
          <option value="failed">Falhas</option>
          <option value="cancelled">Cancelados</option>
        </select>

        <BaseButton
          variant="outline"
          :disabled="selectedTests.length !== 2"
          @click="compareSelected"
        >
          <template #icon><GitCompare :size="15" /></template>
          {{ t('history.btnCompare') }} ({{ selectedTests.length }}/2)
        </BaseButton>
      </div>
    </div>

    <!-- Table of Tests -->
    <div class="tests-card j-card">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>{{ t('common.loading') }}</span>
      </div>

      <EmptyState
        v-else-if="!tests.length"
        :title="t('history.emptyTitle')"
        :description="t('history.emptyDesc')"
      >
        <template #action>
          <router-link to="/new">
            <BaseButton>{{ t('header.btnNew') }}</BaseButton>
          </router-link>
        </template>
      </EmptyState>

      <div v-else class="table-responsive">
        <table class="j-table">
          <thead>
            <tr>
              <th style="width: 44px;"></th>
              <th>{{ t('history.thNameTarget') }}</th>
              <th>{{ t('history.thType') }}</th>
              <th>{{ t('history.thVUs') }}</th>
              <th>{{ t('history.thDuration') }}</th>
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
            <tr
              v-for="test in tests"
              :key="test.id"
              :class="{ 'row-checked': isSelected(test.id) }"
            >
              <td>
                <input
                  type="checkbox"
                  :checked="isSelected(test.id)"
                  :disabled="!isSelected(test.id) && selectedTests.length >= 2"
                  @change="toggleSelect(test.id)"
                />
              </td>
              <td>
                <router-link :to="`/test/${test.id}`" class="test-title-link">
                  {{ test.name }}
                </router-link>
                <span class="target-subtext font-mono">{{ test.target_url }}</span>
              </td>
              <td>
                <span class="type-pill">{{ test.test_type }}</span>
              </td>
              <td class="font-mono">{{ test.vus }}</td>
              <td class="font-mono">{{ test.duration }}s</td>
              <td style="text-align: right;" class="font-mono text-cyan">
                {{ test.avg_time ? `${test.avg_time} ms` : '-' }}
              </td>
              <td style="text-align: right;" class="font-mono text-amber">
                {{ test.p95 ? `${test.p95} ms` : '-' }}
              </td>
              <td style="text-align: right;" class="font-mono">
                {{ test.throughput ? `${test.throughput} req/s` : '-' }}
              </td>
              <td style="text-align: right;" class="font-mono" :class="test.error_rate > 0 ? 'text-red' : 'text-green'">
                {{ test.error_rate !== null ? `${test.error_rate}%` : '-' }}
              </td>
              <td>
                <StatusBadge :status="test.status" />
              </td>
              <td class="date-cell">{{ formatDate(test.started_at || test.created_at) }}</td>
              <td style="text-align: right;">
                <div class="table-row-actions">
                  <router-link :to="`/test/${test.id}`">
                    <button class="action-btn" title="Ver Resultados">
                      <Eye :size="15" />
                    </button>
                  </router-link>
                  <button class="action-btn text-cyan" @click="inspectJmxPlan(test)" title="Inspecionar Plano XML (.JMX)">
                    <Code2 :size="15" />
                  </button>
                  <a :href="`/api/reports/${test.id}/jmx`" target="_blank" class="action-btn text-blue" title="Baixar Plano .JMX">
                    <Download :size="15" />
                  </a>
                  <button class="action-btn text-red" @click="confirmDelete(test)" title="Excluir">
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <BaseModal
      :isOpen="isDeleteModalOpen"
      :title="t('history.deleteTitle')"
      maxWidth="480px"
      @close="isDeleteModalOpen = false"
    >
      <div class="delete-confirm-content">
        <p>{{ t('history.deleteConfirm') }} <strong>{{ testToDelete?.name }}</strong>?</p>
        <span class="delete-warning">{{ t('history.deleteWarning') }}</span>
      </div>

      <template #footer>
        <BaseButton variant="secondary" @click="isDeleteModalOpen = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="deleteTest">
          {{ t('common.delete') }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from '../composables/useI18n.js';
import { useJMetrixStore } from '../composables/useJMetrixStore.js';
import StatusBadge from '../components/common/StatusBadge.vue';
import BaseButton from '../components/common/BaseButton.vue';
import BaseModal from '../components/common/BaseModal.vue';
import EmptyState from '../components/common/EmptyState.vue';
import {
  Search,
  GitCompare,
  Eye,
  Trash2,
  Code2,
  Download
} from 'lucide-vue-next';

const router = useRouter();
const api = useApi();
const toast = useToast();
const { t, locale } = useI18n();
const { state: storeState, inspectJmxPlan } = useJMetrixStore();

// Pre-fill instantly with cached store data
const tests = ref(storeState.tests || []);
const loading = ref(!storeState.tests || storeState.tests.length === 0);
const selectedTests = ref([]);

const filters = ref({
  search: '',
  testType: '',
  status: ''
});

const isDeleteModalOpen = ref(false);
const testToDelete = ref(null);
const isDeleting = ref(false);

let searchTimeout = null;
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadTests();
  }, 350);
}

async function loadTests() {
  try {
    if (!tests.value.length) {
      loading.value = true;
    }
    const query = new URLSearchParams();
    if (filters.value.search) query.append('search', filters.value.search);
    if (filters.value.testType) query.append('testType', filters.value.testType);
    if (filters.value.status) query.append('status', filters.value.status);

    const res = await api.get(`/tests?${query.toString()}`);
    const items = res.items || [];
    tests.value = items;
    if (!filters.value.search && !filters.value.testType && !filters.value.status) {
      storeState.tests = items;
    }
  } catch (err) {
    console.error('Erro ao carregar testes', err);
  } finally {
    loading.value = false;
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const loc = locale.value === 'pt' ? 'pt-BR' : (locale.value === 'es' ? 'es-ES' : 'en-US');
  return d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function isSelected(id) {
  return selectedTests.value.includes(id);
}

function toggleSelect(id) {
  const index = selectedTests.value.indexOf(id);
  if (index >= 0) {
    selectedTests.value.splice(index, 1);
  } else if (selectedTests.value.length < 2) {
    selectedTests.value.push(id);
  }
}

function compareSelected() {
  if (selectedTests.value.length !== 2) return;
  router.push(`/compare?testA=${selectedTests.value[0]}&testB=${selectedTests.value[1]}`);
}

function confirmDelete(test) {
  testToDelete.value = test;
  isDeleteModalOpen.value = true;
}

async function deleteTest() {
  if (!testToDelete.value) return;
  try {
    isDeleting.value = true;
    await api.delete(`/tests/${testToDelete.value.id}`);
    toast.success('Excluído', 'O registro foi removido com sucesso.');
    isDeleteModalOpen.value = false;
    loadTests();
  } catch (err) {
    toast.error('Erro ao excluir', err.message);
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  loadTests();
});
</script>

<style scoped>
.history-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Toolbar */
.history-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 22px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--text-subtle);
}

.search-box input {
  width: 100%;
  padding-left: 38px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Table Card */
.tests-card {
  padding: 0;
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
}

.j-table th {
  background: var(--bg-surface);
  padding: 12px 14px;
}

.j-table td {
  padding: 14px;
}

.row-checked {
  background: var(--blue-glow);
}

.test-title-link {
  font-weight: 700;
  color: var(--text-main);
  display: block;
}

.test-title-link:hover {
  color: var(--electric-blue);
}

.target-subtext {
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
  font-weight: 700;
  color: var(--text-muted);
}

.date-cell {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.table-row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-surface);
  color: var(--text-main);
}

.action-btn.text-red:hover {
  background: var(--danger-bg);
  color: var(--danger);
}

.delete-confirm-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  color: var(--text-main);
}

.delete-warning {
  font-size: 12px;
  color: var(--text-subtle);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 12px;
  color: var(--text-muted);
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(37, 99, 235, 0.2);
  border-top-color: var(--electric-blue);
  border-radius: 50%;
  animation: spinSlow 0.8s linear infinite;
}

@media (max-width: 768px) {
  .history-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box {
    min-width: 100%;
  }
}
</style>
