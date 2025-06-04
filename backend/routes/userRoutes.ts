import express from "express";
import {
    createUser,
    getUserByWalletID,
    getAllUsers,
    updatePanelDetails,
    deleteUser,
    updateUser,
    getUserNotificationPreferences,
    updateNotificationPreferences
} from "../controllers/userController";

const router = express.Router();

// Existing routes
router.post('/users', createUser);
router.get("/users/:walletId", getUserByWalletID);
router.get("/users", getAllUsers);
router.patch("/users/:walletId/panels", updatePanelDetails);
router.delete("/users/:walletId", deleteUser);

// New routes for settings functionality
router.put("/users/:walletAddress", updateUser);
router.get("/users/:walletAddress/notifications", getUserNotificationPreferences);
router.put("/users/:walletAddress/notifications", updateNotificationPreferences);

export default router;