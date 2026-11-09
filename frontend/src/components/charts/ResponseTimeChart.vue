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
  const avgData = props.timeseries.map(t => t.avgResponseTime);
  const p95Data = props.timeseries.map(t => t.p95ResponseTime);

  return {
    legend: {
      data: ['Tempo Médio (ms)', 'Percentil 95 (P95 ms)'],
      textStyle: { color: labelColor, fontWeight: 600 },
      top: 0
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    grid: {
      top: 40,
      right: 25,
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
        fillerColor: isDark ? 'rgba(0, 210, 255, 0.2)' : 'rgba(37, 99, 235, 0.2)',
        handleStyle: { color: '#0284c7' },
        textStyle: { color: labelColor, fontSize: 11 }
      }
    ],
    xAxis: {
      type: 'category',
      data: seconds,
      boundaryGap: false,
      axisLine: { lineStyle: { color: splitColor } },
      axisLabel: { color: labelColor, fontSize: 11, margin: 12 }
    },
    yAxis: {
      type: 'value',
      name: 'ms',
      nameTextStyle: { color: labelColor, fontWeight: 600 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: splitColor, type: 'dashed' } },
      axisLabel: { color: labelColor, fontSize: 11 }
    },
    series: [
      {
        name: 'Tempo Médio (ms)',
        type: 'line',
        smooth: true,
        data: avgData,
        showSymbol: false,
        lineStyle: { width: 3, color: '#0284c7' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: isDark ? 'rgba(0, 210, 255, 0.3)' : 'rgba(2, 132, 199, 0.25)' },
              { offset: 1, color: 'rgba(2, 132, 199, 0.0)' }
            ]
          }
        }
      },
      {
        name: 'Percentil 95 (P95 ms)',
        type: 'line',
        smooth: true,
        data: p95Data,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#f59e0b', type: 'dashed' }
      }
    ]
  };
});
</script>
