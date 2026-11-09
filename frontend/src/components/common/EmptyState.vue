<template>
  <div class="empty-state">
    <div class="empty-icon-box">
      <component :is="icon" :size="32" />
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-description">{{ description }}</p>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
import { Inbox } from 'lucide-vue-next';

defineProps({
  title: { type: String, default: 'Nenhum item encontrado' },
  description: { type: String, default: 'Não existem registros cadastrados para esta visualização.' },
  icon: { type: Object, default: () => Inbox }
});
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  background: var(--bg-surface);
  border: 1px dashed var(--border-subtle);
  border-radius: 12px;
}

.empty-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.2);
  color: var(--electric-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 6px;
}

.empty-description {
  font-size: 13.5px;
  color: var(--text-muted);
  max-width: 440px;
  margin-bottom: 20px;
}

.empty-action {
  display: flex;
  gap: 12px;
}
</style>

