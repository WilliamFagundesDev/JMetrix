import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';

const router = Router();

router.get('/overview', DashboardController.getOverview);

export default router;

