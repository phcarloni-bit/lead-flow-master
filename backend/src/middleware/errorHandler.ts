// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`Error [${status}]: ${message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
