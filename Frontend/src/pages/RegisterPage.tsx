import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Video, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      if (data.accessToken) {
        setAuth(data.user, data.accessToken)
        navigate('/')
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-surface-dark bg-surface-light p-6">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-primary">IntellMeet</span>
        </div>

        <div>
          <h1 className="font-display font-bold text-3xl text-primary">Create your account</h1>
          <p className="text-secondary mt-2">Join thousands of teams using IntellMeet</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Full name</label>
            <input
              type="text"
              required
              placeholder="Jane Doe"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">Email address</label>
            <input
              type="email"
              required
              placeholder="jane@company.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Create account <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-secondary text-sm">
          Already have an account?{' '}
          <Link to="/login" className="accent-color font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
