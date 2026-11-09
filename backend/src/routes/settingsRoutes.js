import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController.js';

const router = Router();

router.get('/', SettingsController.getSettings);
router.post('/', SettingsController.updateSettings);
router.get('/environment', SettingsController.verifyEnvironment);

export default router;

