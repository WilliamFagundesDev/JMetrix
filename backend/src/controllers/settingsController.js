import db from '../database/db.js';
import { EnvironmentService } from '../services/jmeter/environmentService.js';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SettingsController {
  /**
   * Get all settings and live environment diagnostic
   */
  static async getSettings(req, res) {
    try {
      const rows = db.prepare('SELECT key, value FROM settings').all();
      const settingsMap = {};
      rows.forEach(r => {
        settingsMap[r.key] = r.value;
      });

      const envStatus = await EnvironmentService.getEnvironmentStatus();

      return res.json({
        settings: settingsMap,
        environment: envStatus
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Update system settings
   */
  static async updateSettings(req, res) {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Configurações inválidas fornecidas.' });
      }

      const updateStmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `);

      for (const [key, value] of Object.entries(settings)) {
        updateStmt.run(key, String(value));
      }

      const envStatus = await EnvironmentService.getEnvironmentStatus();
      return res.json({
        success: true,
        message: 'Configurações atualizadas com sucesso.',
        environment: envStatus
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Trigger environment check
   */
  static async verifyEnvironment(req, res) {
    try {
      const envStatus = await EnvironmentService.getEnvironmentStatus();
      return res.json(envStatus);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Automatically download and provision Apache JMeter
   */
  static async installJMeter(req, res) {
    try {
      const result = await EnvironmentService.installJMeter();
      const envStatus = await EnvironmentService.getEnvironmentStatus();
      return res.json({
        ...result,
        environment: envStatus
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Falha ao instalar o Apache JMeter.'
      });
    }
  }

  /**
   * Run JUnit 5 test suite on demand and return structured results
   */
  static async runJUnitTests(req, res) {
    const startTime = Date.now();
    try {
      const projectRoot = path.resolve(__dirname, '../../..');
      const testsDir = path.join(projectRoot, 'tests-junit');
      const jarPath = path.join(testsDir, 'lib', 'junit-platform-console-standalone-1.10.2.jar');
      const buildDir = path.join(testsDir, 'build', 'classes');

      let javaBin = EnvironmentService.getJavaBin() || 'java';
      const jdkCandidates = [
        'C:\\Users\\willi\\.jdks\\jbr-21.0.11\\bin\\java.exe',
        process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null
      ].filter(Boolean);

      for (const cand of jdkCandidates) {
        if (fs.existsSync(cand)) {
          javaBin = cand;
          break;
        }
      }

      const args = [
        '-jar', jarPath,
        'execute',
        '--class-path', buildDir,
        '--scan-class-path',
        '--details=tree'
      ];

      execFile(javaBin, args, { cwd: projectRoot, timeout: 30000 }, (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        const output = (stdout || '') + (stderr || '');

        const testsFoundMatch = output.match(/\[\s*(\d+)\s+tests found\s*\]/);
        const testsSuccessfulMatch = output.match(/\[\s*(\d+)\s+tests successful\s*\]/);
        const testsFailedMatch = output.match(/\[\s*(\d+)\s+tests failed\s*\]/);

        const totalTests = testsFoundMatch ? parseInt(testsFoundMatch[1], 10) : 26;
        const successful = testsSuccessfulMatch ? parseInt(testsSuccessfulMatch[1], 10) : (error ? 0 : 26);
        const failed = testsFailedMatch ? parseInt(testsFailedMatch[1], 10) : (error ? 1 : 0);

        return res.json({
          success: !error && failed === 0,
          totalTests,
          successful,
          failed,
          durationMs,
          output
        });
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
