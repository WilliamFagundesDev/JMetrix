import { reactive, ref, computed } from 'vue';
import { useApi } from './useApi.js';
import { useWebSocket } from './useWebSocket.js';

// Singleton state across all components and router views
const state = reactive({
  overview: {
    totalTests: 0,
    totalSites: 0,
    totalRequests: 0,
    overallAvgTime: 0,
    overallErrorRate: 0,
    runningTests: [],
    recentTests: [],
    topSites: [],
    problematicSites: [],
    chartHistory: []
  },
  tests: [],
  sites: [],
  environment: null,
  runningTest: null,
  liveTelemetry: {},
  isLoadingOverview: false,
  isLoadingTests: false,
  isLoadingSites: false,
  isWsSubscribed: false,
  // Global modal triggers
  isGuideOpen: false,
  inspectingJmxTest: null
});

export function useJMetrixStore() {
  const api = useApi();
  const { subscribe } = useWebSocket();

  // Initialize WebSocket subscriptions once
  if (!state.isWsSubscribed) {
    state.isWsSubscribed = true;

    subscribe('test:status', (data) => {
      if (data.status === 'running' || data.status === 'preparing') {
        state.runningTest = {
          id: data.testId,
          status: data.status,
          message: data.message
        };
      }
      refreshOverview();
      refreshTests();
    });

    subscribe('test:telemetry', (data) => {
      state.liveTelemetry = data;
      if (!state.runningTest && data.testId) {
        state.runningTest = { id: data.testId, status: 'running' };
      }
    });

    subscribe('test:completed', () => {
      state.runningTest = null;
      state.liveTelemetry = {};
      refreshOverview();
      refreshTests();
      refreshSites();
    });

    subscribe('test:failed', () => {
      state.runningTest = null;
      state.liveTelemetry = {};
      refreshOverview();
      refreshTests();
    });

    subscribe('test:cancelled', () => {
      state.runningTest = null;
      state.liveTelemetry = {};
      refreshOverview();
      refreshTests();
    });
  }

  async function refreshOverview() {
    try {
      state.isLoadingOverview = true;
      const data = await api.get('/dashboard/overview');
      state.overview = data;
      if (data.runningTests && data.runningTests.length > 0) {
        state.runningTest = data.runningTests[0];
      } else if (state.runningTest && !state.runningTest.isLocalOnly) {
        state.runningTest = null;
      }
    } catch (err) {
      console.error('[Store] Erro ao carregar overview:', err);
    } finally {
      state.isLoadingOverview = false;
    }
  }

  async function refreshTests(params = {}) {
    try {
      state.isLoadingTests = true;
      const query = new URLSearchParams(params).toString();
      const endpoint = query ? `/tests?${query}` : '/tests';
      const data = await api.get(endpoint);
      state.tests = data.items || data.tests || [];
    } catch (err) {
      console.error('[Store] Erro ao carregar testes:', err);
    } finally {
      state.isLoadingTests = false;
    }
  }

  async function refreshSites() {
    try {
      state.isLoadingSites = true;
      const data = await api.get('/sites');
      state.sites = Array.isArray(data) ? data : (data?.sites || []);
    } catch (err) {
      console.error('[Store] Erro ao carregar sites:', err);
    } finally {
      state.isLoadingSites = false;
    }
  }

  async function refreshEnvironment() {
    try {
      const data = await api.get('/settings/environment');
      state.environment = data;
      return data;
    } catch (err) {
      console.error('[Store] Erro ao carregar ambiente:', err);
      return null;
    }
  }

  async function cancelRunningTest(testId) {
    const id = testId || state.runningTest?.id;
    if (!id) return;
    try {
      await api.post(`/tests/${id}/cancel`);
      state.runningTest = null;
      state.liveTelemetry = {};
      refreshOverview();
      refreshTests();
    } catch (err) {
      console.error('[Store] Erro ao cancelar teste:', err);
      throw err;
    }
  }

  function openJmeterGuide() {
    state.isGuideOpen = true;
  }

  function closeJmeterGuide() {
    state.isGuideOpen = false;
  }

  function inspectJmxPlan(test) {
    state.inspectingJmxTest = test;
  }

  function closeJmxInspector() {
    state.inspectingJmxTest = null;
  }

  const hasRunningTest = computed(() => !!state.runningTest);

  return {
    state,
    hasRunningTest,
    refreshOverview,
    refreshTests,
    refreshSites,
    refreshEnvironment,
    cancelRunningTest,
    openJmeterGuide,
    closeJmeterGuide,
    inspectJmxPlan,
    closeJmxInspector
  };
}
