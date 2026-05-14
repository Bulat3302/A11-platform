import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { palettesApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface Palette {
  id: string
  name: string
  colors: string[]
  wcagLevel: string
  likesCount: number
  isLiked: boolean
  tags: string[]
  user: { email: string }
}

const WCAG_LEVELS = ['AA', 'AAA', 'A', 'FAIL']
const WCAG_BADGE: Record<string, string> = { AAA: 'badge-aaa', AA: 'badge-aa', A: 'badge-a', FAIL: 'badge-fail' }

export default function LibraryPage() {
  const { isAuth } = useAuthStore()
  const [palettes, setPalettes] = useState<Palette[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [wcagFilter, setWcagFilter] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const res = await palettesApi.getPublic({ search, wcag: wcagFilter.length ? wcagFilter : undefined, page, limit: 12 })
      setPalettes(res.data.palettes)
      setTotalPages(res.data.totalPages)
    } catch {
      setPalettes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, wcagFilter, page])

  const toggleWcag = (level: string) => {
    setPage(1)
    setWcagFilter(f => f.includes(level) ? f.filter(l => l !== level) : [...f, level])
  }

  const handleLike = async (id: string) => {
    if (!isAuth) return
    try {
      await palettesApi.toggleLike(id)
      setPalettes(ps => ps.map(p => p.id === id
        ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
        : p))
    } catch {}
  }

  return (
    <div className="py-10">
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Библиотека палитр</h1>
          <p className="text-surface-500">Доступные цветовые палитры от сообщества</p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="search" placeholder="Поиск палитр..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input pl-9" aria-label="Поиск палитр" />
          </div>
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Фильтр по уровню WCAG">
            <span className="text-sm text-surface-500 shrink-0">WCAG:</span>
            {WCAG_LEVELS.map(l => (
              <button key={l} onClick={() => toggleWcag(l)}
                aria-pressed={wcagFilter.includes(l)}
                className={`badge text-xs cursor-pointer border transition-all ${wcagFilter.includes(l) ? WCAG_BADGE[l] + ' ring-2 ring-offset-1 ring-current' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
                {l}
              </button>
            ))}
            {wcagFilter.length > 0 && (
              <button onClick={() => { setWcagFilter([]); setPage(1) }}
                className="text-xs text-surface-400 hover:text-surface-600 underline">
                Сбросить
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-16 rounded-xl bg-surface-100 mb-3"/>
                <div className="h-4 bg-surface-100 rounded w-3/4 mb-2"/>
                <div className="h-3 bg-surface-100 rounded w-1/2"/>
              </div>
            ))}
          </div>
        ) : palettes.length === 0 ? (
          <div className="text-center py-20 text-surface-400">
            <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p className="text-lg font-medium">Палитры не найдены</p>
            <p className="text-sm mt-1">Попробуй другой поисковый запрос</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {palettes.map(palette => (
              <article key={palette.id} className="card overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                {/* Colors strip */}
                <Link to={`/library/${palette.id}`} aria-label={`Открыть палитру ${palette.name}`}>
                  <div className="flex h-20">
                    {palette.colors.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex-1 transition-transform group-hover:scale-105" style={{ backgroundColor: c }}
                        aria-hidden="true"/>
                    ))}
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link to={`/library/${palette.id}`}
                      className="font-semibold text-surface-900 hover:text-primary-600 transition-colors text-sm leading-tight">
                      {palette.name}
                    </Link>
                    <span className={`badge text-xs shrink-0 ${WCAG_BADGE[palette.wcagLevel] || 'badge-fail'}`}>
                      {palette.wcagLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-400 truncate">
                      {palette.user?.email?.split('@')[0]}
                    </span>
                    <button
                      onClick={() => handleLike(palette.id)}
                      disabled={!isAuth}
                      title={isAuth ? (palette.isLiked ? 'Убрать лайк' : 'Лайк') : 'Войди, чтобы лайкать'}
                      aria-label={`${palette.isLiked ? 'Убрать лайк' : 'Поставить лайк'}: ${palette.likesCount}`}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        palette.isLiked ? 'text-red-500' : 'text-surface-400 hover:text-red-400'
                      } disabled:cursor-not-allowed`}>
                      <svg width="14" height="14" viewBox="0 0 24 24"
                        fill={palette.isLiked ? 'currentColor' : 'none'}
                        stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      {palette.likesCount}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex justify-center gap-2 mt-8" aria-label="Навигация по страницам">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-40" aria-label="Предыдущая страница">
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                aria-label={`Страница ${p}`} aria-current={p === page ? 'page' : undefined}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                  p === page ? 'bg-primary-600 text-white' : 'btn-secondary'
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-secondary text-sm disabled:opacity-40" aria-label="Следующая страница">
              →
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}