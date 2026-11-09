<template>
  <BaseChart :options="chartOptions" :height="height" :loading="loading" />
</template>

<script setup>
import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import { useTheme } from '../../composables/useTheme.js';

const props = defineProps({
  endpoints: { type: Array, default: () => [] },
  height: { type: String, default: '340px' },
  loading: { type: Boolean, default: false }
});

const { theme } = useTheme();

const chartOptions = computed(() => {
  const isDark = theme.value === 'dark';
  const labelColor = isDark ? '#cbd5e1' : '#334155';
  const splitColor = isDark ? '#1e293b' : '#e2e8f0';

  const names = props.endpoints.map(ep => ep.endpoint.length > 25 ? ep.endpoint.substring(0, 25) + '...' : ep.endpoint);
  const avgTimes = props.endpoints.map(ep => ep.avgTime);
  const p95Times = props.endpoints.map(ep => ep.p95);

  return {
    legend: {
      data: ['Tempo Médio (ms)', 'P95 (ms)'],
      textStyle: { color: labelColor, fontWeight: 600 },
      top: 0
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      top: 40,
      right: 25,
      bottom: 25,
      left: 120,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: 'ms',
      nameTextStyle: { color: labelColor, fontWeight: 600 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: splitColor, type: 'dashed' } },
      axisLabel: { color: labelColor }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: splitColor } },
      axisLabel: { color: labelColor, fontSize: 11 }
    },
    series: [
      {
        name: 'Tempo Médio (ms)',
        type: 'bar',
        data: avgTimes,
        itemStyle: { color: '#0284c7', borderRadius: [0, 4, 4, 0] }
      },
      {
        name: 'P95 (ms)',
        type: 'bar',
        data: p95Times,
        itemStyle: { color: '#f59e0b', borderRadius: [0, 4, 4, 0] }
      }
    ]
  };
});
</script>
