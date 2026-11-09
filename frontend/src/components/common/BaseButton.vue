<template>
  <button
    class="j-btn"
    :class="[`btn-${variant}`, `btn-${size}`, { 'is-loading': loading, 'is-disabled': disabled }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <span v-if="$slots.icon && !loading" class="btn-icon">
      <slot name="icon" />
    </span>
    <span class="btn-text">
      <slot />
    </span>
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary, secondary, danger, ghost, outline
  size: { type: String, default: 'md' }, // sm, md, lg
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
});

defineEmits(['click']);
</script>

<style scoped>
.j-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  border-radius: 8px;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

/* Sizes */
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}
.btn-md {
  padding: 9px 16px;
  font-size: 13.5px;
}
.btn-lg {
  padding: 12px 22px;
  font-size: 15px;
}

/* Variants */
.btn-primary {
  background: linear-gradient(135deg, var(--electric-blue), #0044cc);
  color: #ffffff;
  border: 1px solid rgba(0, 102, 255, 0.4);
  box-shadow: 0 2px 10px rgba(0, 102, 255, 0.3);
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 102, 255, 0.5);
  background: linear-gradient(135deg, var(--electric-blue-hover), #0055ff);
}

.btn-secondary {
  background: var(--bg-surface);
  color: var(--text-main);
  border: 1px solid var(--border-subtle);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: rgba(255, 255, 255, 0.15);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
}

.btn-outline {
  background: transparent;
  color: var(--cyan-accent);
  border: 1px solid rgba(0, 210, 255, 0.35);
}
.btn-outline:hover:not(:disabled) {
  background: rgba(0, 210, 255, 0.1);
  border-color: var(--cyan-accent);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
}
.btn-ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.j-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spinSlow 0.8s linear infinite;
}

.btn-icon {
  display: flex;
  align-items: center;
}
</style>

