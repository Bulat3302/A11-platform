import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import * as projectsService from "./projects.service";

export function getProjects(req: AuthRequest, res: Response, next: NextFunction): void {
  const { search, sortBy } = req.query as any;
  projectsService.getProjects(req.user!.userId, search, sortBy).then(p => res.json(p)).catch(next);
}

export function createProject(req: AuthRequest, res: Response, next: NextFunction): void {
  projectsService.createProject(req.user!.userId, req.body.name, req.body.description)
    .then(p => res.status(201).json(p)).catch(next);
}

export function getProject(req: AuthRequest, res: Response, next: NextFunction): void {
  projectsService.getProject(req.user!.userId, req.params.id).then(p => res.json(p)).catch(next);
}

export function updateProject(req: AuthRequest, res: Response, next: NextFunction): void {
  projectsService.updateProject(req.user!.userId, req.params.id, req.body).then(p => res.json(p)).catch(next);
}

export function deleteProject(req: AuthRequest, res: Response, next: NextFunction): void {
  projectsService.deleteProject(req.user!.userId, req.params.id).then(() => res.json({ message: "Project deleted" })).catch(next);
}

export function getSimulations(req: AuthRequest, res: Response, next: NextFunction): void {
  projectsService.getSimulations(req.user!.userId, req.params.id).then(s => res.json(s)).catch(next);
}

export function createSimulation(req: AuthRequest, res: Response, next: NextFunction): void {
  projectsService.createSimulation(req.user!.userId, req.params.id, req.body)
    .then(s => res.status(201).json(s)).catch(next);
}
