import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storageDir = path.resolve(__dirname, '../../storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const dbPath = path.join(storageDir, 'data.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance and concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      site_id TEXT,
      name TEXT NOT NULL,
      target_url TEXT NOT NULL,
      test_type TEXT NOT NULL, -- smoke, load, stress, spike, endurance
      preset_profile TEXT NOT NULL, -- light, moderate, advanced, custom
      status TEXT NOT NULL, -- pending, preparing, running, finalizing, completed, failed, cancelled
      vus INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      ramp_up INTEGER NOT NULL,
      endpoints_json TEXT NOT NULL,
      config_json TEXT NOT NULL,
      started_at DATETIME,
      completed_at DATETIME,
      error_message TEXT,
      jmx_path TEXT,
      jtl_path TEXT,
      report_path TEXT,
      
      -- Real Calculated Metrics
      total_requests INTEGER DEFAULT 0,
      success_requests INTEGER DEFAULT 0,
      error_requests INTEGER DEFAULT 0,
      error_rate REAL DEFAULT 0,
      avg_time REAL DEFAULT 0,
      p50 REAL DEFAULT 0,
      p90 REAL DEFAULT 0,
      p95 REAL DEFAULT 0,
      p99 REAL DEFAULT 0,
      min_time REAL DEFAULT 0,
      max_time REAL DEFAULT 0,
      throughput REAL DEFAULT 0,
      apdex_score REAL DEFAULT 0,
      
      -- Detailed serialized results for instant replay
      timeseries_json TEXT,
      endpoints_metrics_json TEXT,
      diagnostics_json TEXT,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.exec(schema);

  // Seed default settings if not exists
  const defaults = [
    { key: 'jmeter_custom_path', value: 'C:\\Users\\willi\\AppData\Local\\Programs\\apache-jmeter-5.6.3\\bin\\jmeter.bat' },
    { key: 'max_vus', value: '500' },
    { key: 'max_duration_seconds', value: '1800' },
    { key: 'max_crawler_pages', value: '25' },
    { key: 'crawler_depth', value: '2' },
    { key: 'apdex_t_ms', value: '500' },
    { key: 'max_concurrent_tests', value: '1' }
  ];

  const checkStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

  for (const item of defaults) {
    const existing = checkStmt.get(item.key);
    if (!existing) {
      insertStmt.run(item.key, item.value);
    }
  }
}

export default db;

