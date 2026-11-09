<template>
  <BaseModal
    :isOpen="isOpen"
    maxWidth="920px"
    title="Dicionário e Guia do Motor Apache JMeter"
    @close="$emit('close')"
  >
    <div class="jmeter-guide-container">
      <!-- Top JMX Brand Header inside guide -->
      <div class="guide-brand-banner">
        <JmxLogo size="md" :withText="true" subtitle="Manual de Engenharia de Desempenho e Observabilidade" />
        <span class="engine-badge">Motor Apache JMeter 5.6.3 Integrado</span>
      </div>

      <!-- Navigation Tabs inside Guide -->
      <div class="guide-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="guide-tab-btn"
          :class="{ 'active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" :size="16" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- TAB 1: Modalidades de Teste JMeter -->
      <div v-if="activeTab === 'scenarios'" class="tab-pane animate-fade-in">
        <h3 class="pane-title">Quando utilizar cada modalidade de teste?</h3>
        <p class="pane-subtitle">
          O Apache JMeter suporta diversas estratégias de injeção de carga. Entenda a finalidade de cada uma:
        </p>

        <div class="scenarios-grid">
          <div class="scenario-card">
            <div class="sc-header text-cyan">
              <Activity :size="20" />
              <h4>Smoke Test (Teste de Fumaça)</h4>
            </div>
            <p class="sc-desc">Validação rápida e leve (1 a 2 VUs, 15 a 30s) para garantir que a aplicação está acessível e respondendo com status HTTP 2xx/3xx antes de disparar testes pesados.</p>
            <div class="sc-tags">
              <span class="tag">Pré-deploy</span>
              <span class="tag">Sanity Check</span>
              <span class="tag">Carga Mínima</span>
            </div>
          </div>

          <div class="scenario-card">
            <div class="sc-header text-blue">
              <TrendingUp :size="20" />
              <h4>Load Test (Teste de Carga)</h4>
            </div>
            <p class="sc-desc">Simulação de concorrência normal e esperada de usuários no dia a dia. Mede os tempos de resposta típicos, estabilidade de throughput e latência média.</p>
            <div class="sc-tags">
              <span class="tag">Capacidade Nominal</span>
              <span class="tag">SLA</span>
              <span class="tag">Baseline</span>
            </div>
          </div>

          <div class="scenario-card">
            <div class="sc-header text-amber">
              <Flame :size="20" />
              <h4>Stress Test (Teste de Estresse)</h4>
            </div>
            <p class="sc-desc">Aumento contínuo e progressivo de usuários simultâneos além da capacidade normal para identificar o ponto exato de saturação (breakpoint) e como o sistema degrada.</p>
            <div class="sc-tags">
              <span class="tag">Ponto de Ruptura</span>
              <span class="tag">Gargalo de CPU/RAM</span>
            </div>
          </div>

          <div class="scenario-card">
            <div class="sc-header text-purple">
              <Zap :size="20" />
              <h4>Spike Test (Pico Súbito)</h4>
            </div>
            <p class="sc-desc">Simula uma explosão súbita e imediata de acessos (ex: Black Friday, campanhas de marketing) para verificar se o auto-scaling responde e se o servidor se recupera.</p>
            <div class="sc-tags">
              <span class="tag">Elasticidade</span>
              <span class="tag">Recuperação Rápida</span>
            </div>
          </div>

          <div class="scenario-card">
            <div class="sc-header text-green">
              <Clock :size="20" />
              <h4>Endurance Test (Teste de Resistência)</h4>
            </div>
            <p class="sc-desc">Execução com carga constante durante um período prolongado. Fundamental para identificar memory leaks (vazamento de memória), saturação de pool de conexões e cache overflows.</p>
            <div class="sc-tags">
              <span class="tag">Memory Leak</span>
              <span class="tag">Pool de Conexões</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: Dicionário de Métricas -->
      <div v-if="activeTab === 'metrics'" class="tab-pane animate-fade-in">
        <h3 class="pane-title">Significado das Métricas de Performance</h3>
        <p class="pane-subtitle">
          Entenda os conceitos técnicos calculados a partir dos dados brutos do JMeter:
        </p>

        <div class="metrics-glossary">
          <div class="glossary-item">
            <div class="term-badge">VUs (Virtual Users)</div>
            <div class="term-content">
              <strong>Usuários Virtuais Similados (Thread Group)</strong>
              <p>Representa threads simultâneas em execução pelo JMeter. Cada VU simula um usuário real navegando, executando requisições HTTP, armazenando cookies de sessão e respeitando intervalos humanos (pacing).</p>
            </div>
          </div>

          <div class="glossary-item">
            <div class="term-badge">Ramp-up</div>
            <div class="term-content">
              <strong>Tempo de Subida Gradual</strong>
              <p>Intervalo em segundos para que todos os VUs sejam inicializados. Exemplo: 30 VUs com ramp-up de 10s significa que 3 novos usuários são injetados a cada segundo, evitando o efeito martelo imediato no servidor.</p>
            </div>
          </div>

          <div class="glossary-item">
            <div class="term-badge">Percentis (P50, P90, P95, P99)</div>
            <div class="term-content">
              <strong>Distribuição Real de Latência (Não apenas média)</strong>
              <p>Médias simples escondem picos extremos. O <strong>P95</strong> significa que 95% dos seus usuários experimentaram um tempo de resposta igual ou inferior àquele valor. O <strong>P99</strong> foca nos 1% de casos mais lentos da aplicação.</p>
            </div>
          </div>

          <div class="glossary-item">
            <div class="term-badge">Throughput (Vazão)</div>
            <div class="term-content">
              <strong>Requisições por Segundo (req/s)</strong>
              <p>Volume de requisições que o servidor conseguiu processar e responder com sucesso por segundo. Um throughput estagnado com aumento de VUs indica que o servidor atingiu o limite de concorrência.</p>
            </div>
          </div>

          <div class="glossary-item">
            <div class="term-badge">Índice APDEX</div>
            <div class="term-content">
              <strong>Application Performance Index (0.00 a 1.00)</strong>
              <p>Padrão internacional da indústria para medir a satisfação do usuário final:
                <br>&bull; <strong>Satisfeito (0.94 - 1.00):</strong> Resposta abaixo de T (500ms).
                <br>&bull; <strong>Tolerante (0.85 - 0.93):</strong> Resposta entre T e 4T (500ms a 2000ms).
                <br>&bull; <strong>Frustrado (&lt; 0.70):</strong> Resposta acima de 4T ou erro HTTP.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Arquitetura JMX & Extensibilidade -->
      <div v-if="activeTab === 'architecture'" class="tab-pane animate-fade-in">
        <h3 class="pane-title">Como o JMETRIX se comunica com o JMeter?</h3>
        <p class="pane-subtitle">
          Visão arquitetural do pipeline de execução não-bloqueante:
        </p>

        <div class="arch-steps">
          <div class="arch-step">
            <div class="step-circle">1</div>
            <div class="step-info">
              <strong>Geração do Test Plan XML (.jmx)</strong>
              <p>O JMETRIX constrói dinamicamente um arquivo JMX nativo com Thread Groups, HTTP Samplers para cada endpoint descoberto, Header Managers modernos, Cookie Manager e Pacing Timers uniformes.</p>
            </div>
          </div>

          <div class="arch-step">
            <div class="step-circle">2</div>
            <div class="step-info">
              <strong>Execução em Modo CLI Headless (Motor JMeter)</strong>
              <p>O processo é disparado via <code>jmeter -n -t plan.jmx -l results.jtl -e -o report/</code> sem interface gráfica pesada, economizando 100% de CPU para a geração de carga real.</p>
            </div>
          </div>

          <div class="arch-step">
            <div class="step-circle">3</div>
            <div class="step-info">
              <strong>Telemetria em Tempo Real via WebSocket</strong>
              <p>Enquanto o JMeter escreve as amostras no arquivo de log JTL, o backend faz streaming instantâneo das estatísticas (req/s, threads ativas, erros) diretamente para a interface Vue 3.</p>
            </div>
          </div>

          <div class="arch-step">
            <div class="step-circle">4</div>
            <div class="step-info">
              <strong>Parser de Percentis & Diagnóstico Automatizado</strong>
              <p>Ao finalizar, o motor analisa cada linha do log JTL, calcula os percentis reais e gera um diagnóstico com recomendações técnicas para os desenvolvedores e analistas de QA.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="primary" @click="$emit('close')">Entendi, Fechar Guia</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue';
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';
import JmxLogo from './JmxLogo.vue';
import {
  Activity,
  TrendingUp,
  Flame,
  Zap,
  Clock,
  BookOpen,
  Layers,
  Cpu
} from 'lucide-vue-next';

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close']);

const activeTab = ref('scenarios');

const tabs = [
  { id: 'scenarios', label: 'Modalidades de Teste', icon: Activity },
  { id: 'metrics', label: 'Dicionário de Métricas', icon: BookOpen },
  { id: 'architecture', label: 'Como Funciona o JMeter', icon: Cpu }
];
</script>

<style scoped>
.jmeter-guide-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.guide-brand-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
}

.engine-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--electric-blue);
  background: var(--blue-glow);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(0, 240, 255, 0.25);
  font-family: monospace;
}

.guide-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 8px;
}

.guide-tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 13.5px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.guide-tab-btn:hover {
  color: var(--text-main);
  background: var(--bg-surface);
}

.guide-tab-btn.active {
  color: var(--electric-blue);
  background: var(--blue-glow);
  border: 1px solid rgba(0, 240, 255, 0.25);
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 6px;
}

.pane-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}

.pane-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

/* Scenarios Grid */
.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.scenario-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sc-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sc-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.sc-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.45;
  margin: 0;
  flex: 1;
}

.sc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.tag {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--bg-card);
  color: var(--text-subtle);
  font-weight: 600;
}

/* Glossary */
.metrics-glossary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.glossary-item {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.term-badge {
  align-self: flex-start;
  font-size: 12px;
  font-weight: 800;
  color: var(--electric-blue);
  font-family: monospace;
}

.term-content strong {
  font-size: 13.5px;
  color: var(--text-main);
}

.term-content p {
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 4px 0 0 0;
  line-height: 1.45;
}

/* Architecture Steps */
.arch-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.arch-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 14px 18px;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--blue-glow);
  border: 1px solid rgba(0, 240, 255, 0.35);
  color: var(--electric-blue);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-info strong {
  font-size: 14px;
  color: var(--text-main);
}

.step-info p {
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 4px 0 0 0;
}

.step-info code {
  background: var(--bg-card);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #38bdf8;
}
</style>
