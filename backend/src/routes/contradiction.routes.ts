import { Router } from "express";

import { listContradictions, updateContradictionStatus } from "../controllers/contradiction.controller";

export const contradictionRoutes = Router();

contradictionRoutes.get("/", listContradictions);
contradictionRoutes.patch("/:id", updateContradictionStatus);
