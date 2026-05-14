import axios from 'axios'

const getToken  = (): string | null => localStorage.getItem('_a11y_token')
const saveToken = (t: string)       => localStorage.setItem('_a11y_token', t)
const clearAll  = () => {
  localStorage.removeItem('_a11y_token')
  localStorage.removeItem('_a11y_user')
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const newToken: string = data.accessToken ?? data.token ?? ''
        saveToken(newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        clearAll()
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, confirmPassword?: string) =>
    api.post('/auth/register', { email, password, confirmPassword }),
  logout: () => api.post('/auth/logout'),
  getMe:  () => api.get('/users/me'),
}

// ── Users ─────────────────────────────────────────────────────
export const usersApi = {
  getMe:    () => api.get('/users/me'),
  updateMe: (data: { email?: string; password?: string }) =>
    api.put('/users/me', data),
}
export const userApi = usersApi

// ── Projects ──────────────────────────────────────────────────
export const projectsApi = {
  getAll:  ()                                   => api.get('/projects'),
  getOne:  (id: string)                         => api.get(`/projects/${id}`),
  create:  (name: string, description?: string) => api.post('/projects', { name, description }),
  update:  (id: string, name: string, description?: string) =>
             api.put(`/projects/${id}`, { name, description }),
  remove:  (id: string)                         => api.delete(`/projects/${id}`),
}

// ── Palettes ──────────────────────────────────────────────────
export const palettesApi = {
  // Public list
  getPublic: (params?: {
    search?: string; wcagLevel?: string; sort?: string; page?: number; limit?: number
  }) => api.get('/palettes', { params }),

  // User's own palettes — tries /palettes/my, falls back to /palettes with user filter
  getMine: async () => {
    try {
      return await api.get('/palettes/my')
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      // If /palettes/my doesn't exist (404/400), try /users/me/palettes
      if (status === 404 || status === 400) {
        try {
          return await api.get('/users/me/palettes')
        } catch {
          // Last fallback: return empty so UI doesn't crash
          return { data: [] }
        }
      }
      return { data: [] }
    }
  },

  getOne:  (id: string) => api.get(`/palettes/${id}`),

  create: (data: {
    name: string; colors: string[]
    projectId?: string; tags?: string[]; isPublished?: boolean
  }) => api.post('/palettes', data),

  update: (id: string, data: {
    name?: string; colors?: string[]
    tags?: string[]; isPublished?: boolean
  }) => api.put(`/palettes/${id}`, data),

  remove:     (id: string)               => api.delete(`/palettes/${id}`),
  toggleLike: (id: string)               => api.post(`/palettes/${id}/like`),
  addComment: (id: string, text: string) => api.post(`/palettes/${id}/comments`, { text }),
}

// ── Simulations ───────────────────────────────────────────────
export const simulationsApi = {
  getByProject: (projectId: string) =>
    api.get(`/projects/${projectId}/simulations`),
  create: (projectId: string, data: {
    imageUrl: string; visionType: string; intensity: number; results: object
  }) => api.post(`/projects/${projectId}/simulations`, data),
  remove: (id: string) => api.delete(`/simulations/${id}`),
}

// ── WCAG ──────────────────────────────────────────────────────
export const wcagApi = {
  contrast: (fg: string, bg: string) =>
    api.get('/wcag/contrast', { params: { fg, bg } }),
  fixColor: (color: string, bg: string, target?: 'AA' | 'AAA') =>
    api.get('/wcag/fix-color', { params: { color, bg, target } }),
}

export default api