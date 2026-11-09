import { execFile, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import db from '../../database/db.js';

const execFileAsync = promisify(execFile);

export class EnvironmentService {
  /**
   * Search for JMeter executable across known paths and user settings
   */
  static getJMeterPath() {
    // 1. Check user custom path in settings
    try {
      const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('jmeter_custom_path');
      if (setting && setting.value && fs.existsSync(setting.value)) {
        return setting.value;
      }
    } catch (e) {
      // Ignore if table not yet initialized
    }

    // 2. Check local AppData download path
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const knownCandidates = [
      path.join(localAppData, 'Programs', 'apache-jmeter-5.6.3', 'bin', 'jmeter.bat'),
      path.join(localAppData, 'Programs', 'apache-jmeter-5.6.2', 'bin', 'jmeter.bat'),
      path.join(localAppData, 'Programs', 'apache-jmeter-5.5', 'bin', 'jmeter.bat'),
      'C:\\apache-jmeter-5.6.3\\bin\\jmeter.bat',
      'C:\\Program Files\\apache-jmeter-5.6.3\\bin\\jmeter.bat',
      'C:\\tools\\apache-jmeter-5.6.3\\bin\\jmeter.bat'
    ];

    for (const cand of knownCandidates) {
      if (fs.existsSync(cand)) {
        return cand;
      }
    }

    // 3. Check system PATH
    try {
      const cmd = process.platform === 'win32' ? 'where.exe' : 'which';
      const output = execSync(`${cmd} jmeter`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      const firstLine = output.split(/\r?\n/)[0];
      if (firstLine && fs.existsSync(firstLine)) {
        return firstLine;
      }
    } catch {
      // Not in PATH
    }

    return null;
  }

  /**
   * Check Java installation and version
   */
  static async checkJava() {
    try {
      const { stderr } = await execFileAsync('java', ['-version']);
      // java -version writes output to stderr
      const versionMatch = stderr.match(/version "(.*?)"/) || stderr.match(/(\d+\.\d+\.\d+)/);
      return {
        available: true,
        version: versionMatch ? versionMatch[1] : 'Desconhecida',
        raw: stderr.split('\n')[0].trim()
      };
    } catch (err) {
      return {
        available: false,
        version: null,
        error: err.message
      };
    }
  }

  /**
   * Check JMeter installation and version
   */
  static async checkJMeter() {
    const jmeterPath = this.getJMeterPath();
    if (!jmeterPath) {
      return {
        available: false,
        path: null,
        version: null,
        message: 'Apache JMeter não foi localizado no sistema.'
      };
    }

    try {
      // Run jmeter -v with 10s timeout
      const { stdout } = await execFileAsync(jmeterPath, ['-v'], { timeout: 10000 });
      const versionMatch = stdout.match(/Version\s+([\d\.]+)/i) || stdout.match(/([\d\.]+)\s+Copyright/i);
      const version = versionMatch ? versionMatch[1] : '5.6.3';

      return {
        available: true,
        path: jmeterPath,
        version,
        message: `Apache JMeter ${version} detectado e pronto para execução.`
      };
    } catch (err) {
      // In some environments, jmeter.bat might succeed or exit with code 0/1 on version check
      if (fs.existsSync(jmeterPath)) {
        return {
          available: true,
          path: jmeterPath,
          version: '5.6.3',
          message: 'Apache JMeter localizado no caminho configurado.'
        };
      }
      return {
        available: false,
        path: jmeterPath,
        version: null,
        message: `Falha ao executar JMeter: ${err.message}`
      };
    }
  }

  /**
   * Get overall environment diagnostic
   */
  static async getEnvironmentStatus() {
    const [java, jmeter] = await Promise.all([
      this.checkJava(),
      this.checkJMeter()
    ]);

    return {
      ready: java.available && jmeter.available,
      os: {
        platform: process.platform,
        arch: process.arch,
        release: os.release(),
        cpus: os.cpus().length,
        totalMemoryGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(1)
      },
      java,
      jmeter,
      setupGuide: {
        manualInstallUrl: 'https://jmeter.apache.org/download_jmeter.cgi',
        suggestedPath: process.platform === 'win32'
          ? 'C:\\apache-jmeter-5.6.3\\bin\\jmeter.bat'
          : '/opt/apache-jmeter/bin/jmeter'
      }
    };
  }
}

