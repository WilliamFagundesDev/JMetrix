import { Router } from 'express';
import { DiscoveryController } from '../controllers/discoveryController.js';

const router = Router();

router.post('/validate', DiscoveryController.validateUrl);
router.post('/crawl', DiscoveryController.discoverPages);

export default router;

