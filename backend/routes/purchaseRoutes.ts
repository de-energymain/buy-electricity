import express from "express";
import { 
    createPurchase,
    getAllPurchases, 
} from "../controllers/purchaseController";

const router = express.Router();

router.post('/purchases', createPurchase);
router.get('/purchases', getAllPurchases);

export default router;