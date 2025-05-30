import express from "express";
import {
    createUser,
    getAllUsers,
    deleteUser,
} from "../controllers/userController";

const router = express.Router();

router.post('/users', createUser);
router.get("/users", getAllUsers);
router.delete("/users/:walletId", deleteUser);

export default router;