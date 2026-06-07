import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Video, Plus, Copy, LogOut, Moon, Sun, Calendar,
  Users, Clock, ArrowRight, Hash, Sparkles, CheckCircle
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { meetingApi } from '../api/client'

interface Meeting {
  _id: string
  title: string
  host: string
  participants: string[]
  createdAt?: string
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function generateRoomId() {
  const segments = ['xxx', 'yyy', 'zzz'].map(() =>
    Math.random().toString(36).substring(2, 6)
  )
  return segments.join('-')
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();  const placeholderUser = { name: 'User', email: 'user@example.com' };
  const [joinCode, setJoinCode] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    meetingApi.list()
      .then(({ data }) => setMeetings(data))
      .catch(() => {})
  }, [])

  const createMeeting = async () => {
    if (!newTitle.trim()) return
    setLoading(true)
    try {
      const roomId = generateRoomId()
      await meetingApi.create({
        title: newTitle,
        host: 'Host',
        participants: []
      })
      navigate(`/lobby/${roomId}?title=${encodeURIComponent(newTitle)}`)
    } catch {
      navigate(`/lobby/${generateRoomId()}?title=${encodeURIComponent(newTitle)}`)
    } finally {
      setLoading(false)
    }
  }

  const quickMeet = () => {
    navigate(`/lobby/${generateRoomId()}?title=Quick+Meeting`)
  }

  const joinMeeting = () => {
    const code = joinCode.trim()
    if (code) navigate(`/lobby/${code}`)
  }

  const copyLink = (roomId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)
    setCopied(roomId)
    setTimeout(() => setCopied(null), 2000)
  }

  // logout functionality disabled

  return (
    <div className="min-h-screen dark:bg-surface-dark bg-surface-light">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-default dark:bg-surface-dark/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-primary">IntellMeet</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg border border-default flex items-center justify-center text-secondary hover:text-primary hover:bg-tertiary transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-default">
              <div className="w-8 h-8 participant-avatar text-xs font-bold">
                {getInitials('User')}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-primary">User</p>
                <p className="text-xs text-tertiary">user@example.com</p>
              </div>
            </div>

            {/* Logout button removed as authentication is disabled */}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Hero */}
        <div className="animate-slide-up">
          <h1 className="font-display font-bold text-3xl text-primary">
            Good {getGreeting()}, {placeholderUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-secondary mt-1">What would you like to do today?</p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          {/* New meeting */}
          <div className="card p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-brand-600/15 flex items-center justify-center">
              <Video className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">New meeting</h3>
              <p className="text-sm text-secondary mt-0.5">Start an instant video call</p>
            </div>
            <div className="flex gap-2">
              <button onClick={quickMeet} className="btn-primary flex-1 justify-center text-sm py-2">
                Start now
              </button>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="btn-secondary px-3 py-2"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showCreate && (
              <div className="space-y-2 pt-2 border-t border-default animate-fade-in">
                <input
                  type="text"
                  placeholder="Meeting title"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createMeeting()}
                  className="input text-sm py-2"
                />
                <button
                  onClick={createMeeting}
                  disabled={loading || !newTitle.trim()}
                  className="btn-primary w-full justify-center text-sm py-2"
                >
                  {loading ? 'Creating...' : 'Create & join'}
                </button>
              </div>
            )}
          </div>

          {/* Join meeting */}
          <div className="card p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Hash className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Join meeting</h3>
              <p className="text-sm text-secondary mt-0.5">Enter a meeting code to join</p>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter meeting code"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && joinMeeting()}
                className="input text-sm py-2"
              />
              <button
                onClick={joinMeeting}
                disabled={!joinCode.trim()}
                className="btn-secondary w-full justify-center gap-2"
              >
                Join <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Features */}
          <div className="card p-6 space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-purple-600/5" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600/20 to-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="font-semibold text-primary mt-4">AI Intelligence</h3>
              <p className="text-sm text-secondary mt-0.5">Powered by OpenAI Whisper</p>
              <div className="mt-4 space-y-2">
                {['Live transcription', 'Smart summaries', 'Action item extraction'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-secondary">
                    <CheckCircle className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total meetings', value: meetings.length, icon: Calendar },
            { label: 'Participants', value: meetings.reduce((a, m) => a + m.participants.length, 0), icon: Users },
            { label: 'Hours saved', value: '∞', icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-primary">{value}</p>
                <p className="text-xs text-secondary">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent meetings */}
        {meetings.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display font-semibold text-lg text-primary">Recent meetings</h2>
            <div className="space-y-2">
              {meetings.slice(0, 5).map(meeting => (
                <div
                  key={meeting._id}
                  className="card p-4 flex items-center justify-between group hover:border-brand-500/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center">
                      <Video className="w-4 h-4 text-brand-500" />
                    </div>
                    <div>
                      <p className="font-medium text-primary text-sm">{meeting.title || 'Untitled Meeting'}</p>
                      <p className="text-xs text-tertiary mt-0.5">Hosted by {meeting.host}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyLink(meeting._id)}
                      className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
                    >
                      {copied === meeting._id ? (
                        <><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copied</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy link</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
