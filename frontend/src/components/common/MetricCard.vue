<template>
  <div class="metric-card j-card" :class="[`theme-${variant}`]">
    <div class="card-top">
      <span class="metric-label">{{ label }}</span>
      <div class="icon-container" v-if="icon">
        <component :is="icon" :size="18" />
      </div>
    </div>

    <div class="card-main">
      <span class="metric-value font-mono">{{ displayValue }}</span>
      <span v-if="unit" class="metric-unit">{{ unit }}</span>
    </div>

    <div class="card-bottom" v-if="subtext || delta">
      <span v-if="delta" class="metric-delta" :class="delta.status">
        {{ delta.sign }}{{ delta.percent }}%
      </span>
      <span class="metric-subtext">{{ subtext }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  unit: { type: String, default: '' },
  subtext: { type: String, default: '' },
  variant: { type: String, default: 'blue' }, // blue, cyan, green, amber, red
  icon: { type: Object, default: null },
  delta: { type: Object, default: null }
});

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString('pt-BR');
  }
  return props.value ?? '-';
});
</script>

<style scoped>
.metric-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  overflow: hidden;
  transition: all var(--transition-normal);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-label {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-muted);
  font-weight: 700;
}

.icon-container {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
}

.metric-card:hover .icon-container {
  transform: scale(1.08);
}

.card-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.metric-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.5px;
  line-height: 1;
}

.metric-unit {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-subtle);
}

.card-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.metric-subtext {
  color: var(--text-subtle);
}

.metric-delta.better {
  color: var(--success);
  font-weight: 700;
}
.metric-delta.worse {
  color: var(--danger);
  font-weight: 700;
}

/* Variant themes */
.theme-blue .icon-container {
  background: var(--blue-glow);
  color: var(--electric-blue);
  border: 1px solid rgba(37, 99, 235, 0.2);
}

.theme-cyan .icon-container {
  background: var(--cyan-glow);
  color: var(--cyan-accent);
  border: 1px solid rgba(2, 132, 199, 0.2);
}
.theme-cyan .metric-value {
  color: var(--cyan-accent);
}

.theme-green .icon-container {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid rgba(5, 150, 105, 0.2);
}
.theme-green .metric-value {
  color: var(--success);
}

.theme-amber .icon-container {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid rgba(217, 119, 6, 0.2);
}
.theme-amber .metric-value {
  color: var(--warning);
}

.theme-red .icon-container {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid rgba(220, 38, 38, 0.2);
}
.theme-red .metric-value {
  color: var(--danger);
}
</style>
