import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../middleware/errorHandler";
import { ContradictionModel } from "../models/contradiction.model";

export async function listContradictions(req: Request, res: Response, next: NextFunction) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const filter = status ? { status } : {};

    const contradictions = await ContradictionModel.find(filter).sort({ createdAt: -1 });
    res.json({ contradictions });
  } catch (err) {
    next(err);
  }
}

const updateStatusSchema = z.object({
  status: z.enum(["open", "resolved", "false_positive"]),
});

export async function updateContradictionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = updateStatusSchema.parse(req.body);

    const contradiction = await ContradictionModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contradiction) {
      throw new AppError("Contradiction not found", 404);
    }

    res.json({ contradiction });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new AppError(err.issues.map((i) => i.message).join(", "), 400));
      return;
    }
    next(err);
  }
}
