import { Router } from "express";
import { initializeAgent } from "../controllers/baseAgent";

const router = Router();

router.get("/baseAgent", initializeAgent);

export default router;
