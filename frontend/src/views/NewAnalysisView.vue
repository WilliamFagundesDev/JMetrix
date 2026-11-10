<template>
  <div class="new-analysis-view animate-fade-in">
    <!-- Stepper Navigation Header -->
    <div class="stepper-header glass-panel">
      <div
        class="step-item"
        :class="{ 'is-active': currentStep === 1, 'is-completed': currentStep > 1 }"
        @click="goToStep(1)"
      >
        <span class="step-num">1</span>
        <div class="step-text">
          <strong class="step-label">{{ t('newAnalysis.step1') }}</strong>
          <span class="step-desc">{{ t('newAnalysis.step1Desc') }}</span>
        </div>
      </div>

      <div class="step-separator"></div>

      <div
        class="step-item"
        :class="{ 'is-active': currentStep === 2, 'is-completed': currentStep > 2, 'is-disabled': !preflightSuccess }"
        @click="goToStep(2)"
      >
        <span class="step-num">2</span>
        <div class="step-text">
          <strong class="step-label">{{ t('newAnalysis.step2') }}</strong>
          <span class="step-desc">{{ t('newAnalysis.step2Desc') }}</span>
        </div>
      </div>

      <div class="step-separator"></div>

      <div
        class="step-item"
        :class="{ 'is-active': currentStep === 3, 'is-completed': currentStep > 3, 'is-disabled': !selectedEndpoints.length }"
        @click="goToStep(3)"
      >
        <span class="step-num">3</span>
        <div class="step-text">
          <strong class="step-label">{{ t('newAnalysis.step3') }}</strong>
          <span class="step-desc">{{ t('newAnalysis.step3Desc') }}</span>
        </div>
      </div>
    </div>

    <!-- ETAPA 1: Informar o Endereço -->
    <div v-if="currentStep === 1" class="step-content j-card animate-fade-in">
      <div class="step-intro flex-between-intro">
        <div>
          <h2 class="step-title">{{ t('newAnalysis.titleStep1') }}</h2>
          <p class="step-subtitle">
            {{ t('newAnalysis.subtitleStep1') }}
          </p>
        </div>
        <JmxLogo size="sm" :withText="true" subtitle="Motor Apache JMeter 5.6.3" />
      </div>

      <div class="url-input-container">
        <div class="input-wrapper">
          <Globe class="input-icon" :size="20" />
          <input
            v-model="targetUrl"
            type="url"
            class="target-url-input"
            placeholder="https://exemplo.com.br"
            @keyup.enter="validateUrl"
            :disabled="isValidating"
          />
        </div>
        <BaseButton size="lg" :loading="isValidating" @click="validateUrl">
          <template #icon><Search :size="16" /></template>
          {{ t('newAnalysis.btnVerify') }}
        </BaseButton>
      </div>

      <!-- SSRF Notice Box -->
      <div class="security-banner">
        <ShieldCheck :size="20" class="text-green" />
        <div class="banner-text">
          <strong>{{ t('newAnalysis.ssrfTitle') }}</strong>
          <span>{{ t('newAnalysis.ssrfDesc') }}</span>
        </div>
      </div>

      <!-- Pre-flight Result Card -->
      <div v-if="preflightResult" class="preflight-card" :class="preflightResult.accessible ? 'border-success' : 'border-danger'">
        <div class="preflight-header">
          <div class="status-indicator">
            <CheckCircle2 v-if="preflightResult.accessible" class="text-green" :size="24" />
            <XCircle v-else class="text-red" :size="24" />
            <div>
              <h4 class="preflight-title">
                {{ preflightResult.accessible ? t('newAnalysis.targetAccessible') : t('newAnalysis.targetFailed') }}
              </h4>
              <span class="preflight-url font-mono">{{ preflightResult.sanitizedUrl }}</span>
            </div>
          </div>
          <span v-if="preflightResult.status" class="badge" :class="preflightResult.accessible ? 'badge-success' : 'badge-danger'">
            HTTP {{ preflightResult.status }}
          </span>
        </div>

        <div class="preflight-details" v-if="preflightResult.accessible">
          <div class="detail-box">
            <span class="detail-label">{{ t('newAnalysis.pageTitle') }}</span>
            <span class="detail-val">{{ preflightResult.title || 'Sem título' }}</span>
          </div>
          <div class="detail-box">
            <span class="detail-label">{{ t('newAnalysis.initialLatency') }}</span>
            <span class="detail-val font-mono text-cyan">{{ preflightResult.latencyMs }} ms</span>
          </div>
          <div class="detail-box">
            <span class="detail-label">{{ t('newAnalysis.protocol') }}</span>
            <span class="detail-val">{{ preflightResult.sanitizedUrl.startsWith('https') ? 'HTTPS (Seguro)' : 'HTTP' }}</span>
          </div>
        </div>

        <div v-if="!preflightResult.accessible" class="error-box">
          {{ preflightResult.error || 'O servidor de destino não respondeu adequadamente.' }}
        </div>

        <div class="preflight-action" v-if="preflightResult.accessible">
          <BaseButton size="md" @click="startDiscovery">
            <template #icon><Compass :size="16" /></template>
            {{ t('newAnalysis.btnAdvanceDiscovery') }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- ETAPA 2: Descoberta da Aplicação -->
    <div v-if="currentStep === 2" class="step-content j-card animate-fade-in">
      <div class="step-intro">
        <h2 class="step-title">{{ t('newAnalysis.titleStep2') }}</h2>
        <p class="step-subtitle">
          {{ t('newAnalysis.subtitleStep2') }}
        </p>
      </div>

      <!-- Crawler Progress or Summary -->
      <div v-if="isCrawling" class="crawling-loader">
        <div class="radar-spinner"></div>
        <h4 class="crawling-title">{{ t('newAnalysis.crawlingTitle') }}</h4>
        <span class="crawling-sub">{{ t('newAnalysis.crawlingSub') }}</span>
      </div>

      <div v-else>
        <!-- Discovery Summary Badges -->
        <div class="discovery-metrics-bar">
          <div class="disc-stat">
            <span class="disc-label">{{ t('newAnalysis.pagesFound') }}</span>
            <span class="disc-value font-mono">{{ discoveredPages.length }}</span>
          </div>
          <div class="disc-stat">
            <span class="disc-label">{{ t('newAnalysis.endpointsSelected') }}</span>
            <span class="disc-value text-cyan font-mono">{{ selectedEndpoints.length }}</span>
          </div>
          <div class="disc-stat">
            <span class="disc-label">{{ t('newAnalysis.sitemap') }}</span>
            <span class="disc-value" :class="sitemapFound ? 'text-green' : 'text-muted'">
              {{ sitemapFound ? t('newAnalysis.sitemapFound') : t('newAnalysis.sitemapNotFound') }}
            </span>
          </div>
          <div class="disc-stat">
            <span class="disc-label">{{ t('newAnalysis.robots') }}</span>
            <span class="disc-value text-green">{{ t('newAnalysis.robotsRespected') }}</span>
          </div>
        </div>

        <!-- Endpoints Selection Table -->
        <div class="endpoints-table-box">
          <div class="table-actions">
            <label class="select-all-label">
              <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
              <span>{{ t('newAnalysis.selectAll') }} ({{ discoveredPages.length }})</span>
            </label>
            <BaseButton size="sm" variant="ghost" @click="startDiscovery">
              <RefreshCw :size="14" />
              {{ t('newAnalysis.recrawl') }}
            </BaseButton>
          </div>

          <div class="table-responsive">
            <table class="j-table">
              <thead>
                <tr>
                  <th style="width: 44px;"></th>
                  <th>Caminho / Título</th>
                  <th>Status HTTP</th>
                  <th>Latência Inicial</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="page in discoveredPages" :key="page.url" :class="{ 'row-selected': isSelected(page) }">
                  <td>
                    <input
                      type="checkbox"
                      :checked="isSelected(page)"
                      @change="toggleEndpoint(page)"
                    />
                  </td>
                  <td>
                    <span class="page-path font-mono">{{ page.path }}</span>
                    <span class="page-title-sub">{{ page.title }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="page.isHealthy ? 'badge-success' : 'badge-danger'">
                      {{ page.status || 'Falhou' }}
                    </span>
                  </td>
                  <td class="font-mono text-cyan">{{ page.latencyMs }} ms</td>
                  <td>
                    <span class="depth-tag">Profundidade {{ page.depth }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="step-footer">
          <BaseButton variant="secondary" @click="currentStep = 1">{{ t('common.back') }}</BaseButton>
          <BaseButton :disabled="!selectedEndpoints.length" @click="currentStep = 3">
            {{ t('newAnalysis.btnConfigScenario') }} ({{ selectedEndpoints.length }} rotas)
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- ETAPA 3: Configuração dos Testes -->
    <div v-if="currentStep === 3" class="step-content j-card animate-fade-in">
      <div class="step-intro flex-between-intro">
        <div>
          <h2 class="step-title">{{ t('newAnalysis.titleStep3') }}</h2>
          <p class="step-subtitle">
            {{ t('newAnalysis.subtitleStep3') }}
          </p>
        </div>
        <button class="btn-guide-helper" @click="openJmeterGuide" type="button">
          <BookOpen :size="15" />
          <span>Dúvidas? Guia das Modalidades</span>
        </button>
      </div>

      <!-- Test Types Cards -->
      <div class="test-types-grid">
        <div
          v-for="tItem in testTypes"
          :key="tItem.id"
          class="test-type-card"
          :class="{ 'is-selected': testConfig.testType === tItem.id }"
          @click="selectTestType(tItem.id)"
        >
          <div class="type-icon-box">
            <component :is="tItem.icon" :size="24" />
          </div>
          <h4 class="type-name">{{ tItem.name }}</h4>
          <p class="type-desc">{{ tItem.desc }}</p>
          <span class="type-badge">{{ tItem.badge }}</span>
        </div>
      </div>

      <!-- Presets & Parameters -->
      <div class="config-parameters-grid">
        <div class="presets-section">
          <label class="field-label">{{ t('newAnalysis.presetProfile') }}</label>
          <div class="presets-buttons">
            <button
              v-for="p in presets"
              :key="p.id"
              class="preset-btn"
              :class="{ 'active': testConfig.presetProfile === p.id }"
              @click="applyPreset(p)"
            >
              <strong>{{ p.name }}</strong>
              <span>{{ p.vus }} VUs &bull; {{ p.duration }}s</span>
            </button>
          </div>
        </div>

        <div class="sliders-section">
          <!-- VUs Slider -->
          <div class="parameter-item">
            <div class="param-header">
              <label class="field-label">{{ t('newAnalysis.sliderVUs') }}</label>
              <span class="param-val font-mono">{{ testConfig.vus }} VUs</span>
            </div>
            <input
              v-model.number="testConfig.vus"
              type="range"
              min="1"
              :max="maxAllowedVus"
              step="1"
              class="range-slider"
            />
            <span class="param-hint">{{ t('newAnalysis.sliderVUsHint', { max: maxAllowedVus }) }}</span>
          </div>

          <!-- Duration Slider -->
          <div class="parameter-item">
            <div class="param-header">
              <label class="field-label">{{ t('newAnalysis.sliderDuration') }}</label>
              <span class="param-val font-mono">{{ testConfig.duration }} {{ t('newAnalysis.seconds') }}</span>
            </div>
            <input
              v-model.number="testConfig.duration"
              type="range"
              min="10"
              :max="maxAllowedDuration"
              step="5"
              class="range-slider"
            />
            <span class="param-hint">{{ t('newAnalysis.sliderDurationHint') }}</span>
          </div>

          <!-- Ramp-up Slider -->
          <div class="parameter-item">
            <div class="param-header">
              <label class="field-label">{{ t('newAnalysis.sliderRampUp') }}</label>
              <span class="param-val font-mono">{{ testConfig.rampUp }} {{ t('newAnalysis.seconds') }}</span>
            </div>
            <input
              v-model.number="testConfig.rampUp"
              type="range"
              min="0"
              :max="testConfig.duration"
              step="1"
              class="range-slider"
            />
            <span class="param-hint">{{ t('newAnalysis.sliderRampUpHint') }}</span>
          </div>
        </div>
      </div>

      <!-- Authorization Agreement Checkbox (MANDATORY) -->
      <div class="auth-agreement-box">
        <label class="checkbox-container">
          <input type="checkbox" v-model="authorized" />
          <span class="checkbox-label">
            <strong>{{ t('newAnalysis.authTitle') }}</strong>
            {{ t('newAnalysis.authDesc') }} ({{ targetUrl }}).
          </span>
        </label>
      </div>

      <!-- Action Buttons -->
      <div class="step-footer">
        <BaseButton variant="secondary" @click="currentStep = 2">{{ t('common.back') }}</BaseButton>
        <BaseButton
          size="lg"
          :disabled="!authorized || isLaunching"
          :loading="isLaunching"
          @click="launchTest"
        >
          <template #icon><Zap :size="16" /></template>
          {{ t('newAnalysis.btnStartJMeter') }}
        </BaseButton>
      </div>
    </div>

    <!-- Live Execution Modal Overlay -->
    <BaseModal
      :isOpen="isExecuting"
      :closeOnBackdrop="false"
      maxWidth="740px"
      title="Execução do Apache JMeter em Tempo Real"
      @close="cancelExecution"
    >
      <LiveEngineWidget
        :testName="createdTest?.name || 'Teste em Andamento'"
        :targetUrl="targetUrl"
        :stage="createdTest?.status || 'running'"
        :progressPercent="liveTelemetry.progressPercent || 0"
        :elapsedSec="liveTelemetry.elapsedSec || 0"
        :activeVus="liveTelemetry.activeThreads || testConfig.vus"
        :requestsCount="liveTelemetry.totalRequests || 0"
        :throughput="liveTelemetry.throughput || 0"
        :avgTime="liveTelemetry.avgResponseTime || 0"
        :errorsCount="liveTelemetry.errorCount || 0"
        @cancel="cancelExecution"
      />
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useApi } from '../composables/useApi.js';
import { useWebSocket } from '../composables/useWebSocket.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from '../composables/useI18n.js';
import BaseButton from '../components/common/BaseButton.vue';
import BaseModal from '../components/common/BaseModal.vue';
import LiveEngineWidget from '../components/common/LiveEngineWidget.vue';
import JmxLogo from '../components/common/JmxLogo.vue';
import { useJMetrixStore } from '../composables/useJMetrixStore.js';
import {
  Globe,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Compass,
  RefreshCw,
  Zap,
  Flame,
  Activity,
  TrendingUp,
  Clock,
  BookOpen
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const api = useApi();
const toast = useToast();
const { t } = useI18n();
const { openJmeterGuide } = useJMetrixStore();
const { subscribe, subscribeTest } = useWebSocket();

const currentStep = ref(1);
const targetUrl = ref('');
const isValidating = ref(false);
const preflightResult = ref(null);
const preflightSuccess = computed(() => preflightResult.value?.accessible === true);

const isCrawling = ref(false);
const discoveredPages = ref([]);
const selectedEndpoints = ref([]);
const sitemapFound = ref(false);

const maxAllowedVus = ref(500);
const maxAllowedDuration = ref(600);

const authorized = ref(false);
const isLaunching = ref(false);
const isExecuting = ref(false);
const createdTest = ref(null);
const liveTelemetry = ref({});

const testTypes = [
  {
    id: 'smoke',
    name: 'Smoke Test',
    desc: 'Verificação rápida de disponibilidade básica e respostas HTTP sem sobrecarregar o servidor.',
    badge: '1-2 VUs / 15s',
    icon: Activity
  },
  {
    id: 'load',
    name: 'Load Test',
    desc: 'Simulação realista de usuários concorrentes para medir tempos de resposta e throughput.',
    badge: '10-50 VUs / 60s',
    icon: TrendingUp
  },
  {
    id: 'stress',
    name: 'Stress Test',
    desc: 'Aumento progressivo de carga para determinar o limite máximo de suporte e saturação da aplicação.',
    badge: 'Carga Elevada',
    icon: Flame
  },
  {
    id: 'spike',
    name: 'Spike Test',
    desc: 'Simulação de pico súbito e repentino de acessos para avaliar a resiliência e recuperação.',
    badge: 'Pico Súbito',
    icon: Zap
  },
  {
    id: 'endurance',
    name: 'Endurance Test',
    desc: 'Teste sustentado de longa duração para identificar vazamento de memória ou degradação progressiva.',
    badge: 'Longa Duração',
    icon: Clock
  }
];

const presets = [
  { id: 'light', name: 'Leve', vus: 10, duration: 30, rampUp: 5 },
  { id: 'moderate', name: 'Moderado', vus: 30, duration: 60, rampUp: 10 },
  { id: 'advanced', name: 'Avançado', vus: 80, duration: 90, rampUp: 15 },
  { id: 'custom', name: 'Personalizado', vus: 20, duration: 45, rampUp: 5 }
];

const testConfig = ref({
  testType: 'load',
  presetProfile: 'moderate',
  vus: 30,
  duration: 60,
  rampUp: 10
});

function goToStep(step) {
  if (step === 2 && !preflightSuccess.value) return;
  if (step === 3 && !selectedEndpoints.value.length) return;
  currentStep.value = step;
}

async function validateUrl() {
  if (!targetUrl.value) {
    toast.warning('Atenção', 'Informe a URL da aplicação.');
    return;
  }

  let clean = targetUrl.value.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
    targetUrl.value = clean;
  }

  try {
    isValidating.value = true;
    preflightResult.value = null;
    const res = await api.post('/discovery/validate', { url: clean });
    preflightResult.value = res;
    if (res.accessible) {
      toast.success('Conexão estabelecida', `Status HTTP ${res.status} retornado em ${res.latencyMs}ms.`);
    } else {
      toast.error('Aplicação inacessível', res.error || 'Verifique se a URL está correta.');
    }
  } catch (err) {
    toast.error('Validação bloqueada', err.message);
  } finally {
    isValidating.value = false;
  }
}

async function startDiscovery() {
  currentStep.value = 2;
  isCrawling.value = true;
  discoveredPages.value = [];
  selectedEndpoints.value = [];

  try {
    const res = await api.post('/discovery/crawl', {
      url: preflightResult.value.sanitizedUrl,
      maxPages: 20
    });

    discoveredPages.value = res.pages || [];
    sitemapFound.value = res.sitemapFound;

    selectedEndpoints.value = discoveredPages.value
      .filter(p => p.isHealthy)
      .map(p => ({ path: p.path, method: 'GET', name: p.title || p.path }));

    toast.success('Descoberta concluída', `${discoveredPages.value.length} páginas analisadas.`);
  } catch (err) {
    toast.error('Erro na descoberta', err.message);
    selectedEndpoints.value = [{ path: '/', method: 'GET', name: 'Home' }];
    discoveredPages.value = [{ path: '/', title: 'Página Inicial', isHealthy: true, latencyMs: preflightResult.value.latencyMs, depth: 0 }];
  } finally {
    isCrawling.value = false;
  }
}

function isSelected(page) {
  return selectedEndpoints.value.some(e => e.path === page.path);
}

function toggleEndpoint(page) {
  const index = selectedEndpoints.value.findIndex(e => e.path === page.path);
  if (index >= 0) {
    selectedEndpoints.value.splice(index, 1);
  } else {
    selectedEndpoints.value.push({ path: page.path, method: 'GET', name: page.title || page.path });
  }
}

const isAllSelected = computed(() => {
  return discoveredPages.value.length > 0 && selectedEndpoints.value.length === discoveredPages.value.length;
});

function toggleSelectAll(e) {
  if (e.target.checked) {
    selectedEndpoints.value = discoveredPages.value.map(p => ({
      path: p.path,
      method: 'GET',
      name: p.title || p.path
    }));
  } else {
    selectedEndpoints.value = [];
  }
}

function selectTestType(typeId) {
  testConfig.value.testType = typeId;
  if (typeId === 'smoke') {
    testConfig.value.vus = 2;
    testConfig.value.duration = 20;
    testConfig.value.rampUp = 3;
  } else if (typeId === 'load') {
    testConfig.value.vus = 30;
    testConfig.value.duration = 60;
    testConfig.value.rampUp = 10;
  } else if (typeId === 'stress') {
    testConfig.value.vus = 80;
    testConfig.value.duration = 90;
    testConfig.value.rampUp = 15;
  } else if (typeId === 'spike') {
    testConfig.value.vus = 100;
    testConfig.value.duration = 45;
    testConfig.value.rampUp = 3;
  } else if (typeId === 'endurance') {
    testConfig.value.vus = 20;
    testConfig.value.duration = 180;
    testConfig.value.rampUp = 10;
  }
}

function applyPreset(preset) {
  testConfig.value.presetProfile = preset.id;
  testConfig.value.vus = preset.vus;
  testConfig.value.duration = preset.duration;
  testConfig.value.rampUp = preset.rampUp;
}

async function launchTest() {
  if (!authorized.value) {
    toast.warning('Autorização necessária', 'Você deve aceitar o termo de autorização antes de iniciar os testes.');
    return;
  }

  try {
    isLaunching.value = true;
    const testData = {
      targetUrl: preflightResult.value.sanitizedUrl,
      testType: testConfig.value.testType,
      presetProfile: testConfig.value.presetProfile,
      vus: testConfig.value.vus,
      duration: testConfig.value.duration,
      rampUp: testConfig.value.rampUp,
      endpoints: selectedEndpoints.value,
      authorized: true
    };

    const created = await api.post('/tests', testData);
    createdTest.value = created;

    await api.post(`/tests/${created.id}/start`);

    subscribeTest(created.id);
    isExecuting.value = true;
    toast.success('Motor JMeter Iniciado', 'Aguardando telemetria em tempo real...');
  } catch (err) {
    toast.error('Erro ao iniciar teste', err.message);
  } finally {
    isLaunching.value = false;
  }
}

async function cancelExecution() {
  if (!createdTest.value) return;
  try {
    await api.post(`/tests/${createdTest.value.id}/cancel`);
    toast.warning('Teste Cancelado', 'Execução abortada pelo usuário.');
    isExecuting.value = false;
  } catch (err) {
    toast.error('Erro ao cancelar', err.message);
  }
}

onMounted(async () => {
  const incomingUrl = route.query.target || route.query.url;
  if (incomingUrl) {
    targetUrl.value = decodeURIComponent(incomingUrl);
    validateUrl();
  }

  try {
    const s = await api.get('/settings');
    if (s.settings?.max_vus) maxAllowedVus.value = parseInt(s.settings.max_vus, 10);
    if (s.settings?.max_duration_seconds) maxAllowedDuration.value = parseInt(s.settings.max_duration_seconds, 10);
  } catch {}

  subscribe('test:telemetry', (data) => {
    if (createdTest.value && data.testId === createdTest.value.id) {
      liveTelemetry.value = data;
    }
  });

  subscribe('test:completed', (data) => {
    if (createdTest.value && data.testId === createdTest.value.id) {
      isExecuting.value = false;
      const completedId = createdTest.value.id;
      createdTest.value = null;
      toast.success('Teste Concluído!', 'Redirecionando para o dashboard de resultados...');
      router.push(`/test/${completedId}`);
    }
  });

  subscribe('test:failed', (data) => {
    if (createdTest.value && data.testId === createdTest.value.id) {
      isExecuting.value = false;
      toast.error('Falha no Teste', data.error || 'Ocorreu um erro no processo do JMeter.');
    }
  });
});
</script>

<style scoped>
.new-analysis-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.flex-between-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-guide-helper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-surface);
  border: 1px dashed rgba(0, 240, 255, 0.4);
  color: #00f0ff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-guide-helper:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: #00f0ff;
}

/* Stepper Header */
.stepper-header {
  border-radius: 14px;
  padding: 18px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  opacity: 0.6;
  transition: all var(--transition-fast);
}

.step-item.is-active {
  opacity: 1;
}

.step-item.is-completed {
  opacity: 0.95;
}

.step-item.is-disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.step-num {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  color: var(--text-muted);
}

.step-item.is-active .step-num {
  background: var(--electric-blue);
  color: #ffffff;
  border-color: var(--electric-blue);
  box-shadow: 0 0 14px var(--blue-glow);
}

.step-item.is-completed .step-num {
  background: var(--success-bg);
  color: var(--success);
  border-color: var(--success);
}

.step-text {
  display: flex;
  flex-direction: column;
}

.step-label {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 700;
}

.step-desc {
  font-size: 11px;
  color: var(--text-subtle);
}

.step-separator {
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
  margin: 0 24px;
}

/* Step Content */
.step-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-intro {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-main);
}

.step-subtitle {
  font-size: 13.5px;
  color: var(--text-muted);
  max-width: 820px;
  line-height: 1.5;
}

/* URL Input */
.url-input-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--cyan-accent);
}

.target-url-input {
  width: 100%;
  padding-left: 44px;
  font-size: 15px;
  height: 48px;
}

.security-banner {
  background: var(--success-bg);
  border: 1px solid rgba(5, 150, 105, 0.25);
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.banner-text {
  font-size: 12.5px;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  line-height: 1.45;
}

.banner-text strong {
  color: var(--text-main);
}

/* Pre-flight Card */
.preflight-card {
  background: var(--bg-surface);
  border-radius: 12px;
  padding: 22px;
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.border-success { border-color: rgba(5, 150, 105, 0.4); }
.border-danger { border-color: rgba(220, 38, 38, 0.4); }

.preflight-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 14px;
}

.preflight-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.preflight-url {
  font-size: 12px;
  color: var(--cyan-accent);
}

.preflight-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 14px 18px;
}

.detail-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-subtle);
  font-weight: 600;
}

.detail-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.preflight-action {
  display: flex;
  justify-content: flex-end;
}

.error-box {
  color: var(--danger);
  font-size: 13px;
  background: var(--danger-bg);
  padding: 14px;
  border-radius: 8px;
}

/* Crawler Section */
.crawling-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 16px;
}

.radar-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(2, 132, 199, 0.2);
  border-top-color: var(--cyan-accent);
  border-radius: 50%;
  animation: spinSlow 0.8s linear infinite;
}

.crawling-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.crawling-sub {
  font-size: 13px;
  color: var(--text-muted);
}

.discovery-metrics-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 14px 20px;
  margin-bottom: 20px;
}

.disc-stat {
  display: flex;
  flex-direction: column;
}

.disc-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-subtle);
  font-weight: 600;
}

.disc-value {
  font-size: 19px;
  font-weight: 800;
  color: var(--text-main);
}

.endpoints-table-box {
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
  cursor: pointer;
}

.page-path {
  font-weight: 700;
  color: var(--text-main);
  display: block;
}

.page-title-sub {
  font-size: 11.5px;
  color: var(--text-subtle);
  display: block;
}

.depth-tag {
  font-size: 11px;
  color: var(--text-subtle);
}

.row-selected {
  background: var(--blue-glow);
}

/* Step 3: Test Scenarios */
.test-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
}

.test-type-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.test-type-card:hover {
  border-color: var(--electric-blue);
  transform: translateY(-2px);
}

.test-type-card.is-selected {
  border-color: var(--electric-blue);
  background: var(--blue-glow);
  box-shadow: 0 0 16px var(--blue-glow);
}

.type-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--electric-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.type-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.type-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.45;
  flex: 1;
}

.type-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--electric-blue);
  background: var(--blue-glow);
  padding: 3px 8px;
  border-radius: 4px;
  align-self: flex-start;
  margin-top: 4px;
}

.config-parameters-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
}

.presets-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.preset-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  text-align: left;
  transition: all var(--transition-fast);
}

.preset-btn strong {
  font-size: 13px;
  color: var(--text-main);
}

.preset-btn span {
  font-size: 11px;
  color: var(--text-muted);
}

.preset-btn:hover {
  background: var(--bg-surface-hover);
}

.preset-btn.active {
  border-color: var(--electric-blue);
  background: var(--blue-glow);
}

.preset-btn.active strong {
  color: var(--electric-blue);
}

.sliders-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.parameter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.param-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--electric-blue);
}

.range-slider {
  width: 100%;
  accent-color: var(--electric-blue);
  cursor: pointer;
}

.param-hint {
  font-size: 11px;
  color: var(--text-subtle);
}

/* Agreement Box */
.auth-agreement-box {
  background: var(--warning-bg);
  border: 1px solid rgba(217, 119, 6, 0.3);
  border-radius: 10px;
  padding: 18px 22px;
}

.checkbox-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
}

.checkbox-container input {
  margin-top: 4px;
  cursor: pointer;
  accent-color: var(--electric-blue);
}

.checkbox-label {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.checkbox-label strong {
  color: var(--warning);
  display: block;
}

.step-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-subtle);
  padding-top: 20px;
  margin-top: 10px;
}

@media (max-width: 900px) {
  .config-parameters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
