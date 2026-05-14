import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken;
  if (!token) { res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" }); return; }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: "INVALID_TOKEN", message: "Invalid or expired token" });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken;
  if (token) { try { req.user = verifyAccessToken(token); } catch {} }
  next();
}
