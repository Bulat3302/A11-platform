import { Router } from "express";
import { requireAuth, optionalAuth } from "../../middleware/auth";
import { getPublicPalettes, getPublicPalette, getSimilarPalettes, toggleLike, addComment, createPalette, getProjectPalettes, publishPalette, deletePalette } from "./palettes.controller";

const router = Router();

router.get("/", optionalAuth, getPublicPalettes);
router.post("/", requireAuth, createPalette);
router.get("/project/:projectId", requireAuth, getProjectPalettes);
router.get("/:id", optionalAuth, getPublicPalette);
router.get("/:id/similar", getSimilarPalettes);
router.post("/:id/like", requireAuth, toggleLike);
router.post("/:id/comments", requireAuth, addComment);
router.patch("/:id/publish", requireAuth, publishPalette);
router.delete("/:id", requireAuth, deletePalette);

export default router;
