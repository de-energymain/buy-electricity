import express from "express";
import {
  createPurchase,
  getAllPurchases,
  deletePurchase,
  getPurchasesByWallet,
  getPurchasesByPlant,
  getPlantCapacityAllocations,
  getUserPlantAllocations,
} from "../controllers/purchaseController";

const router = express.Router();

router.post("/purchases", createPurchase);
router.get("/purchases", getAllPurchases);
router.delete("/purchases/:transactionHash", deletePurchase);
router.get("/purchases/wallet/:walletAddress", getPurchasesByWallet);

// New multi-plant routes
router.get("/purchases/plant/:plantId", getPurchasesByPlant);
router.get("/plants/:plantId/allocations", getPlantCapacityAllocations);
router.get("/users/:walletAddress/allocations", getUserPlantAllocations);

export default router;
