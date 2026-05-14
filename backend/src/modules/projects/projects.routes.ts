import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getProjects, createProject, getProject, updateProject, deleteProject, getSimulations, createSimulation } from "./projects.controller";

const router = Router();

router.get("/", requireAuth, getProjects);
router.post("/", requireAuth, createProject);
router.get("/:id", requireAuth, getProject);
router.patch("/:id", requireAuth, updateProject);
router.delete("/:id", requireAuth, deleteProject);
router.get("/:id/simulations", requireAuth, getSimulations);
router.post("/:id/simulations", requireAuth, createSimulation);

export default router;
