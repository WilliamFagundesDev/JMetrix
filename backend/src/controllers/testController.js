import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import db from '../database/db.js';
import { SSRFValidator } from '../services/discovery/ssrfValidator.js';
import { JMeterExecutor } from '../services/jmeter/jmeterExecutor.js';

export class TestController {
  /**
   * Create a new test configuration
   */
  static async createTest(req, res) {
    try {
      const {
        name,
        targetUrl,
        testType = 'smoke', // smoke, load, stress, spike, endurance
        presetProfile = 'light', // light, moderate, advanced, custom
        vus = 10,
        duration = 60,
        rampUp = 10,
        endpoints = [],
        siteId = null,
        authorized = false,
        config = {}
      } = req.body;

      if (!authorized) {
        return res.status(400).json({
          error: 'Confirmação obrigatória: Você deve confirmar que possui autorização para testar a aplicação.'
        });
      }

      if (!targetUrl) {
        return res.status(400).json({ error: 'A URL de destino é obrigatória.' });
      }

      // SSRF validation on the target URL
      const validated = await SSRFValidator.validateUrl(targetUrl);

      // Check system resource limits
      let maxVus = 500;
      let maxDuration = 1800;
      try {
        const vusSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('max_vus');
        if (vusSetting) maxVus = parseInt(vusSetting.value, 10);
        const durSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('max_duration_seconds');
        if (durSetting) maxDuration = parseInt(durSetting.value, 10);
      } catch {}

      const cleanVus = Math.max(1, Math.min(parseInt(vus, 10) || 10, maxVus));
      const cleanDuration = Math.max(5, Math.min(parseInt(duration, 10) || 60, maxDuration));
      const cleanRampUp = Math.max(0, Math.min(parseInt(rampUp, 10) || 10, cleanDuration));

      const testId = uuidv4();
      const testName = name?.trim() || `${testType.toUpperCase()} - ${validated.hostname} (${new Date().toLocaleDateString('pt-BR')})`;

      // Auto link or create site if siteId not provided
      let finalSiteId = siteId;
      if (!finalSiteId) {
        const existingSite = db.prepare('SELECT id FROM sites WHERE url = ?').get(validated.origin);
        if (existingSite) {
          finalSiteId = existingSite.id;
        } else {
          finalSiteId = uuidv4();
          db.prepare(`
            INSERT INTO sites (id, name, url, description) 
            VALUES (?, ?, ?, ?)
          `).run(finalSiteId, validated.hostname, validated.origin, `Cadastrado automaticamente a partir do teste ${testName}`);
        }
      }

      db.prepare(`
        INSERT INTO tests (
          id, site_id, name, target_url, test_type, preset_profile,
          status, vus, duration, ramp_up, endpoints_json, config_json
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
      `).run(
        testId,
        finalSiteId,
        testName,
        validated.sanitizedUrl,
        testType,
        presetProfile,
        cleanVus,
        cleanDuration,
        cleanRampUp,
        JSON.stringify(endpoints),
        JSON.stringify(config)
      );

      const created = db.prepare('SELECT * FROM tests WHERE id = ?').get(testId);
      return res.status(201).json(created);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * Start execution of an existing test
   */
  static async startTest(req, res) {
    try {
      const { id } = req.params;
      const result = await JMeterExecutor.startTest(id);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * Cancel an active test
   */
  static async cancelTest(req, res) {
    try {
      const { id } = req.params;
      const result = await JMeterExecutor.cancelTest(id);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * Get single test details with parsed metrics
   */
  static async getTestById(req, res) {
    try {
      const { id } = req.params;
      const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
      if (!test) {
        return res.status(404).json({ error: 'Teste não encontrado.' });
      }

      // Parse JSON fields
      const formatted = {
        ...test,
        endpoints: JSON.parse(test.endpoints_json || '[]'),
        config: JSON.parse(test.config_json || '{}'),
        timeseries: JSON.parse(test.timeseries_json || '[]'),
        endpointsMetrics: JSON.parse(test.endpoints_metrics_json || '[]'),
        diagnostics: JSON.parse(test.diagnostics_json || '{}')
      };

      return res.json(formatted);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * List tests with search and filters
   */
  static async listTests(req, res) {
    try {
      const { domain, testType, status, search, limit = 50, offset = 0 } = req.query;

      let query = 'SELECT * FROM tests WHERE 1=1';
      const params = [];

      if (domain) {
        query += ' AND target_url LIKE ?';
        params.push(`%${domain}%`);
      }
      if (testType) {
        query += ' AND test_type = ?';
        params.push(testType);
      }
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (search) {
        query += ' AND (name LIKE ? OR target_url LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const rows = db.prepare(query).all(...params);

      // Total count query
      let countQuery = 'SELECT COUNT(*) as count FROM tests WHERE 1=1';
      const countParams = params.slice(0, -2);
      if (domain) countQuery += ' AND target_url LIKE ?';
      if (testType) countQuery += ' AND test_type = ?';
      if (status) countQuery += ' AND status = ?';
      if (search) countQuery += ' AND (name LIKE ? OR target_url LIKE ?)';

      const total = db.prepare(countQuery).get(...countParams)?.count || 0;

      return res.json({
        items: rows,
        total
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Delete test record and associated files
   */
  static async deleteTest(req, res) {
    try {
      const { id } = req.params;
      const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
      if (!test) {
        return res.status(404).json({ error: 'Teste não encontrado.' });
      }

      if (test.status === 'running' || test.status === 'preparing') {
        return res.status(400).json({ error: 'Não é possível excluir um teste em andamento. Cancele-o primeiro.' });
      }

      // Cleanup files
      if (test.jmx_path && fs.existsSync(test.jmx_path)) fs.unlinkSync(test.jmx_path);
      if (test.jtl_path && fs.existsSync(test.jtl_path)) fs.unlinkSync(test.jtl_path);
      if (test.report_path && fs.existsSync(test.report_path)) {
        fs.rmSync(test.report_path, { recursive: true, force: true });
      }

      db.prepare('DELETE FROM tests WHERE id = ?').run(id);
      return res.json({ success: true, message: 'Teste excluído com sucesso.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Compare two tests side by side
   */
  static async compareTests(req, res) {
    try {
      const testIdA = req.query.testIdA || req.query.testA || req.query.idA;
      const testIdB = req.query.testIdB || req.query.testB || req.query.idB;
      if (!testIdA || !testIdB) {
        return res.status(400).json({ error: 'Dois IDs de teste (testIdA e testIdB) são obrigatórios para comparação.' });
      }

      const testA = db.prepare('SELECT * FROM tests WHERE id = ?').get(testIdA);
      const testB = db.prepare('SELECT * FROM tests WHERE id = ?').get(testIdB);

      if (!testA || !testB) {
        return res.status(404).json({ error: 'Um ou ambos os testes não foram localizados.' });
      }

      const calcDelta = (valA, valB, lowerIsBetter = true) => {
        if (!valA && !valB) return { diff: 0, percent: 0, status: 'equal' };
        if (!valA) return { diff: valB, percent: 100, status: lowerIsBetter ? 'worse' : 'better' };
        const diff = Number((valB - valA).toFixed(2));
        const percent = Number(((diff / valA) * 100).toFixed(1));
        let status = 'equal';
        if (Math.abs(percent) >= 1.0) {
          if (lowerIsBetter) {
            status = diff < 0 ? 'better' : 'worse';
          } else {
            status = diff > 0 ? 'better' : 'worse';
          }
        }
        return { valA, valB, diff, percent, status };
      };

      const comparison = {
        testA: {
          id: testA.id,
          name: testA.name,
          date: testA.started_at || testA.created_at,
          vus: testA.vus,
          type: testA.test_type
        },
        testB: {
          id: testB.id,
          name: testB.name,
          date: testB.started_at || testB.created_at,
          vus: testB.vus,
          type: testB.test_type
        },
        metrics: {
          avgTime: calcDelta(testA.avg_time, testB.avg_time, true),
          p95: calcDelta(testA.p95, testB.p95, true),
          throughput: calcDelta(testA.throughput, testB.throughput, false),
          errorRate: calcDelta(testA.error_rate, testB.error_rate, true),
          totalRequests: calcDelta(testA.total_requests, testB.total_requests, false),
          apdexScore: calcDelta(testA.apdex_score, testB.apdex_score, false)
        }
      };

      return res.json(comparison);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
