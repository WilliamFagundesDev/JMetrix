import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';

const router = Router();

router.get('/:id/csv', ReportController.exportCsv);
router.get('/:id/html', ReportController.exportHtml);
router.get('/:id/native', ReportController.serveNativeReport);

export default router;

