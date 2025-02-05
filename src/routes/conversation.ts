import { Router } from "express";
import {
  getConversations,
  getMessagesByConversationId,
} from "../controllers/conversation.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = Router();

router.get("/", authenticateToken, getConversations);
router.get("/:id/messages", authenticateToken, getMessagesByConversationId);

export default router;
