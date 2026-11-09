import { Router } from 'express';
import testRoutes from './testRoutes.js';
import discoveryRoutes from './discoveryRoutes.js';
import siteRoutes from './siteRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import reportRoutes from './reportRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const router = Router();

router.use('/tests', testRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/sites', siteRoutes);
router.use('/settings', settingsRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

