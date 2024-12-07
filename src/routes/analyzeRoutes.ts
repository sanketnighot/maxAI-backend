import { Router } from 'express';
import { analyzeWallet } from '../controllers/analyzeController';

const router = Router();

router.post('/analyze', analyzeWallet);

export default router; 