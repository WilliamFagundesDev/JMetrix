<template>
  <div class="toast-container">
    <transition-group name="toast-slide">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="[`toast-${toast.type}`]"
        @click="removeToast(toast.id)"
      >
        <div class="toast-icon">
          <CheckCircle2 v-if="toast.type === 'success'" :size="18" />
          <AlertCircle v-else-if="toast.type === 'danger'" :size="18" />
          <AlertTriangle v-else-if="toast.type === 'warning'" :size="18" />
          <Info v-else :size="18" />
        </div>
        <div class="toast-content">
          <strong class="toast-title">{{ toast.title }}</strong>
          <p v-if="toast.message" class="toast-message">{{ toast.message }}</p>
        </div>
        <button class="toast-close" aria-label="Fechar notificação">
          <X :size="14" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '../../composables/useToast.js';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next';

const { toasts, removeToast } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 360px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.toast-item:hover {
  transform: translateY(-2px);
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.toast-content {
  flex: 1;
}

.toast-title {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-main);
}

.toast-message {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-top: 2px;
  line-height: 1.4;
}

.toast-close {
  color: var(--text-subtle);
  background: none;
  border: none;
  padding: 2px;
}

/* Toast types */
.toast-success {
  border-left: 4px solid var(--success);
}
.toast-success .toast-icon {
  color: var(--success);
}

.toast-danger {
  border-left: 4px solid var(--danger);
}
.toast-danger .toast-icon {
  color: var(--danger);
}

.toast-warning {
  border-left: 4px solid var(--warning);
}
.toast-warning .toast-icon {
  color: var(--warning);
}

.toast-info {
  border-left: 4px solid var(--cyan-accent);
}
.toast-info .toast-icon {
  color: var(--cyan-accent);
}

/* Transitions */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.25s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

