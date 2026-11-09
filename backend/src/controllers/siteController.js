import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { SSRFValidator } from '../services/discovery/ssrfValidator.js';

export class SiteController {
  /**
   * List all monitored sites with aggregated performance metrics
   */
  static async listSites(req, res) {
    try {
      const sites = db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();

      const sitesWithStats = sites.map(site => {
        const stats = db.prepare(`
          SELECT 
            COUNT(*) as test_count,
            AVG(avg_time) as avg_latency,
            AVG(error_rate) as avg_error_rate,
            AVG(throughput) as avg_throughput,
            MAX(created_at) as last_tested_at
          FROM tests
          WHERE site_id = ? AND status = 'completed'
        `).get(site.id);

        return {
          ...site,
          testCount: stats.test_count || 0,
          avgLatency: stats.avg_latency ? Math.round(stats.avg_latency) : null,
          avgErrorRate: stats.avg_error_rate ? Number(stats.avg_error_rate.toFixed(2)) : null,
          avgThroughput: stats.avg_throughput ? Number(stats.avg_throughput.toFixed(2)) : null,
          lastTestedAt: stats.last_tested_at || null
        };
      });

      return res.json(sitesWithStats);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Register a new monitored site
   */
  static async createSite(req, res) {
    try {
      const { name, url, description = '', tags = '' } = req.body;
      if (!name || !url) {
        return res.status(400).json({ error: 'Nome e URL são obrigatórios.' });
      }

      const validated = await SSRFValidator.validateUrl(url);
      const existing = db.prepare('SELECT * FROM sites WHERE url = ?').get(validated.origin);
      if (existing) {
        return res.status(409).json({ error: 'Esta aplicação/origem já está cadastrada.' });
      }

      const id = uuidv4();
      db.prepare(`
        INSERT INTO sites (id, name, url, description, tags)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, name.trim(), validated.origin, description.trim(), tags.trim());

      const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(id);
      return res.status(201).json(site);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * Get single site with full test history and trends
   */
  static async getSiteById(req, res) {
    try {
      const { id } = req.params;
      const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(id);
      if (!site) {
        return res.status(404).json({ error: 'Aplicação monitorada não encontrada.' });
      }

      const tests = db.prepare(`
        SELECT id, name, test_type, status, vus, duration, total_requests, avg_time, p95, throughput, error_rate, apdex_score, created_at, completed_at
        FROM tests
        WHERE site_id = ?
        ORDER BY created_at DESC
      `).all(id);

      return res.json({
        ...site,
        tests
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Delete monitored site
   */
  static async deleteSite(req, res) {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM sites WHERE id = ?').run(id);
      return res.json({ success: true, message: 'Aplicação removida com sucesso.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
