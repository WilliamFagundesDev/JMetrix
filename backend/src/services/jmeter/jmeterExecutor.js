import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../../database/db.js';
import { EnvironmentService } from './environmentService.js';
import { JMXBuilder } from './jmxBuilder.js';
import { JTLParser } from './jtlParser.js';
import { DiagnosticEngine } from '../diagnostics/diagnosticEngine.js';
import { broadcast } from '../../websocket/wsServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../../../storage');

export class JMeterExecutor {
  // Map of active test processes: testId => { process, startTime, ... }
  static activeProcesses = new Map();

  /**
   * Check if any test is currently running
   */
  static isRunning() {
    return this.activeProcesses.size > 0;
  }

  /**
   * Start executing a test run
   */
  static async startTest(testId) {
    const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(testId);
    if (!test) {
      throw new Error(`Teste com ID ${testId} não encontrado.`);
    }

    if (this.isRunning()) {
      throw new Error('Já existe um teste em execução. Aguarde a conclusão ou cancele o teste atual.');
    }

    const jmeterPath = EnvironmentService.getJMeterPath();
    if (!jmeterPath || !fs.existsSync(jmeterPath)) {
      throw new Error('Apache JMeter não está disponível ou configurado. Verifique as configurações do sistema.');
    }

    // Prepare paths
    const plansDir = path.join(storageDir, 'plans');
    const resultsDir = path.join(storageDir, 'results');
    const reportsDir = path.join(storageDir, 'reports', testId);

    fs.mkdirSync(plansDir, { recursive: true });
    fs.mkdirSync(resultsDir, { recursive: true });
    fs.mkdirSync(reportsDir, { recursive: true });

    const jmxPath = path.join(plansDir, `${testId}.jmx`);
    const jtlPath = path.join(resultsDir, `${testId}.jtl`);
    const logPath = path.join(resultsDir, `${testId}.log`);

    // Parse endpoints and configs
    let endpoints = [];
    try {
      endpoints = JSON.parse(test.endpoints_json || '[]');
    } catch {}

    let config = {};
    try {
      config = JSON.parse(test.config_json || '{}');
    } catch {}

    // Update status to preparing
    db.prepare(`
      UPDATE tests 
      SET status = 'preparing', jmx_path = ?, jtl_path = ?, report_path = ?, started_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(jmxPath, jtlPath, reportsDir, testId);

    broadcast('test:status', {
      testId,
      status: 'preparing',
      message: 'Gerando plano de teste Apache JMeter (.jmx)...'
    });

    // Generate JMX
    const jmxContent = JMXBuilder.generateJmx({
      testId,
      testName: test.name,
      testType: test.test_type,
      targetUrl: test.target_url,
      vus: test.vus,
      duration: test.duration,
      rampUp: test.ramp_up,
      endpoints,
      delayMs: config.delayMs || 1000,
      jtlFilePath: jtlPath
    });

    fs.writeFileSync(jmxPath, jmxContent, 'utf-8');

    // Build command arguments (No shell interpolation! Safe argument array)
    const args = [
      '-n',
      '-t', jmxPath,
      '-l', jtlPath,
      '-j', logPath,
      '-e',
      '-o', reportsDir
    ];

    // Status to running
    db.prepare(`UPDATE tests SET status = 'running' WHERE id = ?`).run(testId);

    broadcast('test:status', {
      testId,
      status: 'running',
      message: 'Iniciando execução no Apache JMeter...'
    });

    const startTime = Date.now();
    const plannedDurationSec = test.duration;

    // Spawn JMeter process safely
    const jarPath = path.join(path.dirname(jmeterPath), 'ApacheJMeter.jar');
    let spawnCmd = jmeterPath;
    let spawnArgs = args;
    let spawnOpts = {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    };

    if (fs.existsSync(jarPath)) {
      spawnCmd = 'java';
      spawnArgs = ['-jar', jarPath, ...args];
    } else if (process.platform === 'win32' && jmeterPath.endsWith('.bat')) {
      spawnOpts.shell = true;
    }

    const child = spawn(spawnCmd, spawnArgs, spawnOpts);

    this.activeProcesses.set(testId, {
      process: child,
      startTime,
      duration: plannedDurationSec,
      jtlPath,
      jmxPath,
      reportsDir
    });

    // Real-time telemetry monitoring interval
    let lastSampleCount = 0;
    const progressInterval = setInterval(async () => {
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const progressPercent = Math.min(99, Math.round((elapsedSec / plannedDurationSec) * 100));

      // Attempt reading latest telemetry from JTL if file exists
      let liveStats = {
        testId,
        elapsedSec,
        progressPercent,
        activeThreads: test.vus,
        totalRequests: lastSampleCount,
        throughput: 0,
        avgResponseTime: 0,
        errorCount: 0
      };

      try {
        if (fs.existsSync(jtlPath)) {
          const stats = await JTLParser.parseJtl(jtlPath);
          lastSampleCount = stats.totalRequests;
          liveStats.totalRequests = stats.totalRequests;
          liveStats.throughput = stats.throughput;
          liveStats.avgResponseTime = stats.avgTime;
          liveStats.errorCount = stats.errorRequests;
          liveStats.errorRate = stats.errorRate;
          liveStats.activeThreads = stats.timeseries.length > 0
            ? stats.timeseries[stats.timeseries.length - 1].activeThreads
            : Math.min(test.vus, Math.ceil((elapsedSec / Math.max(1, test.ramp_up)) * test.vus));
        }
      } catch (e) {
        // JTL might be locked momentarily by JMeter
      }

      broadcast('test:telemetry', liveStats);
    }, 1500);

    // Stdout tracking
    child.stdout.on('data', (data) => {
      const str = data.toString();
      // Look for JMeter summary line: "summary + 15 in 00:00:03 = 5.0/s Avg: 120 ..."
      const match = str.match(/summary\s*[\+=]\s*(\d+)\s+in\s+([0-9:]+)\s*=\s*([0-9\.]+)\/s\s+Avg:\s*(\d+)/);
      if (match) {
        const reqCount = parseInt(match[1], 10);
        const tput = parseFloat(match[3]);
        const avgMs = parseInt(match[4], 10);
        broadcast('test:telemetry_pulse', {
          testId,
          reqCount,
          throughput: tput,
          avgTime: avgMs
        });
      }
    });

    // Process Exit Handler
    child.on('close', async (code) => {
      clearInterval(progressInterval);
      this.activeProcesses.delete(testId);

      const currentTest = db.prepare('SELECT status FROM tests WHERE id = ?').get(testId);
      if (currentTest && currentTest.status === 'cancelled') {
        return; // already handled
      }

      broadcast('test:status', {
        testId,
        status: 'finalizing',
        message: 'Processando resultados e gerando diagnóstico técnico...'
      });

      try {
        if (!fs.existsSync(jtlPath)) {
          throw new Error('Nenhum resultado foi gerado pelo JMeter.');
        }

        // Parse JTL results
        const apdexSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('apdex_t_ms');
        const apdexT = apdexSetting ? parseInt(apdexSetting.value, 10) : 500;

        const metrics = await JTLParser.parseJtl(jtlPath, { apdexT });

        // Generate automated technical diagnostics
        const diagnostics = DiagnosticEngine.analyze(metrics, {
          testType: test.test_type,
          targetUrl: test.target_url
        });

        // Update database with final metrics
        db.prepare(`
          UPDATE tests
          SET status = 'completed',
              completed_at = CURRENT_TIMESTAMP,
              total_requests = ?,
              success_requests = ?,
              error_requests = ?,
              error_rate = ?,
              avg_time = ?,
              p50 = ?,
              p90 = ?,
              p95 = ?,
              p99 = ?,
              min_time = ?,
              max_time = ?,
              throughput = ?,
              apdex_score = ?,
              timeseries_json = ?,
              endpoints_metrics_json = ?,
              diagnostics_json = ?
          WHERE id = ?
        `).run(
          metrics.totalRequests,
          metrics.successRequests,
          metrics.errorRequests,
          metrics.errorRate,
          metrics.avgTime,
          metrics.p50,
          metrics.p90,
          metrics.p95,
          metrics.p99,
          metrics.minTime,
          metrics.maxTime,
          metrics.throughput,
          metrics.apdexScore,
          JSON.stringify(metrics.timeseries),
          JSON.stringify(metrics.endpointsMetrics),
          JSON.stringify(diagnostics),
          testId
        );

        broadcast('test:completed', {
          testId,
          metrics,
          diagnostics
        });
      } catch (err) {
        db.prepare(`
          UPDATE tests 
          SET status = 'failed', completed_at = CURRENT_TIMESTAMP, error_message = ? 
          WHERE id = ?
        `).run(err.message, testId);

        broadcast('test:failed', {
          testId,
          error: err.message
        });
      }
    });

    child.on('error', (err) => {
      clearInterval(progressInterval);
      this.activeProcesses.delete(testId);

      db.prepare(`
        UPDATE tests 
        SET status = 'failed', completed_at = CURRENT_TIMESTAMP, error_message = ? 
        WHERE id = ?
      `).run(`Falha no processo do JMeter: ${err.message}`, testId);

      broadcast('test:failed', {
        testId,
        error: err.message
      });
    });

    return {
      testId,
      status: 'running',
      message: 'Execução do JMeter iniciada com sucesso.'
    };
  }

  /**
   * Cancel an active test execution
   */
  static async cancelTest(testId) {
    const active = this.activeProcesses.get(testId);
    if (!active) {
      // If not in memory but DB says running, update DB
      db.prepare(`UPDATE tests SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('running', 'preparing')`).run(testId);
      return { success: true, message: 'Status do teste atualizado para cancelado.' };
    }

    const pid = active.process.pid;
    if (pid) {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${pid} /T /F`, () => {});
      } else {
        active.process.kill('SIGTERM');
      }
    }

    this.activeProcesses.delete(testId);

    db.prepare(`
      UPDATE tests 
      SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP, error_message = 'Cancelado pelo usuário.' 
      WHERE id = ?
    `).run(testId);

    broadcast('test:cancelled', {
      testId,
      message: 'O teste foi cancelado pelo usuário.'
    });

    return { success: true, message: 'Execução cancelada com sucesso.' };
  }
}
