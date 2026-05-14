import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  constructor(public statusCode: number, public message: string, public code?: string) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.code || "APP_ERROR", message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: err.errors.map(e => ({ field: e.path.join("."), message: e.message })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") { res.status(409).json({ error: "CONFLICT", message: "Resource already exists" }); return; }
    if (err.code === "P2025") { res.status(404).json({ error: "NOT_FOUND", message: "Resource not found" }); return; }
  }

  res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Something went wrong." });
}
