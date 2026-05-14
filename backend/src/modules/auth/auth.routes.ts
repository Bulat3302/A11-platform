import { Router } from "express";
import { validate } from "../../middleware/validate";
import { registerSchema, loginSchema, forgotPasswordSchema } from "./auth.schema";
import { register, login, refresh, logout, forgotPassword } from "./auth.controller";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

export default router;