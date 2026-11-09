import db from '../database/db.js';
import { EnvironmentService } from '../services/jmeter/environmentService.js';

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
}
