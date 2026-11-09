import fs from 'fs';
import readline from 'readline';

export class JTLParser {
  /**
   * Calculate percentile from sorted number array
   */
  static calculatePercentile(sortedArray, percentile) {
    if (!sortedArray || sortedArray.length === 0) return 0;
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return Math.round(sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight);
  }

  /**
   * RFC 4180 compliant CSV line parser respecting quoted values and commas
   */
  static parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  /**
   * Parse JTL file and compute comprehensive performance metrics
   */
  static async parseJtl(filePath, options = {}) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de resultados JTL não encontrado: ${filePath}`);
    }

    const apdexT = options.apdexT || 500; // default 500ms
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let header = null;
    let colIndex = {};
    const samples = [];
    let firstTimestamp = null;
    let lastTimestamp = null;

    for await (const line of rl) {
      if (!line.trim()) continue;

      const cols = this.parseCsvLine(line);
      if (!header) {
        header = cols.map(c => c.trim().replace(/^["'\s]+|["'\s]+$/g, ''));
        header.forEach((name, idx) => {
          colIndex[name] = idx;
        });
        continue;
      }

      // Read columns
      const timeStamp = parseInt(cols[colIndex['timeStamp']], 10) || 0;
      const elapsed = parseInt(cols[colIndex['elapsed']], 10) || 0;
      const rawLabel = cols[colIndex['label']] || 'Sampler';
      const label = rawLabel.replace(/^["'\s]+|["'\s]+$/g, '').trim();
      const rawResponseCode = cols[colIndex['responseCode']] || '200';
      const responseCode = String(rawResponseCode).replace(/^["'\s]+|["'\s]+$/g, '').trim();
      const successStr = cols[colIndex['success']] || 'false';
      const success = String(successStr).trim().toLowerCase() === 'true';
      const grpThreads = parseInt(cols[colIndex['grpThreads']] || cols[colIndex['allThreads']], 10) || 1;
      const bytes = parseInt(cols[colIndex['bytes']], 10) || 0;
      const latency = parseInt(cols[colIndex['Latency']], 10) || elapsed;
      const rawUrl = cols[colIndex['URL']] || '';
      const url = String(rawUrl).replace(/^["'\s]+|["'\s]+$/g, '').trim();

      if (firstTimestamp === null || timeStamp < firstTimestamp) firstTimestamp = timeStamp;
      if (lastTimestamp === null || timeStamp > lastTimestamp) lastTimestamp = timeStamp;

      samples.push({
        timeStamp,
        elapsed,
        label,
        responseCode,
        success,
        grpThreads,
        bytes,
        latency,
        url
      });
    }

    if (samples.length === 0) {
      return {
        totalRequests: 0,
        successRequests: 0,
        errorRequests: 0,
        errorRate: 0,
        avgTime: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        minTime: 0,
        maxTime: 0,
        throughput: 0,
        apdexScore: 0,
        timeseries: [],
        endpointsMetrics: [],
        samplesCount: 0
      };
    }

    // Sort by elapsed time to compute percentiles
    const elapsedTimes = samples.map(s => s.elapsed).sort((a, b) => a - b);
    const totalRequests = samples.length;
    const successRequests = samples.filter(s => s.success).length;
    const errorRequests = totalRequests - successRequests;
    const errorRate = Number(((errorRequests / totalRequests) * 100).toFixed(2));

    const totalElapsed = elapsedTimes.reduce((acc, val) => acc + val, 0);
    const avgTime = Math.round(totalElapsed / totalRequests);
    const minTime = elapsedTimes[0];
    const maxTime = elapsedTimes[elapsedTimes.length - 1];

    const p50 = this.calculatePercentile(elapsedTimes, 50);
    const p90 = this.calculatePercentile(elapsedTimes, 90);
    const p95 = this.calculatePercentile(elapsedTimes, 95);
    const p99 = this.calculatePercentile(elapsedTimes, 99);

    // Test duration in seconds
    const totalDurationSec = Math.max(1, (lastTimestamp - firstTimestamp) / 1000);
    const throughput = Number((totalRequests / totalDurationSec).toFixed(2));

    // APDEX Calculation
    let satisfiedCount = 0;
    let toleratingCount = 0;
    let frustratedCount = 0;

    for (const s of samples) {
      if (s.success && s.elapsed <= apdexT) {
        satisfiedCount++;
      } else if (s.success && s.elapsed <= 4 * apdexT) {
        toleratingCount++;
      } else {
        frustratedCount++;
      }
    }

    const apdexScore = Number(((satisfiedCount + (toleratingCount / 2)) / totalRequests).toFixed(2));

    // Time-series bucketing (1-second intervals)
    const bucketMap = new Map();
    for (const s of samples) {
      const secOffset = Math.floor((s.timeStamp - firstTimestamp) / 1000);
      if (!bucketMap.has(secOffset)) {
        bucketMap.set(secOffset, {
          secOffset,
          timestamp: s.timeStamp,
          samples: [],
          errors: 0,
          maxThreads: 0
        });
      }
      const b = bucketMap.get(secOffset);
      b.samples.push(s.elapsed);
      if (!s.success) b.errors++;
      if (s.grpThreads > b.maxThreads) b.maxThreads = s.grpThreads;
    }

    const timeseries = Array.from(bucketMap.values())
      .sort((a, b) => a.secOffset - b.secOffset)
      .map(b => {
        const sorted = [...b.samples].sort((x, y) => x - y);
        const sum = sorted.reduce((sum, v) => sum + v, 0);
        return {
          second: b.secOffset,
          timestamp: b.timestamp,
          requestsCount: sorted.length,
          avgResponseTime: Math.round(sum / sorted.length),
          p95ResponseTime: this.calculatePercentile(sorted, 95),
          activeThreads: b.maxThreads,
          errors: b.errors,
          errorRate: Number(((b.errors / sorted.length) * 100).toFixed(1))
        };
      });

    // Endpoint Breakdown
    const endpointMap = new Map();
    for (const s of samples) {
      const epKey = s.label || 'Endpoint';
      if (!endpointMap.has(epKey)) {
        endpointMap.set(epKey, {
          endpoint: epKey,
          url: s.url,
          samples: [],
          errors: 0,
          statusCodes: {}
        });
      }
      const ep = endpointMap.get(epKey);
      ep.samples.push(s.elapsed);
      if (!s.success) ep.errors++;
      ep.statusCodes[s.responseCode] = (ep.statusCodes[s.responseCode] || 0) + 1;
    }

    const endpointsMetrics = Array.from(endpointMap.values()).map(ep => {
      const sorted = [...ep.samples].sort((x, y) => x - y);
      const sum = sorted.reduce((a, b) => a + b, 0);
      const epTotal = sorted.length;
      const epErrors = ep.errors;

      // Find predominant status code
      let predominantStatus = '200';
      let maxStatusCount = 0;
      for (const [code, count] of Object.entries(ep.statusCodes)) {
        if (count > maxStatusCount) {
          maxStatusCount = count;
          predominantStatus = code;
        }
      }

      // Sanitize status code: extract 3-digit HTTP status or fallback gracefully
      const httpCodeMatch = String(predominantStatus).match(/\b([1-5]\d\d)\b/);
      if (httpCodeMatch) {
        predominantStatus = httpCodeMatch[1];
      } else if (epErrors === 0) {
        predominantStatus = '200';
      } else {
        predominantStatus = String(predominantStatus).replace(/["\\]/g, '').trim().substring(0, 10) || 'ERR';
      }

      return {
        endpoint: ep.endpoint,
        url: ep.url,
        totalRequests: epTotal,
        successRequests: epTotal - epErrors,
        errorRequests: epErrors,
        errorRate: Number(((epErrors / epTotal) * 100).toFixed(2)),
        avgTime: Math.round(sum / epTotal),
        p50: this.calculatePercentile(sorted, 50),
        p90: this.calculatePercentile(sorted, 90),
        p95: this.calculatePercentile(sorted, 95),
        p99: this.calculatePercentile(sorted, 99),
        minTime: sorted[0],
        maxTime: sorted[sorted.length - 1],
        throughput: Number((epTotal / totalDurationSec).toFixed(2)),
        predominantStatus,
        statusCodes: ep.statusCodes
      };
    });

    return {
      totalRequests,
      successRequests,
      errorRequests,
      errorRate,
      avgTime,
      p50,
      p90,
      p95,
      p99,
      minTime,
      maxTime,
      throughput,
      apdexScore,
      apdexT,
      apdexDetails: {
        satisfied: satisfiedCount,
        tolerating: toleratingCount,
        frustrated: frustratedCount
      },
      durationSec: totalDurationSec,
      timeseries,
      endpointsMetrics
    };
  }
}

