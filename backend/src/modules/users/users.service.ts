import bcrypt from "bcryptjs";
import prisma from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, createdAt: true } });
  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
  return user;
}

export async function updateEmail(userId: string, email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid password", "INVALID_PASSWORD");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, "Email already in use", "EMAIL_TAKEN");
  return prisma.user.update({ where: { id: userId }, data: { email }, select: { id: true, email: true, createdAt: true } });
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid current password", "INVALID_PASSWORD");
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid password", "INVALID_PASSWORD");
  await prisma.user.delete({ where: { id: userId } });
}
