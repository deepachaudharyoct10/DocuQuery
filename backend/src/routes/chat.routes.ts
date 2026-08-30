import { Router } from "express";

import { askQuestionHandler, getConversationHandler } from "../controllers/chat.controller";

export const chatRoutes = Router();
chatRoutes.post("/", askQuestionHandler);

export const conversationRoutes = Router();
conversationRoutes.get("/:id", getConversationHandler);
