import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Video, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      if (data.accessToken) {
        setAuth(data.user, data.accessToken)
        navigate('/')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex dark:bg-surface-dark bg-surface-light">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden dark:bg-surface-dark-2 bg-brand-600">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">IntellMeet</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white/80 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Meetings
          </div>
          <h2 className="font-display font-bold text-4xl text-white leading-tight">
            Where great ideas<br />come to life
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            HD video conferencing with real-time transcription, AI summaries, and smart action items—all in one place.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: 'Live Transcription', icon: '📝' },
              { label: 'AI Summaries', icon: '🤖' },
              { label: 'Screen Sharing', icon: '🖥️' },
              { label: 'Team Chat', icon: '💬' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-white/80 text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/40 text-sm">
          © 2026 IntellMeet. All rights reserved.
        </div>

        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-primary">IntellMeet</span>
          </div>

          <div>
            <h1 className="font-display font-bold text-3xl text-primary">Welcome back</h1>
            <p className="text-secondary mt-2">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <button type="button" className="text-xs accent-color hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
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
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-secondary text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="accent-color font-medium hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
