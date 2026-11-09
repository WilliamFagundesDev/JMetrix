<template>
  <BaseModal
    :isOpen="!!test"
    maxWidth="900px"
    :title="`Plano de Teste Apache JMeter (.JMX) — ${test?.name || ''}`"
    @close="$emit('close')"
  >
    <div class="jmx-inspector-container" v-if="test">
      <!-- Plan Summary Cards -->
      <div class="plan-summary-grid">
        <div class="plan-meta-box">
          <span class="meta-label">Arquivo de Plano</span>
          <span class="meta-value font-mono text-cyan">plano_jmeter_{{ test.id.slice(0, 8) }}.jmx</span>
        </div>
        <div class="plan-meta-box">
          <span class="meta-label">Motor Compatível</span>
          <span class="meta-value font-mono">Apache JMeter 5.6.3+</span>
        </div>
        <div class="plan-meta-box">
          <span class="meta-label">Thread Group</span>
          <span class="meta-value font-mono text-amber">{{ test.vus }} VUs &bull; {{ test.duration }}s (Ramp: {{ test.ramp_up || 0 }}s)</span>
        </div>
        <div class="plan-meta-box">
          <span class="meta-label">Destino</span>
          <span class="meta-value font-mono">{{ test.target_url }}</span>
        </div>
      </div>

      <!-- Action Buttons Bar -->
      <div class="plan-actions-bar">
        <div class="left-actions">
          <a :href="`/api/reports/${test.id}/jmx`" target="_blank" class="download-jmx-btn">
            <Download :size="15" />
            <span>Baixar Plano (.JMX) para JMeter GUI</span>
          </a>
          <button class="copy-btn" @click="copyXml">
            <Copy :size="15" />
            <span>{{ copied ? 'XML Copiado!' : 'Copiar XML' }}</span>
          </button>
        </div>
        <span class="xml-tag">XML Nativo JMeter 1.2 / Propriedades 5.0</span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="xml-loader">
        <div class="loading-spinner"></div>
        <span>Carregando árvore XML do plano Apache JMeter...</span>
      </div>

      <!-- Code Viewer with Line Numbers -->
      <div v-else class="xml-code-wrapper">
        <pre class="xml-code-view"><code>{{ jmxContent }}</code></pre>
      </div>

      <!-- JMeter Plan Components Architecture Guide -->
      <div class="components-breakdown">
        <h4 class="comp-title">Estrutura Interna deste Plano JMX:</h4>
        <div class="comp-tags-list">
          <div class="comp-tag">
            <strong>&lt;TestPlan&gt;</strong>
            <span>Configurações globais e argumentos</span>
          </div>
          <div class="comp-tag">
            <strong>&lt;ThreadGroup&gt;</strong>
            <span>Controle de concorrência e agendamento ({{ test.vus }} threads)</span>
          </div>
          <div class="comp-tag">
            <strong>&lt;HeaderManager&gt;</strong>
            <span>Emulação de User-Agent moderno e Accept headers</span>
          </div>
          <div class="comp-tag">
            <strong>&lt;CookieManager&gt;</strong>
            <span>Isolamento e persistência de sessão por VU</span>
          </div>
          <div class="comp-tag">
            <strong>&lt;UniformRandomTimer&gt;</strong>
            <span>Pacing humano estocástico (delay uniforme)</span>
          </div>
          <div class="comp-tag">
            <strong>&lt;HTTPSamplerProxy&gt;</strong>
            <span>Disparador HTTP de alta vazão</span>
          </div>
          <div class="comp-tag">
            <strong>&lt;ResponseAssertion&gt;</strong>
            <span>Validação de códigos HTTP 2xx/3xx</span>
          </div>
          <div class="comp-tag">
            <strong>&lt;ResultCollector&gt;</strong>
            <span>Coletor de telemetria e log CSV JTL</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer-actions">
        <a :href="`/api/reports/${test?.id}/jmx`" target="_blank" class="download-jmx-btn-sm">
          <Download :size="14" />
          <span>Baixar .JMX</span>
        </a>
        <BaseButton variant="secondary" @click="$emit('close')">Fechar</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';
import { useApi } from '../../composables/useApi.js';
import { useToast } from '../../composables/useToast.js';
import { Download, Copy } from 'lucide-vue-next';

const props = defineProps({
  test: {
    type: Object,
    default: null
  }
});

defineEmits(['close']);

const api = useApi();
const toast = useToast();
const loading = ref(false);
const jmxContent = ref('');
const copied = ref(false);

watch(() => props.test, async (newTest) => {
  if (newTest && newTest.id) {
    loading.value = true;
    jmxContent.value = '';
    copied.value = false;
    try {
      const res = await api.get(`/reports/${newTest.id}/jmx-content`);
      jmxContent.value = res.jmxContent || '';
    } catch (err) {
      toast.error('Erro ao carregar JMX', err.message);
    } finally {
      loading.value = false;
    }
  }
}, { immediate: true });

async function copyXml() {
  if (!jmxContent.value) return;
  try {
    await navigator.clipboard.writeText(jmxContent.value);
    copied.value = true;
    toast.success('Copiado!', 'XML do plano JMeter copiado para a área de transferência.');
    setTimeout(() => { copied.value = false; }, 3000);
  } catch {
    toast.error('Erro', 'Não foi possível copiar o XML.');
  }
}
</script>

<style scoped>
.jmx-inspector-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.plan-meta-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.meta-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.meta-value {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.download-jmx-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--electric-blue), #1d4ed8);
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 2px 8px var(--blue-glow);
  transition: all var(--transition-fast);
}

.download-jmx-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px var(--blue-glow);
}

.download-jmx-btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--electric-blue);
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.copy-btn:hover {
  background: var(--bg-surface-hover);
  border-color: var(--electric-blue);
}

.xml-tag {
  font-size: 11px;
  color: var(--text-muted);
  font-family: monospace;
}

.xml-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  background: #0b0f19;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-muted);
}

.xml-code-wrapper {
  background: #0b0f19;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  max-height: 380px;
  overflow: auto;
  position: relative;
}

.xml-code-view {
  margin: 0;
  padding: 16px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #38bdf8;
  white-space: pre;
}

.components-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 14px;
}

.comp-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.comp-tags-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 8px;
}

.comp-tag {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comp-tag strong {
  font-size: 11.5px;
  color: var(--electric-blue);
  font-family: monospace;
}

.comp-tag span {
  font-size: 11px;
  color: var(--text-muted);
}

.modal-footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  justify-content: flex-end;
}
</style>
