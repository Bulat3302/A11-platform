import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import * as palettesService from "./palettes.service";

export function getPublicPalettes(req: AuthRequest, res: Response, next: NextFunction): void {
  const { search, wcag, hue, page, limit } = req.query as any;
  palettesService.getPublicPalettes({
    search, wcag: wcag ? [].concat(wcag) : undefined, hue: hue ? [].concat(hue) : undefined,
    page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20, userId: req.user?.userId,
  }).then(r => res.json(r)).catch(next);
}

export function getPublicPalette(req: AuthRequest, res: Response, next: NextFunction): void {
  palettesService.getPublicPalette(req.params.id, req.user?.userId).then(p => res.json(p)).catch(next);
}

export function getSimilarPalettes(req: Request, res: Response, next: NextFunction): void {
  palettesService.getSimilarPalettes(req.params.id).then(p => res.json(p)).catch(next);
}

export function toggleLike(req: AuthRequest, res: Response, next: NextFunction): void {
  palettesService.toggleLike(req.user!.userId, req.params.id).then(r => res.json(r)).catch(next);
}

export function addComment(req: AuthRequest, res: Response, next: NextFunction): void {
  palettesService.addComment(req.user!.userId, req.params.id, req.body.text)
    .then(c => res.status(201).json(c)).catch(next);
}

export function createPalette(req: AuthRequest, res: Response, next: NextFunction): void {
  palettesService.createPalette(req.user!.userId, req.body).then(p => res.status(201).json(p)).catch(next);
}

export function getProjectPalettes(req: AuthRequest, res: Response, next: NextFunction): void {
  palettesService.getProjectPalettes(req.user!.userId, req.params.projectId).then(p => res.json(p)).catch(next);
}

export function publishPalette(req: AuthRequest, res: Response, next: NextFunction): void {
  palettesService.publishPalette(req.user!.userId, req.params.id)
    .then(p => res.json({ message: "Palette published", palette: p })).catch(next);
}

export function deletePalette(req: AuthRequest, res: Response, next: NextFunction): void {
  palettesService.deletePalette(req.user!.userId, req.params.id)
    .then(() => res.json({ message: "Palette deleted" })).catch(next);
}

