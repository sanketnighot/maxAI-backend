import { Router } from 'express';
import { getAnalysisByAddress } from '../controllers/analyzeController';

const router = Router();

router.get('/analysis/:address', getAnalysisByAddress);

export default router;