import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'

type Tab = 'login' | 'register'

export default function AuthPage() {
  const navigate  = useNavigate()
  const { setAuth } = useAuthStore()

  const [tab, setTab]               = useState<Tab>('login')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (!email.trim() || !password.trim()) {
      setError('Заполните все поля')
      return
    }
    if (tab === 'register' && password !== confirm) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)
    try {
      let data: { accessToken?: string; token?: string; user?: { id: string; email: string } }

      if (tab === 'login') {
        // Send ONLY email + password as plain strings
        const res = await authApi.login(email.trim(), password)
        data = res.data
      } else {
        // Send email + password + confirmPassword
        const res = await authApi.register(
          email.trim(),
          password,
          confirm
        )
        data = res.data
      }

      const token = data.accessToken ?? data.token ?? ''
      const user  = data.user ?? { id: '', email: email.trim() }

      setAuth(user, token)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(msg ?? (tab === 'login' ? 'Неверный email или пароль' : 'Ошибка регистрации'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
            A
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
          {tab === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          {tab === 'login' ? 'Войди в свой аккаунт' : 'Начни работу с платформой'}
        </p>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            Регистрация
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Повтор пароля</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-red-500 text-sm">⊘</span>
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading
              ? '...'
              : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>

          {tab === 'login' && (
            <p className="text-center text-sm text-blue-600 cursor-pointer hover:underline">
              Забыл пароль?
            </p>
          )}
        </form>
      </div>
    </div>
  )
}