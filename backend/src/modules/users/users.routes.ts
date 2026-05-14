import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getMe, updateEmail, updatePassword, deleteAccount } from "./users.controller";

const router = Router();

router.get("/", requireAuth, getMe);
router.patch("/email", requireAuth, updateEmail);
router.patch("/password", requireAuth, updatePassword);
router.delete("/", requireAuth, deleteAccount);

export default router;
