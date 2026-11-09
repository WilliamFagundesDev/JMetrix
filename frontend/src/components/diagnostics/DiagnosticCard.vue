<template>
  <div class="diagnostic-panel j-card">
    <div class="diagnostic-header">
      <div class="header-left">
        <div class="score-badge" :class="scoreClass">
          <span class="score-val font-mono">{{ diagnostics.overallScore !== undefined ? diagnostics.overallScore : 100 }}</span>
          <span class="score-label">{{ t('diagnostics.scoreLabel') }}</span>
        </div>
        <div class="header-titles">
          <h3 class="panel-title">{{ t('diagnostics.title') }}</h3>
          <p class="panel-subtitle">{{ t('diagnostics.subtitle') }}</p>
        </div>
      </div>
      <div class="header-status">
        <span class="status-pill-text" :class="scoreClass">{{ statusText }}</span>
      </div>
    </div>

    <div class="diagnostic-columns">
      <!-- Coluna 1: Positivos & Alertas -->
      <div class="column">
        <div class="section-group">
          <div class="group-title text-green">
            <CheckCircle :size="17" />
            <span>{{ t('diagnostics.positives') }} ({{ (diagnostics.positives || []).length }})</span>
          </div>
          <div v-if="!diagnostics.positives?.length" class="empty-text">
            Nenhum ponto positivo registrado neste teste.
          </div>
          <div
            v-for="(pos, idx) in diagnostics.positives"
            :key="idx"
            class="diag-item item-positive"
          >
            <strong class="item-title">{{ pos.title }}</strong>
            <p class="item-desc">{{ pos.description }}</p>
          </div>
        </div>

        <div class="section-group">
          <div class="group-title text-amber">
            <AlertTriangle :size="17" />
            <span>{{ t('diagnostics.warnings') }} ({{ (diagnostics.warnings || []).length }})</span>
          </div>
          <div v-if="!diagnostics.warnings?.length" class="empty-text">
            Nenhum alerta de desempenho observado.
          </div>
          <div
            v-for="(w, idx) in diagnostics.warnings"
            :key="idx"
            class="diag-item item-warning"
          >
            <strong class="item-title">{{ w.title }}</strong>
            <p class="item-desc">{{ w.description }}</p>
          </div>
        </div>
      </div>

      <!-- Coluna 2: Problemas & Recomendações -->
      <div class="column">
        <div class="section-group">
          <div class="group-title text-red">
            <XCircle :size="17" />
            <span>{{ t('diagnostics.problems') }} ({{ (diagnostics.problems || []).length }})</span>
          </div>
          <div v-if="!diagnostics.problems?.length" class="empty-text">
            Nenhum problema crítico detectado.
          </div>
          <div
            v-for="(pr, idx) in diagnostics.problems"
            :key="idx"
            class="diag-item item-problem"
          >
            <strong class="item-title">{{ pr.title }}</strong>
            <p class="item-desc">{{ pr.description }}</p>
          </div>
        </div>

        <div class="section-group">
          <div class="group-title text-cyan">
            <Lightbulb :size="17" />
            <span>{{ t('diagnostics.recommendations') }}</span>
          </div>
          <div v-if="!diagnostics.recommendations?.length" class="empty-text">
            Sem recomendações imediatas.
          </div>
          <div
            v-for="(rec, idx) in diagnostics.recommendations"
            :key="idx"
            class="diag-item item-recommendation"
          >
            <strong class="item-title">{{ rec.title }}</strong>
            <p class="item-desc">{{ rec.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '../../composables/useI18n.js';
import { CheckCircle, AlertTriangle, XCircle, Lightbulb } from 'lucide-vue-next';

const { t } = useI18n();

const props = defineProps({
  diagnostics: {
    type: Object,
    default: () => ({
      overallStatus: 'excelente',
      overallScore: 100,
      positives: [],
      warnings: [],
      problems: [],
      recommendations: []
    })
  }
});

const scoreClass = computed(() => {
  const s = props.diagnostics.overallScore !== undefined ? props.diagnostics.overallScore : 100;
  if (s >= 85) return 'score-green';
  if (s >= 70) return 'score-blue';
  if (s >= 45) return 'score-amber';
  return 'score-red';
});

const statusText = computed(() => {
  const s = props.diagnostics.overallScore !== undefined ? props.diagnostics.overallScore : 100;
  if (s >= 85) return t('diagnostics.statusExcellent');
  if (s >= 70) return t('diagnostics.statusGood');
  if (s >= 45) return t('diagnostics.statusWarning');
  return t('diagnostics.statusCritical');
});
</script>

<style scoped>
.diagnostic-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.diagnostic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 20px;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

/* Redesigned spacious score badge */
.score-badge {
  min-width: 95px;
  padding: 10px 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast);
}

.score-badge:hover {
  transform: scale(1.03);
}

.score-val {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.score-label {
  font-size: 10px;
  text-transform: uppercase;
  margin-top: 4px;
  font-weight: 800;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.score-green {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid rgba(5, 150, 105, 0.35);
}
.score-blue {
  background: var(--info-bg);
  color: var(--cyan-accent);
  border: 1px solid rgba(2, 132, 199, 0.35);
}
.score-amber {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid rgba(217, 119, 6, 0.35);
}
.score-red {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid rgba(220, 38, 38, 0.35);
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.panel-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text-main);
}

.panel-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.status-pill-text {
  font-size: 12px;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.diagnostic-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

.section-group {
  margin-bottom: 22px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}

.diag-item {
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  border-left: 4px solid transparent;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.diag-item:hover {
  transform: translateX(3px);
  box-shadow: var(--shadow-md);
}

.item-positive {
  background: var(--success-bg);
  border-left-color: var(--success);
  border-top: 1px solid rgba(5, 150, 105, 0.2);
  border-right: 1px solid rgba(5, 150, 105, 0.2);
  border-bottom: 1px solid rgba(5, 150, 105, 0.2);
}

.item-warning {
  background: var(--warning-bg);
  border-left-color: var(--warning);
  border-top: 1px solid rgba(217, 119, 6, 0.2);
  border-right: 1px solid rgba(217, 119, 6, 0.2);
  border-bottom: 1px solid rgba(217, 119, 6, 0.2);
}

.item-problem {
  background: var(--danger-bg);
  border-left-color: var(--danger);
  border-top: 1px solid rgba(220, 38, 38, 0.2);
  border-right: 1px solid rgba(220, 38, 38, 0.2);
  border-bottom: 1px solid rgba(220, 38, 38, 0.2);
}

.item-recommendation {
  background: var(--info-bg);
  border-left-color: var(--cyan-accent);
  border-top: 1px solid rgba(2, 132, 199, 0.2);
  border-right: 1px solid rgba(2, 132, 199, 0.2);
  border-bottom: 1px solid rgba(2, 132, 199, 0.2);
}

.item-title {
  display: block;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 4px;
}

.item-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.empty-text {
  font-size: 13px;
  color: var(--text-subtle);
  font-style: italic;
  padding: 8px 0;
}

@media (max-width: 900px) {
  .diagnostic-columns {
    grid-template-columns: 1fr;
  }
}
</style>
