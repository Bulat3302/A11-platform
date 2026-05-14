import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi, palettesApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface Palette {
  id: string
  name: string
  colors: string[]
  wcagLevel: string
  isPublished: boolean
  createdAt: string
  projectId?: string
}

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
}

const LEVEL_CLASS: Record<string, string> = {
  AAA:  'bg-emerald-100 text-emerald-700',
  AA:   'bg-green-100 text-green-700',
  A:    'bg-yellow-100 text-yellow-700',
  FAIL: 'bg-red-100 text-red-700',
}

// ── Inline color picker ───────────────────────────────────────
function PaletteBuilder({
  projectId,
  onSaved,
  onCancel,
}: {
  projectId: string
  onSaved: (p: Palette) => void
  onCancel: () => void
}) {
  const [name,    setName]    = useState('')
  const [colors,  setColors]  = useState(['#3b82f6', '#ffffff'])
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const addColor    = () => { if (colors.length < 8) setColors(c => [...c, '#aabbcc']) }
  const removeColor = (i: number) => { if (colors.length > 2) setColors(c => c.filter((_, x) => x !== i)) }
  const setColor    = (i: number, v: string) => setColors(c => c.map((x, xi) => xi === i ? v : x))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Введите название'); return }
    setLoading(true); setError('')
    try {
      const res = await palettesApi.create({ name: name.trim(), colors, projectId })
      const saved: Palette = res.data
      onSaved(saved)
    } catch {
      setError('Не удалось сохранить палитру')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 mb-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">🎨 Новая палитра</h3>
      <form onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Название палитры"
          className="w-full border rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
          Цвета ({colors.length} / 8)
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 bg-gray-50">
              <input
                type="color"
                value={c}
                onChange={e => setColor(i, e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="text-xs font-mono text-gray-500">{c}</span>
              {colors.length > 2 && (
                <button type="button" onClick={() => removeColor(i)}
                  className="text-gray-300 hover:text-red-400 ml-0.5 text-base leading-none">×</button>
              )}
            </div>
          ))}
          {colors.length < 8 && (
            <button type="button" onClick={addColor}
              className="border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl px-3 py-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors">
              + цвет
            </button>
          )}
        </div>

        {/* Strip preview */}
        <div className="flex h-8 rounded-xl overflow-hidden border mb-4">
          {colors.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
            {loading ? 'Сохраняем...' : '💾 Сохранить'}
          </button>
          <button type="button" onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm">
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function ProjectPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { token }  = useAuthStore()

  const [project,     setProject]     = useState<Project | null>(null)
  const [palettes,    setPalettes]    = useState<Palette[]>([])
  const [loading,     setLoading]     = useState(true)
  const [pageError,   setPageError]   = useState('')
  const [showBuilder, setShowBuilder] = useState(false)

  useEffect(() => {
    if (!token) { navigate('/auth'); return }
    if (!id)    { navigate('/cabinet'); return }
    loadProject()
  }, [id, token])

  async function loadProject() {
    setLoading(true); setPageError('')
    try {
      const res  = await projectsApi.getOne(id!)
      const proj = res.data
      if (!proj) { setPageError('Проект не найден'); return }
      setProject(proj)

      // Load user's palettes and filter by this project
      await loadPalettes()
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 403 || status === 404) setPageError('Проект не найден')
      else setPageError('Ошибка загрузки проекта')
    } finally {
      setLoading(false)
    }
  }

  async function loadPalettes() {
    try {
      const res  = await palettesApi.getMine()
      const data = res.data
      // Normalize response — could be array or { palettes: [] }
      const all: Palette[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.palettes)
          ? data.palettes
          : []
      // Filter to this project
      const mine = all.filter((p: Palette) => p.projectId === id)
      setPalettes(mine)
    } catch {
      setPalettes([])
    }
  }

  const handlePaletteSaved = (p: Palette) => {
    setShowBuilder(false)
    setPalettes(prev => [p, ...prev])
  }

  const handleDelete = async (palId: string) => {
    if (!confirm('Удалить палитру?')) return
    try {
      await palettesApi.remove(palId)
      setPalettes(p => p.filter(x => x.id !== palId))
    } catch { /* ignore */ }
  }

  // ── Renders ───────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )

  if (pageError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-500">
      <div className="text-4xl">😕</div>
      <p className="font-medium text-gray-700">{pageError}</p>
      <button onClick={() => navigate('/cabinet')} className="text-blue-600 hover:underline text-sm">
        ← Вернуться к проектам
      </button>
    </div>
  )

  if (!project) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <button onClick={() => navigate('/cabinet')}
        className="text-sm text-gray-400 hover:text-gray-700 mb-6 flex items-center gap-1 transition-colors">
        ← Мои проекты
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && <p className="text-gray-500 mt-1 text-sm">{project.description}</p>}
          <p className="text-xs text-gray-400 mt-1.5">
            Создан {new Date(project.createdAt).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(b => !b)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-colors">
          + Создать палитру
        </button>
      </div>

      {/* Builder */}
      {showBuilder && (
        <PaletteBuilder
          projectId={id!}
          onSaved={handlePaletteSaved}
          onCancel={() => setShowBuilder(false)}
        />
      )}

      {/* Palettes */}
      {palettes.length === 0 && !showBuilder ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="text-5xl mb-3">🎨</div>
          <p className="font-medium text-gray-600">В проекте пока нет палитр</p>
          <p className="text-sm text-gray-400 mt-1">Создай первую палитру для этого проекта</p>
          <button onClick={() => setShowBuilder(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            + Создать палитру
          </button>
        </div>
      ) : palettes.length > 0 && (
        <>
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Палитры проекта <span className="text-gray-400 font-normal">({palettes.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {palettes.map(p => (
              <div key={p.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-14">
                  {p.colors.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">{p.name}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${LEVEL_CLASS[p.wcagLevel] ?? 'bg-gray-100 text-gray-500'}`}>
                      {p.wcagLevel}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2 mb-3">
                    {p.colors.slice(0, 4).map((c, i) => (
                      <span key={i} className="text-xs font-mono bg-gray-50 border rounded px-1.5 py-0.5 text-gray-500">
                        {c}
                      </span>
                    ))}
                    {p.colors.length > 4 && (
                      <span className="text-xs text-gray-400">+{p.colors.length - 4}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/palette/${p.id}`)}
                      className="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium py-1.5 rounded-lg transition-colors">
                      Открыть
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="text-xs text-gray-300 hover:text-red-500 px-2 py-1.5 transition-colors"
                      title="Удалить">🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}