<template>
  <BaseChart :options="chartOptions" :height="height" :loading="loading" />
</template>

<script setup>
import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import { useTheme } from '../../composables/useTheme.js';

const props = defineProps({
  timeseries: { type: Array, default: () => [] },
  height: { type: String, default: '340px' },
  loading: { type: Boolean, default: false }
});

const { theme } = useTheme();

const chartOptions = computed(() => {
  const isDark = theme.value === 'dark';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const splitColor = isDark ? '#1e293b' : '#e2e8f0';

  const seconds = props.timeseries.map(t => `${t.second}s`);
  const errorRates = props.timeseries.map(t => t.errorRate);
  const errorCounts = props.timeseries.map(t => t.errors);

  return {
    legend: {
      data: ['Taxa de Erro (%)', 'Falhas (Reqs)'],
      textStyle: { color: labelColor, fontWeight: 600 },
      top: 0
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      top: 40,
      right: 40,
      bottom: 65,
      left: 65
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      {
        type: 'slider',
        bottom: 8,
        height: 20,
        borderColor: splitColor,
        backgroundColor: isDark ? '#131b2e' : '#f1f5f9',
        fillerColor: 'rgba(239, 68, 68, 0.2)',
        handleStyle: { color: '#ef4444' },
        textStyle: { color: labelColor, fontSize: 11 }
      }
    ],
    xAxis: {
      type: 'category',
      data: seconds,
      axisLine: { lineStyle: { color: splitColor } },
      axisLabel: { color: labelColor, fontSize: 11, margin: 12 }
    },
    yAxis: [
      {
        type: 'value',
        name: '%',
        nameTextStyle: { color: labelColor, fontWeight: 600 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: splitColor, type: 'dashed' } },
        axisLabel: { color: labelColor, fontSize: 11 }
      },
      {
        type: 'value',
        name: 'Falhas',
        nameTextStyle: { color: labelColor, fontWeight: 600 },
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: labelColor, fontSize: 11 }
      }
    ],
    series: [
      {
        name: 'Taxa de Erro (%)',
        type: 'line',
        data: errorRates,
        lineStyle: { color: '#dc2626', width: 2.5 },
        itemStyle: { color: '#dc2626' }
      },
      {
        name: 'Falhas (Reqs)',
        type: 'bar',
        yAxisIndex: 1,
        data: errorCounts,
        itemStyle: { color: 'rgba(220, 38, 38, 0.35)', borderRadius: [4, 4, 0, 0] }
      }
    ]
  };
});
</script>
