import { Router } from 'express';
import { TestController } from '../controllers/testController.js';

const router = Router();

router.post('/', TestController.createTest);
router.get('/', TestController.listTests);
router.get('/compare', TestController.compareTests);
router.get('/:id', TestController.getTestById);
router.post('/:id/start', TestController.startTest);
router.post('/:id/cancel', TestController.cancelTest);
router.delete('/:id', TestController.deleteTest);

export default router;

