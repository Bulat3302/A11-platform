import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import * as usersService from "./users.service";

export function getMe(req: AuthRequest, res: Response, next: NextFunction): void {
  usersService.getMe(req.user!.userId).then(user => res.json(user)).catch(next);
}

export function updateEmail(req: AuthRequest, res: Response, next: NextFunction): void {
  usersService.updateEmail(req.user!.userId, req.body.email, req.body.password)
    .then(user => res.json({ message: "Email updated", user })).catch(next);
}

export function updatePassword(req: AuthRequest, res: Response, next: NextFunction): void {
  usersService.updatePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword)
    .then(() => res.json({ message: "Password updated. Please log in again." })).catch(next);
}

export function deleteAccount(req: AuthRequest, res: Response, next: NextFunction): void {
  usersService.deleteAccount(req.user!.userId, req.body.password)
    .then(() => { res.clearCookie("accessToken"); res.clearCookie("refreshToken"); res.json({ message: "Account deleted" }); })
    .catch(next);
}
