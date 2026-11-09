import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import NewAnalysisView from '../views/NewAnalysisView.vue';
import TestHistoryView from '../views/TestHistoryView.vue';
import TestResultsView from '../views/TestResultsView.vue';
import CompareTestsView from '../views/CompareTestsView.vue';
import MonitoredSitesView from '../views/MonitoredSitesView.vue';
import SiteDetailView from '../views/SiteDetailView.vue';
import ReportsView from '../views/ReportsView.vue';
import SettingsView from '../views/SettingsView.vue';

const routes = [
  { path: '/', name: 'Dashboard', component: DashboardView },
  { path: '/new', name: 'NewAnalysis', component: NewAnalysisView },
  { path: '/history', name: 'TestHistory', component: TestHistoryView },
  { path: '/test/:id', name: 'TestResults', component: TestResultsView },
  { path: '/compare', name: 'CompareTests', component: CompareTestsView },
  { path: '/sites', name: 'MonitoredSites', component: MonitoredSitesView },
  { path: '/sites/:id', name: 'SiteDetail', component: SiteDetailView },
  { path: '/reports', name: 'Reports', component: ReportsView },
  { path: '/settings', name: 'Settings', component: SettingsView }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;

