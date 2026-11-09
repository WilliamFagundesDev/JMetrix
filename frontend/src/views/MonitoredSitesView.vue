<template>
  <div class="sites-view animate-fade-in">
    <!-- Header with Add Site Action and JMX Logo -->
    <div class="sites-header j-card">
      <div class="header-brand-box">
        <JmxLogo size="sm" :withText="false" />
        <div>
          <h2 class="section-title">{{ t('sites.title') }}</h2>
          <span class="section-subtitle">{{ t('sites.subtitle') }}</span>
        </div>
      </div>
      <BaseButton @click="isAddModalOpen = true">
        <template #icon><Plus :size="16" /></template>
        {{ t('sites.btnAdd') }}
      </BaseButton>
    </div>

    <!-- Sites Grid -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>{{ t('common.loading') }}</span>
    </div>

    <EmptyState
      v-else-if="!sites.length"
      :title="t('sites.emptyTitle')"
      :description="t('sites.emptyDesc')"
    >
      <template #action>
        <BaseButton @click="isAddModalOpen = true">{{ t('sites.btnFirst') }}</BaseButton>
      </template>
    </EmptyState>

    <div v-else class="sites-grid">
      <div v-for="site in sites" :key="site.id" class="site-card j-card j-card-interactive">
        <div class="site-card-top">
          <div class="site-avatar">
            <Globe :size="20" />
          </div>
          <div class="site-info">
            <router-link :to="`/sites/${site.id}`" class="site-name-link">
              {{ site.name }}
            </router-link>
            <span class="site-url font-mono">{{ site.url }}</span>
          </div>
          <button class="delete-btn" @click.stop="confirmDelete(site)" :title="t('common.remove')">
            <Trash2 :size="15" />
          </button>
        </div>

        <p class="site-desc">{{ site.description || '-' }}</p>

        <div class="site-metrics-grid">
          <div class="m-box">
            <span class="m-lbl">{{ t('sites.testsCount') }}</span>
            <span class="m-val font-mono">{{ site.testCount }}</span>
          </div>
          <div class="m-box">
            <span class="m-lbl">{{ t('sites.avgLatency') }}</span>
            <span class="m-val font-mono text-cyan">{{ site.avgLatency ? `${site.avgLatency} ms` : '-' }}</span>
          </div>
          <div class="m-box">
            <span class="m-lbl">{{ t('sites.errorRate') }}</span>
            <span class="m-val font-mono" :class="site.avgErrorRate > 0 ? 'text-red' : 'text-green'">
              {{ site.avgErrorRate !== null ? `${site.avgErrorRate}%` : '-' }}
            </span>
          </div>
        </div>

        <div class="site-card-footer">
          <span class="last-tested">
            {{ site.lastTestedAt ? `${t('sites.lastTest')}: ${formatDate(site.lastTestedAt)}` : t('sites.noTests') }}
          </span>
          <div class="footer-btns">
            <router-link :to="`/new?url=${encodeURIComponent(site.url)}`">
              <BaseButton size="sm" variant="primary">
                <template #icon><Zap :size="13" /></template>
                Testar
              </BaseButton>
            </router-link>
            <router-link :to="`/sites/${site.id}`">
              <BaseButton size="sm" variant="outline">{{ t('sites.btnHistory') }}</BaseButton>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Site Modal -->
    <BaseModal
      :isOpen="isAddModalOpen"
      :title="t('sites.modalTitle')"
      maxWidth="500px"
      @close="isAddModalOpen = false"
    >
      <form @submit.prevent="createSite" class="add-site-form">
        <div class="form-group">
          <label class="field-label">{{ t('sites.fieldName') }}</label>
          <input
            v-model="newSite.name"
            type="text"
            placeholder="Ex: Portal Corporativo, E-commerce, API Principal"
            required
          />
        </div>

        <div class="form-group">
          <label class="field-label">{{ t('sites.fieldUrl') }}</label>
          <input
            v-model="newSite.url"
            type="url"
            placeholder="https://exemplo.com.br"
            required
          />
        </div>

        <div class="form-group">
          <label class="field-label">{{ t('sites.fieldDesc') }}</label>
          <textarea
            v-model="newSite.description"
            rows="3"
            placeholder="..."
          ></textarea>
        </div>

        <div class="modal-form-actions">
          <BaseButton variant="secondary" type="button" @click="isAddModalOpen = false">{{ t('common.cancel') }}</BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">{{ t('sites.btnCreate') }}</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Delete Confirm Modal -->
    <BaseModal
      :isOpen="isDeleteModalOpen"
      :title="t('sites.removeTitle')"
      maxWidth="460px"
      @close="isDeleteModalOpen = false"
    >
      <div class="delete-confirm-content">
        <p>{{ t('sites.removeConfirm') }} <strong>{{ siteToDelete?.name }}</strong>?</p>
        <span class="delete-warning">Os testes históricos associados permanecerão no banco de dados.</span>
      </div>

      <template #footer>
        <BaseButton variant="secondary" @click="isDeleteModalOpen = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="deleteSite">
          {{ t('common.remove') }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from '../composables/useI18n.js';
import { useJMetrixStore } from '../composables/useJMetrixStore.js';
import BaseButton from '../components/common/BaseButton.vue';
import BaseModal from '../components/common/BaseModal.vue';
import EmptyState from '../components/common/EmptyState.vue';
import JmxLogo from '../components/common/JmxLogo.vue';
import { Globe, Plus, Trash2, Zap } from 'lucide-vue-next';

const api = useApi();
const toast = useToast();
const { t, locale } = useI18n();
const { state: storeState } = useJMetrixStore();

// Pre-fill instantly with cached store data
const sites = ref(storeState.sites || []);
const loading = ref(!storeState.sites || storeState.sites.length === 0);
const isAddModalOpen = ref(false);
const isSubmitting = ref(false);

const newSite = ref({
  name: '',
  url: '',
  description: ''
});

const isDeleteModalOpen = ref(false);
const siteToDelete = ref(null);
const isDeleting = ref(false);

async function loadSites() {
  try {
    if (!sites.value.length) {
      loading.value = true;
    }
    const res = await api.get('/sites');
    const items = Array.isArray(res) ? res : (res?.sites || []);
    sites.value = items;
    storeState.sites = items;
  } catch (err) {
    console.error('Erro ao carregar sites', err);
  } finally {
    loading.value = false;
  }
}

async function createSite() {
  try {
    isSubmitting.value = true;
    await api.post('/sites', newSite.value);
    toast.success('Aplicação Cadastrada', 'O domínio foi registrado com sucesso.');
    isAddModalOpen.value = false;
    newSite.value = { name: '', url: '', description: '' };
    loadSites();
  } catch (err) {
    toast.error('Erro ao cadastrar', err.message);
  } finally {
    isSubmitting.value = false;
  }
}

function confirmDelete(site) {
  siteToDelete.value = site;
  isDeleteModalOpen.value = true;
}

async function deleteSite() {
  if (!siteToDelete.value) return;
  try {
    isDeleting.value = true;
    await api.delete(`/sites/${siteToDelete.value.id}`);
    toast.success('Removido', 'Aplicação removida com sucesso.');
    isDeleteModalOpen.value = false;
    loadSites();
  } catch (err) {
    toast.error('Erro ao remover', err.message);
  } finally {
    isDeleting.value = false;
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const loc = locale.value === 'pt' ? 'pt-BR' : (locale.value === 'es' ? 'es-ES' : 'en-US');
  return new Date(isoStr).toLocaleDateString(loc);
}

onMounted(() => {
  loadSites();
});
</script>

<style scoped>
.sites-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sites-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-brand-box {
  display: flex;
  align-items: center;
  gap: 14px;
}

.footer-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main);
}

.section-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.site-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.site-card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.site-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--blue-glow);
  color: var(--cyan-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.site-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.site-name-link {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.site-name-link:hover {
  color: var(--cyan-accent);
}

.site-url {
  font-size: 11px;
  color: var(--text-subtle);
}

.delete-btn {
  color: var(--text-subtle);
  padding: 4px;
  border-radius: 4px;
  transition: all var(--transition-fast);
}

.delete-btn:hover {
  color: var(--danger);
  background: var(--danger-bg);
}

.site-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.45;
  min-height: 36px;
}

.site-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px 12px;
}

.m-box {
  display: flex;
  flex-direction: column;
}

.m-lbl {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.m-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.site-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-subtle);
  padding-top: 14px;
}

.last-tested {
  font-size: 11.5px;
  color: var(--text-subtle);
}

/* Modal form */
.add-site-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.modal-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.delete-confirm-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-main);
}

.delete-warning {
  font-size: 12px;
  color: var(--text-muted);
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

.font-mono { font-family: var(--font-mono); }
.text-cyan { color: var(--cyan-accent); }
.text-green { color: var(--success); }
.text-red { color: var(--danger); }
</style>
