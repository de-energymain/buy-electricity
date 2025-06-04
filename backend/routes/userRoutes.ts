import express from "express";
import {
    createUser,
    getUserByWalletID,
    getAllUsers,
    updatePanelDetails,
    deleteUser,
} from "../controllers/userController";

const router = express.Router();

router.post('/users', createUser);
router.get("/users/:walletId", getUserByWalletID);
router.get("/users", getAllUsers);
router.patch("/users/:walletId/panels", updatePanelDetails);
router.delete("/users/:walletId", deleteUser);

export default router;