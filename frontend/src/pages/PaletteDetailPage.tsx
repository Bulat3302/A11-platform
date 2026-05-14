import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { palettesApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'

const WCAG_BADGE: Record<string, string> = { AAA: 'badge-aaa', AA: 'badge-aa', A: 'badge-a', FAIL: 'badge-fail' }

export default function PaletteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuth } = useAuthStore()
  const [palette, setPalette] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [similar, setSimilar] = useState<any[]>([])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([palettesApi.getOne(id), palettesApi.getSimilar(id)])
      .then(([p, s]) => { setPalette(p.data); setSimilar(s.data) })
      .finally(() => setLoading(false))
  }, [id])

  const handleLike = async () => {
    if (!isAuth || !palette) return
    try {
      const res = await palettesApi.toggleLike(palette.id)
      setPalette((p: any) => ({ ...p, isLiked: res.data.liked, likesCount: res.data.liked ? p.likesCount + 1 : p.likesCount - 1 }))
    } catch {}
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !palette) return
    setPosting(true)
    try {
      const res = await palettesApi.addComment(palette.id, comment)
      setPalette((p: any) => ({ ...p, comments: [res.data, ...p.comments] }))
      setComment('')
    } catch {} finally { setPosting(false) }
  }

  const copyColor = (color: string, idx: number) => {
    navigator.clipboard.writeText(color)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  if (loading) return (
    <div className="py-20 page-container">
      <div className="animate-pulse space-y-4 max-w-2xl">
        <div className="h-32 bg-surface-200 rounded-2xl"/>
        <div className="h-8 bg-surface-200 rounded w-1/2"/>
        <div className="h-4 bg-surface-200 rounded w-1/3"/>
      </div>
    </div>
  )

  if (!palette) return (
    <div className="py-20 page-container text-center text-surface-500">
      Палитра не найдена. <Link to="/library" className="text-primary-600 underline">Назад</Link>
    </div>
  )

  return (
    <div className="py-10">
      <div className="page-container">
        <Link to="/library" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Библиотека
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Color strip */}
            <div className="card overflow-hidden">
              <div className="flex h-32">
                {palette.colors.map((c: string, i: number) => (
                  <div key={i} className="flex-1 relative group" style={{ backgroundColor: c }}>
                    <button onClick={() => copyColor(c, i)}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
                      aria-label={`Скопировать цвет ${c}`}>
                      <span className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded">
                        {copiedIdx === i ? '✓ Скопировано' : c}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-surface-900">{palette.name}</h1>
                  <p className="text-sm text-surface-500 mt-1">от {palette.user?.email?.split('@')[0]}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${WCAG_BADGE[palette.wcagLevel] || 'badge-fail'} text-sm px-3 py-1`}>
                    {palette.wcagLevel}
                  </span>
                  <button onClick={handleLike} disabled={!isAuth}
                    title={isAuth ? (palette.isLiked ? 'Убрать лайк' : 'Лайк') : 'Войди, чтобы лайкать'}
                    aria-label={`${palette.isLiked ? 'Убрать лайк' : 'Поставить лайк'}: ${palette.likesCount}`}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${palette.isLiked ? 'text-red-500' : 'text-surface-400 hover:text-red-400'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24"
                      fill={palette.isLiked ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {palette.likesCount}
                  </button>
                </div>
              </div>
            </div>

            {/* Color swatches */}
            <div className="card p-5">
              <h2 className="font-semibold text-surface-900 mb-4">Цвета</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {palette.colors.map((c: string, i: number) => (
                  <button key={i} onClick={() => copyColor(c, i)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-surface-50 transition-all text-left"
                    aria-label={`Скопировать цвет ${c}`}>
                    <div className="w-10 h-10 rounded-lg shrink-0 border border-black/10" style={{ backgroundColor: c }}
                      aria-hidden="true"/>
                    <div>
                      <p className="text-sm font-mono font-medium text-surface-900">{c}</p>
                      <p className="text-xs text-surface-400">{copiedIdx === i ? '✓ Скопировано' : 'Нажми для копирования'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="card p-5">
              <h2 className="font-semibold text-surface-900 mb-4">
                Комментарии <span className="text-surface-400 font-normal">({palette.comments?.length || 0})</span>
              </h2>
              {isAuth ? (
                <form onSubmit={handleComment} className="flex gap-2 mb-5">
                  <input value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Написать комментарий..."
                    className="input flex-1" aria-label="Текст комментария" />
                  <button type="submit" disabled={posting || !comment.trim()}
                    className="btn-primary shrink-0">
                    {posting ? '...' : 'Отправить'}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-surface-500 mb-4">
                  <Link to="/auth" className="text-primary-600 underline">Войди</Link>, чтобы оставить комментарий
                </p>
              )}
              <div className="space-y-3">
                {palette.comments?.length === 0 && (
                  <p className="text-sm text-surface-400 text-center py-4">Пока нет комментариев</p>
                )}
                {palette.comments?.map((c: any) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0 text-xs font-bold text-primary-700">
                      {c.user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-surface-400 mb-0.5">{c.user?.email?.split('@')[0]}</p>
                      <p className="text-sm text-surface-700">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Tags */}
            {palette.tags?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-surface-900 mb-3">Теги</h2>
                <div className="flex flex-wrap gap-2">
                  {palette.tags.map((t: string) => (
                    <span key={t} className="badge bg-surface-100 text-surface-700">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {/* Similar */}
            {similar.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-surface-900 mb-3">Похожие</h2>
                <div className="space-y-2">
                  {similar.slice(0, 4).map((p: any) => (
                    <Link key={p.id} to={`/library/${p.id}`}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 transition-colors">
                      <div className="flex h-8 rounded-lg overflow-hidden w-20 shrink-0">
                        {p.colors.slice(0, 4).map((c: string, i: number) => (
                          <div key={i} className="flex-1" style={{ backgroundColor: c }} aria-hidden="true"/>
                        ))}
                      </div>
                      <span className="text-sm text-surface-700 font-medium truncate">{p.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}