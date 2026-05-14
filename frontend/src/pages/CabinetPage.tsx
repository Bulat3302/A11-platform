import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { palettesApi, projectsApi } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────
interface Palette {
  id: string
  name: string
  colors: string[]
  wcagLevel: string
  isPublished: boolean
  createdAt: string
  _count?: { likes: number; comments: number }
}

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  _count?: { simulations: number }
}

// ── WCAG badge ────────────────────────────────────────────────
const LEVEL_CLASS: Record<string, string> = {
  AAA:  'bg-emerald-100 text-emerald-700',
  AA:   'bg-green-100 text-green-700',
  A:    'bg-yellow-100 text-yellow-700',
  FAIL: 'bg-red-100 text-red-700',
}

export default function CabinetPage() {
  const navigate = useNavigate()
  const { user, logout, isAuth } = useAuthStore()

  const [palettes, setPalettes]   = useState<Palette[]>([])
  const [projects, setProjects]   = useState<Project[]>([])
  const [tab, setTab]             = useState<'palettes' | 'projects'>('palettes')
  const [loading, setLoading]     = useState(true)

  // New project form
  const [showForm,   setShowForm]   = useState(false)
  const [projName,   setProjName]   = useState('')
  const [projDesc,   setProjDesc]   = useState('')
  const [projError,  setProjError]  = useState('')
  const [projLoading,setProjLoading]= useState(false)

  // ── Load data ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuth) { navigate('/auth'); return }
    load()
  }, [isAuth])

  async function load() {
    setLoading(true)
    try {
      const [palRes, projRes] = await Promise.all([
        palettesApi.getMine(),
        projectsApi.getAll(),
      ])
      setPalettes(palRes.data?.palettes ?? palRes.data ?? [])
      setProjects(projRes.data?.projects ?? projRes.data ?? [])
    } catch {
      /* silently fail */
    } finally {
      setLoading(false)
    }
  }

  // ── Create project ───────────────────────────────────────────
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projName.trim()) { setProjError('Введите название'); return }
    setProjError(''); setProjLoading(true)
    try {
      await projectsApi.create(projName.trim(), projDesc.trim() || undefined)
      setProjName(''); setProjDesc(''); setShowForm(false)
      await load()
    } catch {
      setProjError('Не удалось создать проект')
    } finally {
      setProjLoading(false)
    }
  }

  // ── Delete palette ───────────────────────────────────────────
  const handleDeletePalette = async (id: string) => {
    if (!confirm('Удалить палитру?')) return
    try {
      await palettesApi.remove(id)
      setPalettes(p => p.filter(x => x.id !== id))
    } catch { /* ignore */ }
  }

  // ── Delete project ───────────────────────────────────────────
  const handleDeleteProject = async (id: string) => {
    if (!confirm('Удалить проект?')) return
    try {
      await projectsApi.remove(id)
      setProjects(p => p.filter(x => x.id !== id))
    } catch { /* ignore */ }
  }

  const handleLogout = () => { logout(); navigate('/auth') }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Личный кабинет</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-600 border border-red-200 rounded-lg px-4 py-2"
        >
          Выйти
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-6 border-b">
        {([['palettes','🎨 Мои палитры'], ['projects','📁 Мои проекты']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs bg-gray-100 rounded-full px-2 py-0.5">
              {t === 'palettes' ? palettes.length : projects.length}
            </span>
          </button>
        ))}
      </div>

      {/* ════════════ PALETTES TAB ════════════ */}
      {tab === 'palettes' && (
        <>
          {palettes.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">🎨</div>
              <p className="font-medium">Нет сохранённых палитр</p>
              <p className="text-sm mt-1">Создай первую в Конструкторе</p>
              <button
                onClick={() => navigate('/constructor')}
                className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold"
              >
                Открыть конструктор
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {palettes.map(p => (
                <div
                  key={p.id}
                  className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Color strip */}
                  <div className="flex h-16">
                    {p.colors.slice(0, 6).map((c, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${LEVEL_CLASS[p.wcagLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.wcagLevel}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1">
                      {p.colors.length} цвет{p.colors.length === 1 ? '' : p.colors.length < 5 ? 'а' : 'ов'}
                      {p.isPublished ? ' · Опубликована' : ' · Личная'}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => navigate(`/palette/${p.id}`)}
                        className="flex-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium py-1.5 rounded-lg transition-colors"
                      >
                        Открыть
                      </button>
                      <button
                        onClick={() => handleDeletePalette(p.id)}
                        className="text-sm text-red-400 hover:text-red-600 px-2 py-1.5"
                        title="Удалить"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════ PROJECTS TAB ════════════ */}
      {tab === 'projects' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowForm(f => !f)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              + Новый проект
            </button>
          </div>

          {/* New project form */}
          {showForm && (
            <form
              onSubmit={handleCreateProject}
              className="bg-white border rounded-2xl p-5 mb-5 shadow-sm"
            >
              <h3 className="font-semibold mb-3">Новый проект</h3>
              <input
                type="text"
                value={projName}
                onChange={e => setProjName(e.target.value)}
                placeholder="Название проекта"
                className="w-full border rounded-xl px-4 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                value={projDesc}
                onChange={e => setProjDesc(e.target.value)}
                placeholder="Описание (необязательно)"
                className="w-full border rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {projError && <p className="text-red-500 text-sm mb-2">{projError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={projLoading}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                >
                  {projLoading ? '...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setProjError('') }}
                  className="text-gray-500 px-4 py-2 text-sm"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">📁</div>
              <p className="font-medium">Проектов пока нет</p>
              <p className="text-sm mt-1">Создай первый проект для хранения палитр</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map(pr => (
                <div
                  key={pr.id}
                  className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/projects/${pr.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{pr.name}</h3>
                      {pr.description && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{pr.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(pr.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteProject(pr.id) }}
                      className="text-red-400 hover:text-red-600 ml-3 flex-shrink-0"
                      title="Удалить"
                    >
                      🗑
                    </button>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-blue-600 font-medium">
                    Открыть проект →
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}