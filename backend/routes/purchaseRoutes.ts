import express from "express";
import { 
    createPurchase,
    getAllPurchases, 
    deletePurchase,
    getPurchasesByWallet
} from "../controllers/purchaseController";

const router = express.Router();

router.post('/purchases', createPurchase);
router.get('/purchases', getAllPurchases);
router.delete('/purchases/:transactionHash', deletePurchase);
router.get('/purchases/wallet/:walletAddress', getPurchasesByWallet);

export default router;