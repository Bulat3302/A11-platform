import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "strict" as const,
};

export function register(req: Request, res: Response, next: NextFunction): void {
  authService.register(req.body)
    .then(({ user, accessToken, refreshToken }) => {
      res.cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.status(201).json({ message: "Registration successful", user });
    })
    .catch(next);
}

export function login(req: Request, res: Response, next: NextFunction): void {
  authService.login(req.body)
    .then(({ user, accessToken, refreshToken }) => {
      res.cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ message: "Login successful", user });
    })
    .catch(next);
}

export function refresh(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: "MISSING_TOKEN", message: "Refresh token missing" });
    return;
  }
  authService.refresh(token)
    .then(({ accessToken, refreshToken }) => {
      res.cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ message: "Token refreshed" });
    })
    .catch(next);
}

export function logout(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.refreshToken;
  const p = token ? authService.logout(token) : Promise.resolve();
  p.then(() => {
    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    res.json({ message: "Logged out successfully" });
  }).catch(next);
}

export function forgotPassword(_req: Request, res: Response): void {
  res.json({ message: "If an account with that email exists, a reset link has been sent." });
}