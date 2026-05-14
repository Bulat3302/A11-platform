import prisma from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

// ── Get all projects ──────────────────────────────────────────
async function _getProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { simulations: true } },
    },
  })
}

// ── Get one project ───────────────────────────────────────────
async function _getProjectById(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { id, userId },
    include: {
      simulations: { orderBy: { createdAt: 'desc' } },
    },
  })
}

// ── Create project ────────────────────────────────────────────
// Handles both:
//   createProject(userId, "name", "desc")
//   createProject(userId, { name, description })
async function _createProject(
  userId: string,
  nameOrData: string | { name: string; description?: string },
  description?: string
) {
  const name = typeof nameOrData === 'object' ? nameOrData.name : nameOrData
  const desc = typeof nameOrData === 'object' ? nameOrData.description : description

  return prisma.project.create({
    data: {
      name:        String(name),
      description: desc ?? null,
      userId,
    },
  })
}

// ── Update project ────────────────────────────────────────────
async function _updateProject(
  id: string,
  userId: string,
  name?: string,
  description?: string
) {
  const existing = await prisma.project.findFirst({ where: { id, userId } })
  if (!existing) return null
  return prisma.project.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  })
}

// ── Delete project ────────────────────────────────────────────
async function _deleteProject(id: string, userId: string) {
  const existing = await prisma.project.findFirst({ where: { id, userId } })
  if (!existing) return null
  return prisma.project.delete({ where: { id } })
}

// ══════════════════════════════════════════════════════════════
// EXPORTS — all name variants the controller might call
// ══════════════════════════════════════════════════════════════
export const getProjects       = _getProjects
export const getAllProjects     = _getProjects
export const getUserProjects   = _getProjects

export const getProjectById    = _getProjectById
export const getProject        = _getProjectById
export const findProjectById   = _getProjectById

export const createProject     = _createProject

export const updateProject     = _updateProject

export const deleteProject     = _deleteProject
export const removeProject     = _deleteProject