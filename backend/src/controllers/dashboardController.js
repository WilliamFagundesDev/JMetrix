import db from '../database/db.js';

export class DashboardController {
  /**
   * Get consolidated overview metrics for dashboard
   */
  static async getOverview(req, res) {
    try {
      // 1. Overall counts
      const counts = db.prepare(`
        SELECT 
          COUNT(*) as total_tests,
          COALESCE(SUM(total_requests), 0) as total_requests,
          COALESCE(SUM(success_requests), 0) as total_success,
          COALESCE(SUM(error_requests), 0) as total_errors,
          COALESCE(AVG(CASE WHEN status = 'completed' AND avg_time > 0 THEN avg_time END), 0) as overall_avg_time,
          COALESCE(AVG(CASE WHEN status = 'completed' THEN error_rate END), 0) as overall_error_rate
        FROM tests
      `).get();

      const sitesCount = db.prepare('SELECT COUNT(*) as count FROM sites').get()?.count || 0;

      // 2. Active running tests
      const runningTests = db.prepare(`
        SELECT id, name, target_url, test_type, vus, started_at, status 
        FROM tests 
        WHERE status IN ('running', 'preparing')
        ORDER BY created_at DESC
      `).all();

      // 3. Recent tests
      const recentTests = db.prepare(`
        SELECT id, name, target_url, test_type, status, vus, duration, total_requests, avg_time, p95, throughput, error_rate, apdex_score, created_at, started_at
        FROM tests
        ORDER BY created_at DESC
        LIMIT 8
      `).all();

      // 4. Best performing sites (completed tests, lowest latency)
      const topSites = db.prepare(`
        SELECT s.id, s.name, s.url, AVG(t.avg_time) as avg_latency, AVG(t.error_rate) as avg_error, COUNT(t.id) as tests_count
        FROM sites s
        JOIN tests t ON t.site_id = s.id
        WHERE t.status = 'completed'
        GROUP BY s.id
        HAVING tests_count >= 1
        ORDER BY avg_error ASC, avg_latency ASC
        LIMIT 5
      `).all();

      // 5. Problematic sites (highest error rate or highest latency)
      const problematicSites = db.prepare(`
        SELECT s.id, s.name, s.url, AVG(t.avg_time) as avg_latency, AVG(t.error_rate) as avg_error, COUNT(t.id) as tests_count
        FROM sites s
        JOIN tests t ON t.site_id = s.id
        WHERE t.status = 'completed' AND (t.error_rate > 3 OR t.avg_time > 800)
        GROUP BY s.id
        ORDER BY avg_error DESC, avg_latency DESC
        LIMIT 5
      `).all();

      // 6. Test timeline data for ECharts (last 15 completed tests)
      const chartHistory = db.prepare(`
        SELECT id, name, target_url, test_type, avg_time, p95, throughput, error_rate, total_requests, created_at
        FROM tests
        WHERE status = 'completed'
        ORDER BY created_at ASC
        LIMIT 15
      `).all();

      return res.json({
        totalTests: counts.total_tests || 0,
        totalSites: sitesCount,
        totalRequests: counts.total_requests || 0,
        totalSuccess: counts.total_success || 0,
        totalErrors: counts.total_errors || 0,
        overallAvgTime: Math.round(counts.overall_avg_time || 0),
        overallErrorRate: Number((counts.overall_error_rate || 0).toFixed(2)),
        runningCount: runningTests.length,
        runningTests,
        recentTests,
        topSites: topSites.map(s => ({ ...s, avg_latency: Math.round(s.avg_latency), avg_error: Number(s.avg_error.toFixed(1)) })),
        problematicSites: problematicSites.map(s => ({ ...s, avg_latency: Math.round(s.avg_latency), avg_error: Number(s.avg_error.toFixed(1)) })),
        chartHistory
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
