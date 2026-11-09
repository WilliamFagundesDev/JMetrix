import fs from 'fs';
import path from 'path';
import db from '../database/db.js';
import { ExportService } from '../services/reports/exportService.js';
import { JMXBuilder } from '../services/jmeter/jmxBuilder.js';

export class ReportController {
  /**
   * Export test data as CSV
   */
  static async exportCsv(req, res) {
    try {
      const { id } = req.params;
      const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
      if (!test) {
        return res.status(404).json({ error: 'Teste não encontrado.' });
      }

      const csvContent = ExportService.generateCsv(test);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="jmetrix_relatorio_${test.id}.csv"`);
      return res.send(csvContent);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Export standalone HTML report
   */
  static async exportHtml(req, res) {
    try {
      const { id } = req.params;
      const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
      if (!test) {
        return res.status(404).json({ error: 'Teste não encontrado.' });
      }

      const htmlContent = ExportService.generateHtmlReport(test);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(htmlContent);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Export Apache JMeter test plan (.jmx) file
   */
  static async exportJmx(req, res) {
    try {
      const { id } = req.params;
      const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
      if (!test) {
        return res.status(404).json({ error: 'Teste não encontrado.' });
      }

      let jmxContent = '';
      if (test.jmx_path && fs.existsSync(test.jmx_path)) {
        jmxContent = fs.readFileSync(test.jmx_path, 'utf-8');
      } else {
        // Re-generate JMX plan dynamically
        let endpoints = [];
        try { endpoints = JSON.parse(test.endpoints_json || '[]'); } catch {}
        let config = {};
        try { config = JSON.parse(test.config_json || '{}'); } catch {}

        jmxContent = JMXBuilder.generateJmx({
          testId: test.id,
          testName: test.name,
          testType: test.test_type,
          targetUrl: test.target_url,
          vus: test.vus,
          duration: test.duration,
          rampUp: test.ramp_up,
          endpoints,
          delayMs: config.delayMs || 1000,
          jtlFilePath: test.jtl_path || `results_${test.id}.jtl`
        });
      }

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="plano_jmeter_${test.id}.jmx"`);
      return res.send(jmxContent);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get raw JMX XML content for in-app plan inspector
   */
  static async getJmxContent(req, res) {
    try {
      const { id } = req.params;
      const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id);
      if (!test) {
        return res.status(404).json({ error: 'Teste não encontrado.' });
      }

      let jmxContent = '';
      if (test.jmx_path && fs.existsSync(test.jmx_path)) {
        jmxContent = fs.readFileSync(test.jmx_path, 'utf-8');
      } else {
        let endpoints = [];
        try { endpoints = JSON.parse(test.endpoints_json || '[]'); } catch {}
        let config = {};
        try { config = JSON.parse(test.config_json || '{}'); } catch {}

        jmxContent = JMXBuilder.generateJmx({
          testId: test.id,
          testName: test.name,
          testType: test.test_type,
          targetUrl: test.target_url,
          vus: test.vus,
          duration: test.duration,
          rampUp: test.ramp_up,
          endpoints,
          delayMs: config.delayMs || 1000,
          jtlFilePath: test.jtl_path || `results_${test.id}.jtl`
        });
      }

      return res.json({
        testId: test.id,
        testName: test.name,
        targetUrl: test.target_url,
        testType: test.test_type,
        vus: test.vus,
        duration: test.duration,
        rampUp: test.ramp_up,
        jmxContent
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Export Apache JMeter raw JTL (CSV) results file
   */
  static async exportJtl(req, res) {
    try {
      const { id } = req.params;
      const test = db.prepare('SELECT jtl_path FROM tests WHERE id = ?').get(id);
      if (!test || !test.jtl_path || !fs.existsSync(test.jtl_path)) {
        return res.status(404).send('Arquivo .jtl com resultados brutos não encontrado para este teste.');
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="resultados_jtl_${id}.csv"`);
      return res.sendFile(path.resolve(test.jtl_path));
    } catch (err) {
      return res.status(500).send(err.message);
    }
  }

  /**
   * Serve native JMeter HTML dashboard if generated
   */
  static async serveNativeReport(req, res) {
    try {
      const { id } = req.params;
      const test = db.prepare('SELECT report_path FROM tests WHERE id = ?').get(id);
      if (!test || !test.report_path || !fs.existsSync(test.report_path)) {
        return res.status(404).send('Relatório nativo do JMeter não disponível para este teste.');
      }

      const indexPath = path.join(test.report_path, 'index.html');
      if (!fs.existsSync(indexPath)) {
        return res.status(404).send('index.html do relatório nativo do JMeter não foi encontrado.');
      }

      return res.sendFile(indexPath);
    } catch (err) {
      return res.status(500).send(err.message);
    }
  }
}
