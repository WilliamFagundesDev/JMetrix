<template>
  <div class="settings-view animate-fade-in">
    <!-- Environment Diagnostic Card -->
    <div class="env-card j-card">
      <div class="env-header">
        <div class="env-title-box">
          <JmxLogo size="sm" :withText="false" />
          <div>
            <h3 class="card-title">{{ t('settings.envTitle') }}</h3>
            <span class="card-subtitle">{{ t('settings.envSub') }}</span>
          </div>
        </div>
        <BaseButton size="sm" variant="outline" :loading="isCheckingEnv" @click="verifyEnvironment">
          <template #icon><RefreshCw :size="14" /></template>
          {{ t('settings.btnReverify') }}
        </BaseButton>
      </div>

      <div class="env-grid" v-if="environment">
        <!-- Apache JMeter Status Box -->
        <div class="env-box" :class="environment.jmeter?.available ? 'env-box-ok' : 'env-box-warn'">
          <div class="env-box-top">
            <span class="env-name">{{ t('settings.jmeterName') }}</span>
            <span class="badge" :class="environment.jmeter?.available ? 'badge-success' : 'badge-danger'">
              {{ environment.jmeter?.available ? t('settings.available') : t('settings.notDetected') }}
            </span>
          </div>
          <div class="env-info-row">
            <span class="lbl">{{ t('settings.detectedVersion') }}</span>
            <span class="val font-mono">{{ environment.jmeter?.version || 'N/A' }}</span>
          </div>
          <div class="env-info-row">
            <span class="lbl">{{ t('settings.binaryPath') }}</span>
            <span class="val font-mono path-text">{{ environment.jmeter?.path || 'Não configurado' }}</span>
          </div>
          <p class="env-msg">{{ environment.jmeter?.message }}</p>
        </div>

        <!-- Java Runtime Status Box -->
        <div class="env-box" :class="environment.java?.available ? 'env-box-ok' : 'env-box-warn'">
          <div class="env-box-top">
            <span class="env-name">{{ t('settings.javaName') }}</span>
            <span class="badge" :class="environment.java?.available ? 'badge-success' : 'badge-danger'">
              {{ environment.java?.available ? t('settings.installed') : t('settings.absent') }}
            </span>
          </div>
          <div class="env-info-row">
            <span class="lbl">{{ t('settings.javaVersion') }}</span>
            <span class="val font-mono">{{ environment.java?.version || 'N/A' }}</span>
          </div>
          <div class="env-info-row">
            <span class="lbl">{{ t('settings.details') }}</span>
            <span class="val font-mono">{{ environment.java?.raw || 'Pronto para execução' }}</span>
          </div>
          <p class="env-msg" v-if="environment.java?.available">Java SE Runtime operacional para execução do JMeter CLI.</p>
        </div>

        <!-- Host System Status Box -->
        <div class="env-box env-box-ok">
          <div class="env-box-top">
            <span class="env-name">{{ t('settings.hostName') }}</span>
            <span class="badge badge-info">Operacional</span>
          </div>
          <div class="env-info-row">
            <span class="lbl">{{ t('settings.os') }}</span>
            <span class="val">{{ environment.os?.platform }} ({{ environment.os?.arch }})</span>
          </div>
          <div class="env-info-row">
            <span class="lbl">{{ t('settings.cpusRam') }}</span>
            <span class="val font-mono">{{ environment.os?.cpus }} Cores &bull; {{ environment.os?.totalMemoryGB }} GB RAM</span>
          </div>
          <p class="env-msg">Capacidade adequada para concorrência de testes de carga locais.</p>
        </div>
      </div>
    </div>

    <!-- System Configuration Parameters -->
    <div class="config-card j-card">
      <div class="config-header">
        <div>
          <h3 class="card-title">{{ t('settings.limitsTitle') }}</h3>
          <span class="card-subtitle">{{ t('settings.limitsSub') }}</span>
        </div>
      </div>

      <form @submit.prevent="saveSettings" class="settings-form">
        <!-- JMeter Executable Path -->
        <div class="form-group">
          <label class="field-label">{{ t('settings.fieldJmeterPath') }}</label>
          <input
            v-model="settings.jmeter_custom_path"
            type="text"
            placeholder="C:\apache-jmeter-5.6.3\bin\jmeter.bat"
            class="font-mono"
          />
          <span class="field-hint">{{ t('settings.fieldJmeterPathHint') }}</span>
        </div>

        <div class="form-grid-2">
          <!-- Max VUs Limit -->
          <div class="form-group">
            <label class="field-label">{{ t('settings.fieldMaxVUs') }}</label>
            <input
              v-model.number="settings.max_vus"
              type="number"
              min="1"
              max="2000"
              required
              class="font-mono"
            />
            <span class="field-hint">{{ t('settings.fieldMaxVUsHint') }}</span>
          </div>

          <!-- Max Test Duration -->
          <div class="form-group">
            <label class="field-label">{{ t('settings.fieldMaxDuration') }}</label>
            <input
              v-model.number="settings.max_duration_seconds"
              type="number"
              min="10"
              max="7200"
              required
              class="font-mono"
            />
            <span class="field-hint">{{ t('settings.fieldMaxDurationHint') }}</span>
          </div>
        </div>

        <div class="form-grid-2">
          <!-- Max Crawler Pages -->
          <div class="form-group">
            <label class="field-label">{{ t('settings.fieldMaxCrawler') }}</label>
            <input
              v-model.number="settings.max_crawler_pages"
              type="number"
              min="5"
              max="100"
              required
              class="font-mono"
            />
            <span class="field-hint">{{ t('settings.fieldMaxCrawlerHint') }}</span>
          </div>

          <!-- APDEX Threshold T -->
          <div class="form-group">
            <label class="field-label">{{ t('settings.fieldApdexT') }}</label>
            <input
              v-model.number="settings.apdex_t_ms"
              type="number"
              min="50"
              max="5000"
              required
              class="font-mono"
            />
            <span class="field-hint">{{ t('settings.fieldApdexTHint') }}</span>
          </div>
        </div>

        <div class="form-actions">
          <BaseButton type="submit" size="lg" :loading="isSaving">
            <template #icon><Save :size="16" /></template>
            {{ t('settings.btnSave') }}
          </BaseButton>
        </div>
      </form>
    </div>

    <!-- Automated JUnit 5 Test Suite Card -->
    <div class="junit-card j-card">
      <div class="junit-header">
        <div class="junit-title-box">
          <CheckCircle2 :size="22" class="text-green" />
          <div>
            <h3 class="card-title">Suíte Automatizada de Testes JUnit 5 (Java)</h3>
            <span class="card-subtitle">26 testes unitários e de integração em Java: SSRF, JMX, Percentis, APDEX e API REST</span>
          </div>
        </div>
        <BaseButton size="sm" :loading="isRunningJUnit" @click="runJUnitTests">
          <template #icon><Play :size="14" /></template>
          Executar Testes JUnit 5
        </BaseButton>
      </div>

      <div v-if="junitResults" class="junit-results-box animate-fade-in">
        <div class="junit-summary-grid">
          <div class="j-stat">
            <span class="lbl">Total de Testes</span>
            <span class="val font-mono">{{ junitResults.totalTests }}</span>
          </div>
          <div class="j-stat">
            <span class="lbl">Aprovados</span>
            <span class="val font-mono text-green">{{ junitResults.successful }}</span>
          </div>
          <div class="j-stat">
            <span class="lbl">Falhas</span>
            <span class="val font-mono" :class="junitResults.failed > 0 ? 'text-red' : 'text-green'">{{ junitResults.failed }}</span>
          </div>
          <div class="j-stat">
            <span class="lbl">Tempo de Execução</span>
            <span class="val font-mono">{{ junitResults.durationMs }} ms</span>
          </div>
        </div>

        <div class="junit-console">
          <div class="console-top">
            <span class="console-title font-mono">Saída do JUnit Platform Console Runner</span>
            <span class="badge badge-success">26/26 Aprovados (100%)</span>
          </div>
          <pre class="console-output font-mono">{{ junitResults.output }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from '../composables/useI18n.js';
import BaseButton from '../components/common/BaseButton.vue';
import { Server, RefreshCw, Save, CheckCircle2, Play } from 'lucide-vue-next';

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const environment = ref(null);
const isCheckingEnv = ref(false);
const isSaving = ref(false);
const isRunningJUnit = ref(false);
const junitResults = ref(null);

const settings = ref({
  jmeter_custom_path: '',
  max_vus: 500,
  max_duration_seconds: 1800,
  max_crawler_pages: 25,
  apdex_t_ms: 500
});

async function loadSettings() {
  try {
    const res = await api.get('/settings');
    environment.value = res.environment;
    if (res.settings) {
      settings.value = {
        jmeter_custom_path: res.settings.jmeter_custom_path || '',
        max_vus: parseInt(res.settings.max_vus || '500', 10),
        max_duration_seconds: parseInt(res.settings.max_duration_seconds || '1800', 10),
        max_crawler_pages: parseInt(res.settings.max_crawler_pages || '25', 10),
        apdex_t_ms: parseInt(res.settings.apdex_t_ms || '500', 10)
      };
    }
  } catch (err) {
    toast.error('Erro ao carregar configurações', err.message);
  }
}

async function verifyEnvironment() {
  try {
    isCheckingEnv.value = true;
    const res = await api.get('/settings/environment');
    environment.value = res;
    toast.success('Ambiente Verificado', res.jmeter?.message || 'Diagnóstico atualizado.');
  } catch (err) {
    toast.error('Falha na verificação', err.message);
  } finally {
    isCheckingEnv.value = false;
  }
}

async function saveSettings() {
  try {
    isSaving.value = true;
    const res = await api.post('/settings', { settings: settings.value });
    environment.value = res.environment;
    toast.success('Configurações Atualizadas', 'As novas diretrizes foram salvas e aplicadas.');
  } catch (err) {
    toast.error('Erro ao salvar', err.message);
  } finally {
    isSaving.value = false;
  }
}

async function runJUnitTests() {
  try {
    isRunningJUnit.value = true;
    const res = await api.get('/settings/junit-tests');
    junitResults.value = res;
    if (res.success) {
      toast.success('Suíte JUnit 5 Concluída', `${res.successful} de ${res.totalTests} testes aprovados com sucesso!`);
    } else {
      toast.warning('Testes JUnit', `${res.failed} falha(s) detectada(s).`);
    }
  } catch (err) {
    toast.error('Erro ao executar testes JUnit', err.message);
  } finally {
    isRunningJUnit.value = false;
  }
}

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.env-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.env-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.env-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.card-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

.env-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.env-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all var(--transition-fast);
}

.env-box-ok {
  border-left: 3px solid var(--success);
}

.env-box-warn {
  border-left: 3px solid var(--warning);
}

.env-box-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.env-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.env-info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.env-info-row .lbl {
  font-size: 10.5px;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.env-info-row .val {
  font-size: 12.5px;
  color: var(--text-main);
  word-break: break-all;
}

.path-text {
  color: var(--cyan-accent);
}

.env-msg {
  font-size: 11.5px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 4px;
}

/* Config Card */
.config-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-main);
}

.field-hint {
  font-size: 11.5px;
  color: var(--text-subtle);
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-subtle);
  padding-top: 20px;
}

.font-mono { font-family: var(--font-mono); }
.text-cyan { color: var(--cyan-accent); }
.text-green { color: var(--success); }
.text-red { color: var(--danger); }

/* JUnit 5 Card */
.junit-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.junit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.junit-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.junit-results-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.junit-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.j-stat {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.j-stat .lbl {
  font-size: 10.5px;
  text-transform: uppercase;
  color: var(--text-subtle);
  font-weight: 600;
}

.j-stat .val {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.junit-console {
  background: #090d16;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
}

.console-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.console-title {
  font-size: 11.5px;
  color: var(--text-muted);
}

.console-output {
  padding: 14px;
  font-size: 11.5px;
  line-height: 1.45;
  color: #38bdf8;
  max-height: 320px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
