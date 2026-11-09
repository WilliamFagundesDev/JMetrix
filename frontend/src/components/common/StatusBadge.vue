<template>
  <span class="status-badge" :class="[`status-${cleanStatus}`]">
    <span class="status-dot" :class="{ 'pulsing': isLive }"></span>
    <span class="status-text">{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '../../composables/useI18n.js';

const { t } = useI18n();

const props = defineProps({
  status: { type: String, default: 'pending' }
});

const cleanStatus = computed(() => (props.status || 'pending').toLowerCase());

const isLive = computed(() => ['running', 'preparing', 'finalizing'].includes(cleanStatus.value));

const label = computed(() => {
  return t(`common.status.${cleanStatus.value}`) || cleanStatus.value;
});
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-dot.pulsing {
  animation: pulseRing 1.5s infinite ease-in-out;
}

/* Status themes */
.status-completed {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid rgba(5, 150, 105, 0.25);
}
.status-completed .status-dot {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
}

.status-running {
  background: var(--cyan-glow);
  color: var(--cyan-accent);
  border: 1px solid rgba(2, 132, 199, 0.3);
}
.status-running .status-dot {
  background: var(--cyan-accent);
  box-shadow: 0 0 8px var(--cyan-accent);
}

.status-preparing {
  background: var(--blue-glow);
  color: var(--electric-blue);
  border: 1px solid rgba(37, 99, 235, 0.3);
}
.status-preparing .status-dot {
  background: var(--electric-blue);
}

.status-finalizing {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid rgba(217, 119, 6, 0.3);
}
.status-finalizing .status-dot {
  background: var(--warning);
}

.status-failed {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid rgba(220, 38, 38, 0.25);
}
.status-failed .status-dot {
  background: var(--danger);
}

.status-cancelled {
  background: rgba(100, 116, 139, 0.12);
  color: var(--text-subtle);
  border: 1px solid rgba(100, 116, 139, 0.25);
}
.status-cancelled .status-dot {
  background: var(--text-subtle);
}

.status-pending {
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-muted);
  border: 1px solid rgba(148, 163, 184, 0.25);
}
.status-pending .status-dot {
  background: var(--text-muted);
}
</style>
