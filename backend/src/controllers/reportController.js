import fs from 'fs';
import path from 'path';
import db from '../database/db.js';
import { ExportService } from '../services/reports/exportService.js';

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
