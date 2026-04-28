
import { Router } from "express";
import { getEarnings, requestPayout, getPayoutHistory, setupBankAccount, getBankAccount } from "../controllers/host.dashboard.controller.js";
import { verifyHost } from "../middlewares/authenticate.js";

const router = Router();
router.use(verifyHost);
router.get("/earnings", getEarnings);
router.post("/payouts/request", requestPayout);
router.get("/payouts/history", getPayoutHistory);
router.post("/bank-account", setupBankAccount);
router.get("/bank-account", getBankAccount);

export default router;
      