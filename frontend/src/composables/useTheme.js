import { ref, watch } from 'vue';

// Light theme is the primary/default theme
const savedTheme = localStorage.getItem('jmetrix_theme') || 'light';
const theme = ref(savedTheme);

function applyTheme(newTheme) {
  document.documentElement.setAttribute('data-theme', newTheme);
  document.body.className = `${newTheme}-theme`;
  localStorage.setItem('jmetrix_theme', newTheme);
}

// Initial application
applyTheme(theme.value);

watch(theme, (newTheme) => {
  applyTheme(newTheme);
});

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }

  function setTheme(newTheme) {
    if (newTheme === 'light' || newTheme === 'dark') {
      theme.value = newTheme;
    }
  }

  return {
    theme,
    isDark: () => theme.value === 'dark',
    toggleTheme,
    setTheme
  };
}

