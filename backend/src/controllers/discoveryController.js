import { CrawlerService } from '../services/discovery/crawlerService.js';
import { SSRFValidator } from '../services/discovery/ssrfValidator.js';

export class DiscoveryController {
  /**
   * Pre-flight connectivity check and SSRF verification
   */
  static async validateUrl(req, res) {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL é obrigatória.' });
      }

      const check = await CrawlerService.checkConnectivity(url);
      return res.json(check);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * Scoped application crawler & page discovery
   */
  static async discoverPages(req, res) {
    try {
      const { url, maxPages, maxDepth } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL é obrigatória.' });
      }

      const discovery = await CrawlerService.discoverPages(url, { maxPages, maxDepth });
      return res.json(discovery);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}

