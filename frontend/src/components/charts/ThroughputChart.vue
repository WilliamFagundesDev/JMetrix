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
  const reqCount = props.timeseries.map(t => t.requestsCount);
  const threads = props.timeseries.map(t => t.activeThreads);

  return {
    legend: {
      data: ['Throughput (req/s)', 'VUs Ativos'],
      textStyle: { color: labelColor, fontWeight: 600 },
      top: 0
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
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
        fillerColor: isDark ? 'rgba(0, 102, 255, 0.2)' : 'rgba(37, 99, 235, 0.2)',
        handleStyle: { color: '#2563eb' },
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
    yAxis: [
      {
        type: 'value',
        name: 'req/s',
        nameTextStyle: { color: labelColor, fontWeight: 600 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: splitColor, type: 'dashed' } },
        axisLabel: { color: labelColor, fontSize: 11 }
      },
      {
        type: 'value',
        name: 'VUs',
        nameTextStyle: { color: labelColor, fontWeight: 600 },
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: labelColor, fontSize: 11 }
      }
    ],
    series: [
      {
        name: 'Throughput (req/s)',
        type: 'line',
        smooth: true,
        data: reqCount,
        showSymbol: false,
        lineStyle: { width: 3, color: '#2563eb' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.3)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.0)' }
            ]
          }
        }
      },
      {
        name: 'VUs Ativos',
        type: 'line',
        yAxisIndex: 1,
        step: 'middle',
        data: threads,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#059669' }
      }
    ]
  };
});
</script>
