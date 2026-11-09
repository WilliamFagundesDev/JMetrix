import { Router } from 'express';
import { SiteController } from '../controllers/siteController.js';

const router = Router();

router.get('/', SiteController.listSites);
router.post('/', SiteController.createSite);
router.get('/:id', SiteController.getSiteById);
router.delete('/:id', SiteController.deleteSite);

export default router;

