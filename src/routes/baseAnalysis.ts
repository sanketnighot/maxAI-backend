import { Router } from "express";
import { portfolioAnalyzer } from "../controllers/portfolioAnalyzer";

const router = Router();
router.post("/portfolio-analyzer", portfolioAnalyzer);

export default router; 