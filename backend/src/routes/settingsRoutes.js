import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController.js';

const router = Router();

router.get('/', SettingsController.getSettings);
router.post('/', SettingsController.updateSettings);
router.get('/environment', SettingsController.verifyEnvironment);
router.post('/install-jmeter', SettingsController.installJMeter);
router.get('/junit-tests', SettingsController.runJUnitTests);

export default router;

