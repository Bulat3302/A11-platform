import { create } from 'zustand'

interface User { id: string; email: string }

interface AuthState {
  user:   User | null
  token:  string | null
  isAuth: boolean          // ← добавлено, используется в App.tsx и Layout.tsx

  setAuth:  (user: User, token: string) => void
  setToken: (token: string) => void
  logout:   () => void
}

export const useAuthStore = create<AuthState>(set => ({
  user:   null,
  token:  null,
  isAuth: false,

  setAuth: (user, token) => {
    localStorage.setItem('_a11y_token', token)
    localStorage.setItem('_a11y_user', JSON.stringify(user))
    set({ user, token, isAuth: true })
  },

  setToken: token => {
    localStorage.setItem('_a11y_token', token)
    set({ token, isAuth: true })
  },

  logout: () => {
    localStorage.removeItem('_a11y_token')
    localStorage.removeItem('_a11y_user')
    set({ user: null, token: null, isAuth: false })
  },
}))

// Restore session on page reload
try {
  const token = localStorage.getItem('_a11y_token')
  const user  = localStorage.getItem('_a11y_user')
  if (token && user) {
    useAuthStore.setState({
      token,
      user:   JSON.parse(user),
      isAuth: true,
    })
  }
} catch { /* ignore */ }