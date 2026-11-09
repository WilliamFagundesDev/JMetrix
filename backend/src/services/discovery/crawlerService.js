import axios from 'axios';
import * as cheerio from 'cheerio';
import { SSRFValidator } from './ssrfValidator.js';
import db from '../../database/db.js';

export class CrawlerService {
  /**
   * Pre-flight connectivity check
   */
  static async checkConnectivity(targetUrl) {
    const validated = await SSRFValidator.validateUrl(targetUrl);
    
    const startTime = Date.now();
    try {
      const response = await axios.get(validated.sanitizedUrl, {
        timeout: 8000,
        maxRedirects: 3,
        validateStatus: () => true, // accept all HTTP codes
        headers: {
          'User-Agent': 'JMETRIX-Performance-Agent/1.0 (+https://jmetrix.local)'
        }
      });

      const latencyMs = Date.now() - startTime;
      const $ = cheerio.load(response.data || '');
      const title = $('title').text().trim() || 'Sem título';

      return {
        accessible: response.status >= 200 && response.status < 400,
        status: response.status,
        statusText: response.statusText,
        latencyMs,
        title,
        sanitizedUrl: validated.sanitizedUrl,
        origin: validated.origin
      };
    } catch (err) {
      return {
        accessible: false,
        status: null,
        latencyMs: Date.now() - startTime,
        error: `Não foi possível conectar ao endereço: ${err.message}`,
        sanitizedUrl: validated.sanitizedUrl,
        origin: validated.origin
      };
    }
  }

  /**
   * Respectful discovery crawler
   */
  static async discoverPages(targetUrl, options = {}) {
    const validated = await SSRFValidator.validateUrl(targetUrl);
    const origin = validated.origin;

    // Read crawler limits from settings
    let maxPages = 20;
    let maxDepth = 2;
    try {
      const pSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('max_crawler_pages');
      if (pSetting) maxPages = parseInt(pSetting.value, 10);
      const dSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('crawler_depth');
      if (dSetting) maxDepth = parseInt(dSetting.value, 10);
    } catch {}

    if (options.maxPages) maxPages = Math.min(options.maxPages, 50);
    if (options.maxDepth) maxDepth = Math.min(options.maxDepth, 3);

    const visited = new Set();
    const queue = [{ url: validated.sanitizedUrl, depth: 0 }];
    const discoveredPages = [];
    const brokenLinks = [];

    // 1. Check robots.txt
    const robotsInfo = await this.checkRobotsTxt(origin);

    // 2. Check sitemap.xml
    const sitemapUrls = await this.checkSitemapXml(origin);
    for (const smUrl of sitemapUrls) {
      if (queue.length < maxPages && !visited.has(smUrl)) {
        queue.push({ url: smUrl, depth: 1 });
      }
    }

    // 3. BFS Crawl
    while (queue.length > 0 && discoveredPages.length < maxPages) {
      const current = queue.shift();
      const normUrl = this.normalizeUrl(current.url, origin);

      if (!normUrl || visited.has(normUrl)) {
        continue;
      }
      visited.add(normUrl);

      // Check robots disallow
      if (robotsInfo.disallowed.some(rule => normUrl.includes(rule))) {
        continue;
      }

      // Re-validate against SSRF before fetching
      try {
        await SSRFValidator.validateUrl(normUrl);
      } catch {
        continue;
      }

      const startTime = Date.now();
      try {
        const response = await axios.get(normUrl, {
          timeout: 5000,
          maxRedirects: 2,
          validateStatus: () => true,
          headers: {
            'User-Agent': 'JMETRIX-Performance-Agent/1.0 (+https://jmetrix.local)'
          }
        });

        const latencyMs = Date.now() - startTime;
        const contentType = response.headers['content-type'] || '';
        const isHtml = contentType.includes('text/html');

        let title = 'Endpoint API/Arquivo';
        const pageData = {
          url: normUrl,
          path: new URL(normUrl).pathname || '/',
          title,
          status: response.status,
          latencyMs,
          depth: current.depth,
          isHealthy: response.status >= 200 && response.status < 400
        };

        if (isHtml && response.data) {
          const $ = cheerio.load(response.data);
          pageData.title = $('title').text().trim() || pageData.path;

          // Extract internal links if depth < maxDepth
          if (current.depth < maxDepth) {
            $('a[href]').each((_, el) => {
              const href = $(el).attr('href');
              const resolved = this.resolveLink(href, normUrl, origin);
              if (resolved && !visited.has(resolved) && queue.length < maxPages * 2) {
                queue.push({ url: resolved, depth: current.depth + 1 });
              }
            });
          }
        }

        if (pageData.isHealthy) {
          discoveredPages.push(pageData);
        } else {
          pageData.broken = true;
          brokenLinks.push(pageData);
          discoveredPages.push(pageData);
        }
      } catch (err) {
        const failedData = {
          url: normUrl,
          path: new URL(normUrl).pathname || '/',
          title: 'Erro de conexão',
          status: 0,
          latencyMs: Date.now() - startTime,
          depth: current.depth,
          isHealthy: false,
          broken: true,
          error: err.message
        };
        brokenLinks.push(failedData);
        discoveredPages.push(failedData);
      }
    }

    const totalLatency = discoveredPages.reduce((acc, p) => acc + (p.latencyMs || 0), 0);
    const avgLatency = discoveredPages.length > 0 ? Math.round(totalLatency / discoveredPages.length) : 0;

    return {
      targetUrl: validated.sanitizedUrl,
      origin,
      robotsInfo,
      sitemapFound: sitemapUrls.length > 0,
      sitemapUrlsCount: sitemapUrls.length,
      pages: discoveredPages,
      brokenLinks,
      summary: {
        totalDiscovered: discoveredPages.length,
        healthyCount: discoveredPages.filter(p => p.isHealthy).length,
        brokenCount: brokenLinks.length,
        avgInitialLatencyMs: avgLatency
      }
    };
  }

  static async checkRobotsTxt(origin) {
    try {
      const robotsUrl = `${origin}/robots.txt`;
      const res = await axios.get(robotsUrl, { timeout: 3000, validateStatus: () => true });
      if (res.status === 200 && typeof res.data === 'string') {
        const lines = res.data.split('\n');
        const disallowed = [];
        for (const line of lines) {
          const match = line.match(/^Disallow:\s*(.+)$/i);
          if (match && match[1].trim() !== '') {
            disallowed.push(match[1].trim());
          }
        }
        return { exists: true, disallowed };
      }
    } catch {}
    return { exists: false, disallowed: [] };
  }

  static async checkSitemapXml(origin) {
    try {
      const sitemapUrl = `${origin}/sitemap.xml`;
      const res = await axios.get(sitemapUrl, { timeout: 3000, validateStatus: () => true });
      if (res.status === 200 && typeof res.data === 'string') {
        const matches = [...res.data.matchAll(/<loc>(.*?)<\/loc>/g)];
        const urls = matches.map(m => m[1].trim()).filter(u => u.startsWith(origin));
        return urls.slice(0, 15);
      }
    } catch {}
    return [];
  }

  static normalizeUrl(urlStr, origin) {
    try {
      const u = new URL(urlStr, origin);
      if (u.origin !== origin) return null; // strictly same domain
      u.hash = ''; // strip fragment
      return u.toString();
    } catch {
      return null;
    }
  }

  static resolveLink(href, currentUrl, origin) {
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
      return null;
    }
    try {
      const resolved = new URL(href, currentUrl);
      if (resolved.origin !== origin) return null;
      // Filter out binary/asset files from page crawling
      const pathname = resolved.pathname.toLowerCase();
      if (pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|ico|pdf|zip|mp4|webm|woff|woff2|ttf)$/i)) {
        return null;
      }
      resolved.hash = '';
      return resolved.toString();
    } catch {
      return null;
    }
  }
}

