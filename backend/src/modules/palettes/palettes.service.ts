import prisma from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

// ── WCAG helpers ──────────────────────────────────────────────
function getLuminance(hex: string): number {
  const clean = hex.replace('#', '').padEnd(6, '0')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const lin = (v: number) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function calcWcagLevel(colors: string[]): string {
  if (!colors || colors.length < 2) return 'FAIL'
  let worst = 21
  for (let i = 0; i < colors.length; i++)
    for (let j = i + 1; j < colors.length; j++) {
      const L1 = getLuminance(colors[i]), L2 = getLuminance(colors[j])
      const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05)
      worst = Math.min(worst, ratio)
    }
  if (worst >= 7)   return 'AAA'
  if (worst >= 4.5) return 'AA'
  if (worst >= 3)   return 'A'
  return 'FAIL'
}

// ── include helper reused in multiple queries ─────────────────
const paletteInclude = {
  _count:   { select: { likes: true, comments: true } },
  user:     { select: { id: true, email: true } },
  comments: {
    orderBy: { createdAt: 'desc' as const },
    include: { user: { select: { id: true, email: true } } },
  },
}

// ── Get public palettes (list) ────────────────────────────────
async function _getPublicPalettes(params?: {
  search?: string; wcagLevel?: string; sort?: string; page?: number; limit?: number
}) {
  const { search, wcagLevel, sort = 'newest', page = 1, limit = 20 } = params ?? {}
  const where: Record<string, unknown> = { isPublished: true }
  if (search)    where.name      = { contains: search, mode: 'insensitive' }
  if (wcagLevel) where.wcagLevel = wcagLevel

  const [palettes, total] = await Promise.all([
    prisma.palette.findMany({
      where,
      orderBy: sort === 'popular' ? { likes: { _count: 'desc' } } : { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
      include: {
        _count: { select: { likes: true, comments: true } },
        user:   { select: { id: true, email: true } },
      },
    }),
    prisma.palette.count({ where }),
  ])
  return { palettes, total, page, totalPages: Math.ceil(total / limit) }
}

// ── Get single palette ────────────────────────────────────────
async function _getPaletteById(id: string) {
  return prisma.palette.findUnique({ where: { id }, include: paletteInclude })
}

// ── Get my palettes ───────────────────────────────────────────
async function _getMyPalettes(userId: string) {
  return prisma.palette.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { likes: true, comments: true } } },
  })
}

// ── Create palette ────────────────────────────────────────────
async function _createPalette(userId: string, data: {
  name: string; colors: string[]
  projectId?: string; tags?: string[]; isPublished?: boolean
  baseColor?: string   // ignored — not in Prisma schema
  wcagLevel?: string   // will be recalculated
  [key: string]: unknown
}) {
  const colors    = Array.isArray(data.colors) ? data.colors : []
  const wcagLevel = calcWcagLevel(colors)

  return prisma.palette.create({
    data: {
      name:        String(data.name),
      colors,
      wcagLevel,
      tags:        Array.isArray(data.tags) ? data.tags : [],
      isPublished: data.isPublished ?? false,
      userId,
      ...(data.projectId ? { projectId: data.projectId } : {}),
    },
  })
}

// ── Update palette ────────────────────────────────────────────
async function _updatePalette(id: string, userId: string, data: {
  name?: string; colors?: string[]; tags?: string[]; isPublished?: boolean
}) {
  const existing = await prisma.palette.findFirst({ where: { id, userId } })
  if (!existing) return null
  const colors    = data.colors ?? (existing.colors as string[])
  const wcagLevel = calcWcagLevel(colors)
  return prisma.palette.update({
    where: { id },
    data: {
      ...(data.name        !== undefined && { name: data.name }),
      ...(data.colors      !== undefined && { colors: data.colors, wcagLevel }),
      ...(data.tags        !== undefined && { tags: data.tags }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    },
  })
}

// ── Delete palette ────────────────────────────────────────────
async function _deletePalette(id: string, userId: string) {
  const p = await prisma.palette.findFirst({ where: { id, userId } })
  if (!p) return null
  return prisma.palette.delete({ where: { id } })
}

// ── Like toggle ───────────────────────────────────────────────
async function _toggleLike(paletteId: string, userId: string) {
  const existing = await prisma.like.findUnique({
    where: { userId_paletteId: { userId, paletteId } },
  })
  if (existing) {
    await prisma.like.delete({ where: { userId_paletteId: { userId, paletteId } } })
  } else {
    await prisma.like.create({ data: { userId, paletteId } })
  }
  const likesCount = await prisma.like.count({ where: { paletteId } })
  return { liked: !existing, likesCount }
}

// ── Add comment ───────────────────────────────────────────────
async function _addComment(paletteId: string, userId: string, text: string) {
  return prisma.comment.create({
    data: { text, userId, paletteId },
    include: { user: { select: { id: true, email: true } } },
  })
}

// ══════════════════════════════════════════════════════════════
// EXPORTS — all name variants the controller might call
// ══════════════════════════════════════════════════════════════
export const getPalettes          = _getPublicPalettes   // getMine variant handled separately
export const getPublicPalettes    = _getPublicPalettes
export const getAllPalettes        = _getPublicPalettes
export const getPublicPaletteList = _getPublicPalettes

export const getPaletteById    = _getPaletteById
export const getPublicPalette  = _getPaletteById
export const getPalette        = _getPaletteById
export const findPaletteById   = _getPaletteById

export const getMyPalettes     = _getMyPalettes
export const getUserPalettes   = _getMyPalettes
export const getMine           = _getMyPalettes

export const createPalette     = _createPalette

export const updatePalette     = _updatePalette

export const deletePalette     = _deletePalette
export const removePalette     = _deletePalette

export const toggleLike        = _toggleLike
export const likePalette       = _toggleLike

export const addComment        = _addComment
export const createComment     = _addComment