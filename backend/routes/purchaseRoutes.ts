import express from "express";
import { 
    createPurchase,
    getAllPurchases, 
    deletePurchase,
} from "../controllers/purchaseController";

const router = express.Router();

router.post('/purchases', createPurchase);
router.get('/purchases', getAllPurchases);
router.delete('/purchases/:transactionHash', deletePurchase);

export default router;