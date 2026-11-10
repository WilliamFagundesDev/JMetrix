import { execFile, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';
import db from '../../database/db.js';

const execFileAsync = promisify(execFile);

export class EnvironmentService {
  /**
   * Search for Java binary across system PATH, JAVA_HOME, and known directories
   */
  static getJavaBin() {
    // 1. Check system PATH
    try {
      const cmd = process.platform === 'win32' ? 'where.exe' : 'which';
      const output = execSync(`${cmd} java`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      const firstLine = output.split(/\r?\n/)[0];
      if (firstLine && fs.existsSync(firstLine)) {
        return firstLine;
      }
    } catch {}

    // 2. Check JAVA_HOME
    if (process.env.JAVA_HOME) {
      const cand = path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
      if (fs.existsSync(cand)) return cand;
    }

    // 3. Check known project tools or user JDKs
    const home = os.homedir();
    const resourcesPath = process.env.RESOURCES_PATH || '';
    const candidates = [
      resourcesPath ? path.join(resourcesPath, 'tools', 'jre21', 'bin', 'java.exe') : null,
      path.resolve(process.cwd(), 'tools', 'jre21', 'bin', 'java.exe'),
      path.resolve(process.cwd(), '..', 'tools', 'jre21', 'bin', 'java.exe'),
      path.join(home, '.jdks', 'jbr-21.0.11', 'bin', 'java.exe'),
      'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
      'C:\\Program Files\\Eclipse Adoptium\\jdk-21\\bin\\java.exe',
      'C:\\Program Files (x86)\\Common Files\\Oracle\\Java\\javapath\\java.exe'
    ].filter(Boolean);

    for (const cand of candidates) {
      if (fs.existsSync(cand)) return cand;
    }

    return 'java';
  }

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

    // 2. Check JMETER_HOME environment variable
    if (process.env.JMETER_HOME) {
      const jmeterHomeBin = path.join(
        process.env.JMETER_HOME,
        'bin',
        process.platform === 'win32' ? 'jmeter.bat' : 'jmeter'
      );
      if (fs.existsSync(jmeterHomeBin)) {
        return jmeterHomeBin;
      }
    }

    // 3. Check local project tools and AppData download paths
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const resourcesPath = process.env.RESOURCES_PATH || '';
    const knownCandidates = [
      resourcesPath ? path.join(resourcesPath, 'tools', 'apache-jmeter-5.6.3', 'bin', 'jmeter.bat') : null,
      path.resolve(process.cwd(), 'tools', 'apache-jmeter-5.6.3', 'bin', 'jmeter.bat'),
      path.resolve(process.cwd(), '..', 'tools', 'apache-jmeter-5.6.3', 'bin', 'jmeter.bat'),
      path.join(localAppData, 'Programs', 'apache-jmeter-5.6.3', 'bin', 'jmeter.bat'),
      path.join(localAppData, 'Programs', 'apache-jmeter-5.6.2', 'bin', 'jmeter.bat'),
      path.join(localAppData, 'Programs', 'apache-jmeter-5.5', 'bin', 'jmeter.bat'),
      'C:\\apache-jmeter-5.6.3\\bin\\jmeter.bat',
      'C:\\Program Files\\apache-jmeter-5.6.3\\bin\\jmeter.bat',
      'C:\\tools\\apache-jmeter-5.6.3\\bin\\jmeter.bat',
      '/opt/apache-jmeter-5.6.3/bin/jmeter',
      '/opt/apache-jmeter/bin/jmeter',
      '/usr/local/bin/jmeter'
    ].filter(Boolean);

    for (const cand of knownCandidates) {
      if (fs.existsSync(cand)) {
        return cand;
      }
    }

    // 4. Check system PATH
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
    const javaBin = this.getJavaBin();
    try {
      const { stderr, stdout } = await execFileAsync(javaBin, ['-version']);
      const output = (stderr || stdout || '').toString();
      // java -version writes output to stderr
      const versionMatch = output.match(/version "(.*?)"/) || output.match(/(\d+\.\d+\.\d+)/);
      return {
        available: true,
        bin: javaBin,
        version: versionMatch ? versionMatch[1] : 'Desconhecida',
        raw: output.split(/\r?\n/)[0].trim()
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
   * Download a file following HTTP/HTTPS redirects
   */
  static _downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Handle HTTP redirect
          return this._downloadFile(res.headers.location, destPath)
            .then(resolve)
            .catch(reject);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Falha no download (HTTP ${res.statusCode})`));
        }

        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => resolve(destPath));
        });

        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on('error', reject);
    });
  }

  /**
   * Automated download and provisioning of Apache JMeter 5.6.3
   */
  static async installJMeter() {
    const existing = this.getJMeterPath();
    if (existing && fs.existsSync(existing)) {
      return {
        success: true,
        alreadyInstalled: true,
        path: existing,
        message: 'Apache JMeter já está instalado e disponível.'
      };
    }

    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const targetBaseDir = path.join(localAppData, 'Programs');
    fs.mkdirSync(targetBaseDir, { recursive: true });

    const zipDest = path.join(os.tmpdir(), `apache-jmeter-5.6.3-${Date.now()}.zip`);
    const downloadUrls = [
      'https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.zip',
      'https://dlcdn.apache.org/jmeter/binaries/apache-jmeter-5.6.3.zip'
    ];

    let downloaded = false;
    let lastErr = null;

    for (const dlUrl of downloadUrls) {
      try {
        console.log(`[JMETRIX Installer] Baixando Apache JMeter de: ${dlUrl}`);
        await this._downloadFile(dlUrl, zipDest);
        downloaded = true;
        break;
      } catch (e) {
        lastErr = e;
        console.warn(`[JMETRIX Installer] Falha no espelho ${dlUrl}:`, e.message);
      }
    }

    if (!downloaded) {
      throw new Error(`Não foi possível baixar o Apache JMeter: ${lastErr?.message || 'Erro desconhecido'}`);
    }

    try {
      console.log(`[JMETRIX Installer] Extraindo Apache JMeter para: ${targetBaseDir}`);
      // Unpack using native Windows tar or PowerShell
      if (process.platform === 'win32') {
        try {
          execSync(`tar -xf "${zipDest}" -C "${targetBaseDir}"`, { stdio: 'ignore' });
        } catch {
          execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipDest}' -DestinationPath '${targetBaseDir}' -Force"`, { stdio: 'ignore' });
        }
      } else {
        execSync(`unzip -q "${zipDest}" -d "${targetBaseDir}"`, { stdio: 'ignore' });
      }

      const installedBat = path.join(targetBaseDir, 'apache-jmeter-5.6.3', 'bin', process.platform === 'win32' ? 'jmeter.bat' : 'jmeter');
      if (!fs.existsSync(installedBat)) {
        throw new Error(`Extração concluída, mas o binário não foi localizado em: ${installedBat}`);
      }

      // Persist path in DB settings
      try {
        db.prepare(`
          INSERT INTO settings (key, value, updated_at)
          VALUES ('jmeter_custom_path', ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `).run(installedBat);
      } catch {}

      return {
        success: true,
        path: installedBat,
        version: '5.6.3',
        message: 'Apache JMeter 5.6.3 instalado e configurado com sucesso!'
      };
    } finally {
      // Clean up temp zip
      try {
        if (fs.existsSync(zipDest)) {
          fs.unlinkSync(zipDest);
        }
      } catch {}
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

