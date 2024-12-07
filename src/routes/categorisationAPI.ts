import { Router } from "express";
import { getWalletCategorization } from "../controllers/categorisation_API";

const router = Router();

router.get("/categorization/:address", getWalletCategorization);

export default router;