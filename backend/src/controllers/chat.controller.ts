import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../middleware/errorHandler";
import { ConversationModel } from "../models/conversation.model";
import { askQuestion } from "../services/rag.service";

const askQuestionSchema = z.object({
  question: z.string().trim().min(1, "question is required"),
  conversationId: z.string().optional(),
});

export async function askQuestionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { question, conversationId } = askQuestionSchema.parse(req.body);
    const result = await askQuestion(question, conversationId);
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(err.issues.map((i) => i.message).join(", "), 400));
      return;
    }
    next(err);
  }
}

export async function getConversationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const conversation = await ConversationModel.findById(req.params.id);
    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }
    res.json({ conversation });
  } catch (err) {
    next(err);
  }
}
