import { Router } from "express";
import { chat } from "../controllers/chat.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = Router();

router.post("/", authenticateToken, chat);

export default router;
