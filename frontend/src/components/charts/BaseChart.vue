<template>
  <div class="base-chart-container" ref="chartContainer" :style="{ height }">
    <div v-if="loading" class="chart-loading-overlay">
      <div class="chart-spinner"></div>
      <span>Carregando dados...</span>
    </div>
    <div v-show="!loading" ref="chartDom" class="chart-canvas"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { useTheme } from '../../composables/useTheme.js';

const props = defineProps({
  options: { type: Object, required: true },
  height: { type: String, default: '320px' },
  loading: { type: Boolean, default: false }
});

const { theme } = useTheme();

const chartDom = ref(null);
const chartContainer = ref(null);
let chartInstance = null;
let resizeObserver = null;

function initChart() {
  if (!chartDom.value) return;

  if (chartInstance) {
    chartInstance.dispose();
  }

  // Use appropriate theme for echarts or clean custom canvas
  chartInstance = echarts.init(chartDom.value, theme.value === 'dark' ? 'dark' : null, {
    renderer: 'canvas'
  });

  applyOptions();

  // Resize listener
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      chartInstance && chartInstance.resize();
    });
    resizeObserver.observe(chartContainer.value);
  } else {
    window.addEventListener('resize', handleResize);
  }
}

function handleResize() {
  chartInstance && chartInstance.resize();
}

function applyOptions() {
  if (!chartInstance || !props.options) return;

  const isDark = theme.value === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const headingColor = isDark ? '#ffffff' : '#0f172a';
  const tooltipBg = isDark ? '#111827' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  const defaultTheme = {
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: 'Inter, sans-serif',
      color: textColor
    },
    title: {
      textStyle: { color: headingColor, fontSize: 14, fontWeight: 700 }
    },
    tooltip: {
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      textStyle: { color: tooltipText, fontSize: 12 },
      extraCssText: 'box-shadow: 0 10px 25px rgba(0,0,0,0.15); border-radius: 8px;'
    },
    grid: {
      top: 35,
      right: 25,
      bottom: 60,
      left: 65,
      containLabel: false
    }
  };

  const merged = {
    ...defaultTheme,
    ...props.options,
    tooltip: { ...defaultTheme.tooltip, ...(props.options.tooltip || {}) },
    grid: { ...defaultTheme.grid, ...(props.options.grid || {}) }
  };

  chartInstance.setOption(merged, true);
}

// Watch theme changes to re-init chart with proper theme
watch(theme, () => {
  nextTick(() => {
    initChart();
  });
});

watch(() => props.options, () => {
  nextTick(() => applyOptions());
}, { deep: true });

onMounted(() => {
  nextTick(() => initChart());
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
  window.removeEventListener('resize', handleResize);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style scoped>
.base-chart-container {
  width: 100%;
  position: relative;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.chart-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--bg-surface);
  color: var(--text-muted);
  font-size: 13px;
  border-radius: 12px;
}

.chart-spinner {
  width: 26px;
  height: 26px;
  border: 3px solid rgba(37, 99, 235, 0.2);
  border-top-color: var(--electric-blue);
  border-radius: 50%;
  animation: spinSlow 0.8s linear infinite;
}
</style>
