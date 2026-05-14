import bcrypt from "bcryptjs";
import prisma from "../../config/database";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { AppError } from "../../middleware/errorHandler";

export async function register(data: { email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, "User with this email already exists", "EMAIL_TAKEN");
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({ data: { email: data.email, passwordHash }, select: { id: true, email: true, createdAt: true } });
  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id });
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  return { user, accessToken, refreshToken };
}

export async function login(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id });
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  return { user: { id: user.id, email: user.email, createdAt: user.createdAt }, accessToken, refreshToken };
}

export async function refresh(token: string) {
  const stored = await prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
  if (!stored || stored.expiresAt < new Date()) throw new AppError(401, "Invalid refresh token", "INVALID_TOKEN");
  await prisma.refreshToken.delete({ where: { token } });
  const accessToken = signAccessToken({ userId: stored.user.id, email: stored.user.email });
  const refreshToken = signRefreshToken({ userId: stored.user.id });
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: stored.user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  return { accessToken, refreshToken };
}

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}
