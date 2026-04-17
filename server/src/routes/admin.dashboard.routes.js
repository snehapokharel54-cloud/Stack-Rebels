
import { Router } from "express";
import { getGeneralDashboard, getRevenueAnalytics, getListingAnalytics, getUserAnalytics, getUsers, getUserDetail, suspendUser, deleteUser, getHosts, verifyHost, suspendHost, getPendingKyc, approveKyc, rejectKyc, getKycDocuments, getListingsAdmin, suspendListing, deleteListingAdmin, getReviewsAdmin, deleteReviewAdmin, getFeeConfig, updateFeeConfig, addCustomFeeRule, getDisputes, getDisputeDetail, resolveDispute, updateDisputeStatus, getTaxRules, addTaxRule, updateTaxRule, deleteTaxRule, getPlatformPayments, getPaymentDetail, triggerPayout, getAdminPayouts } from "../controllers/admin.dashboard.controller.js";
import { verifyUser } from "../middlewares/authenticate.js";

const router = Router();
router.use(verifyUser); // Admin auth check would go here

// Dashboard/Analytics
router.get("/dashboard", getGeneralDashboard);
router.get("/analytics/revenue", getRevenueAnalytics);
router.get("/analytics/listings", getListingAnalytics);
router.get("/analytics/users", getUserAnalytics);

// Users/Hosts
router.get("/users", getUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/suspend", suspendUser);
router.delete("/users/:id", deleteUser);
router.get("/hosts", getHosts);
router.patch("/hosts/:id/verify", verifyHost);
router.patch("/hosts/:id/suspend", suspendHost);

// KYC
router.get("/kyc/pending", getPendingKyc);
router.patch("/kyc/:userId/approve", approveKyc);
router.patch("/kyc/:userId/reject", rejectKyc);
router.get("/kyc/:userId/documents", getKycDocuments);

// Moderation
router.get("/listings", getListingsAdmin);
router.patch("/listings/:id/suspend", suspendListing);
router.delete("/listings/:id", deleteListingAdmin);
router.get("/reviews", getReviewsAdmin);
router.delete("/reviews/:id", deleteReviewAdmin);

// Configs & Operations
router.get("/fee-config", getFeeConfig);
router.patch("/fee-config", updateFeeConfig);
router.post("/fee-config/rules", addCustomFeeRule);
router.get("/disputes", getDisputes);
router.get("/disputes/:id", getDisputeDetail);
router.post("/disputes/:id/resolve", resolveDispute);
router.patch("/disputes/:id/status", updateDisputeStatus);
router.get("/tax-rules", getTaxRules);
router.post("/tax-rules", addTaxRule);
router.patch("/tax-rules/:id", updateTaxRule);
router.delete("/tax-rules/:id", deleteTaxRule);
router.get("/payments", getPlatformPayments);
router.get("/payments/:id", getPaymentDetail);
router.post("/payouts/trigger", triggerPayout);
router.get("/payouts", getAdminPayouts);

export default router;
      