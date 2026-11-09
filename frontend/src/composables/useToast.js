import { ref } from 'vue';

const toasts = ref([]);
let toastId = 0;

export function useToast() {
  function addToast(type, title, message = '', duration = 4000) {
    const id = ++toastId;
    const toast = { id, type, title, message };
    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }

  function removeToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return {
    toasts,
    success: (title, msg) => addToast('success', title, msg),
    error: (title, msg) => addToast('danger', title, msg, 6000),
    warning: (title, msg) => addToast('warning', title, msg),
    info: (title, msg) => addToast('info', title, msg),
    removeToast
  };
}

