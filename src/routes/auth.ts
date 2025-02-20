import { Router } from "express";
import { register, login, refreshToken, logout } from "../controllers/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

export default router;
