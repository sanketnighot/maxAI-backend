import { Router } from 'express';
import { analyzeWallet, getAnalysisByAddress } from '../controllers/analyzeController';

const router = Router();

router.post('/analyze', analyzeWallet);
router.get('/analysis/:address', getAnalysisByAddress);

export default router; 