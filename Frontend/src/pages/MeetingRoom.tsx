import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, Sparkles, Phone, MoreVertical,
  Copy, CheckCircle, Grid, Maximize2, Sun, Moon
} from 'lucide-react'
import { useWebRTC } from '../hooks/useWebRTC'
import { useTheme } from '../context/ThemeContext'
import { useSocket } from '../hooks/useSocket'
import VideoTile from '../components/meeting/VideoTile'
import ChatPanel from '../components/chat/ChatPanel'
import ParticipantsPanel from '../components/meeting/ParticipantsPanel'
import AIPanel from '../components/ai/AIPanel'

type SidePanel = 'chat' | 'participants' | 'ai' | null
type Layout = 'grid' | 'spotlight'

export default function MeetingRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme();
  const placeholderUser = { name: 'User', email: 'user@example.com' };
  const { joinRoom } = useSocket()

  const title = params.get('title') || 'Meeting'
  const room = roomId || 'default'

  const {
    localStream,
    peers,
    isMicOn,
    isCamOn,
    isScreenSharing,
    error,
    initMedia,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    cleanup,
  } = useWebRTC(room)

  const [sidePanel, setSidePanel] = useState<SidePanel>(null)
  const [layout, setLayout] = useState<Layout>('grid')
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [joinTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState('0:00')
  const [unreadCount, setUnreadCount] = useState(0)
  const { on, off } = useSocket()

  // Init on mount
  useEffect(() => {
    initMedia().then(() => {
      joinRoom(room)
    })
    return () => cleanup()
  }, [room])

  // Meeting timer
  useEffect(() => {
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - joinTime) / 1000)
      const m = Math.floor(s / 60)
      const sec = s % 60
      setElapsed(`${m}:${sec.toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(iv)
  }, [joinTime])

  // Track unread
  useEffect(() => {
    const handler = () => {
      if (sidePanel !== 'chat') setUnreadCount(n => n + 1)
    }
    on('chat:message', handler)
    return () => off('chat:message', handler)
  }, [sidePanel, on, off])

  const openPanel = (panel: SidePanel) => {
    setSidePanel(prev => {
      if (prev === panel) return null
      return panel
    })
    if (panel === 'chat') setUnreadCount(0)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${room}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const leaveMeeting = () => {
    cleanup()
    navigate('/')
  }

  // Build all tiles
  const allParticipants = [
    { id: 'local', name: placeholderUser.name, stream: localStream, isLocal: true },
    ...peers.map(p => ({ id: p.socketId, name: p.userName, stream: p.stream, isLocal: false }))
  ]

  const pinnedParticipant = pinnedId
    ? allParticipants.find(p => p.id === pinnedId)
    : null

  const otherParticipants = pinnedId
    ? allParticipants.filter(p => p.id !== pinnedId)
    : allParticipants

  // Grid layout logic
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count <= 4) return 'grid-cols-2'
    if (count <= 6) return 'grid-cols-3'
    return 'grid-cols-4'
  }

  return (
    <div className="h-screen flex flex-col dark:bg-[#111113] bg-[#f0f2f5] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 dark:bg-surface-dark-2/80 bg-white/80 backdrop-blur-md border-b border-default shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono text-secondary">{elapsed}</span>
          </div>
          <div className="h-4 w-px bg-border-default opacity-50" />
          <h1 className="font-display font-semibold text-sm text-primary truncate max-w-48">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-default text-xs font-medium text-secondary hover:text-primary hover:bg-tertiary transition-colors"
          >
            {copied ? (
              <><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copied</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Copy link</>
            )}
          </button>
          <button
            onClick={() => setLayout(l => l === 'grid' ? 'spotlight' : 'grid')}
            className="w-8 h-8 rounded-lg border border-default flex items-center justify-center text-secondary hover:text-primary hover:bg-tertiary transition-colors"
            title="Toggle layout"
          >
            {layout === 'grid' ? <Maximize2 className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg border border-default flex items-center justify-center text-secondary hover:text-primary hover:bg-tertiary transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          {error && (
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-center">
              ⚠️ {error} — using audio only
            </div>
          )}

          {/* Spotlight/Pinned view */}
          {pinnedParticipant && (
            <div className="flex gap-4 flex-1 overflow-hidden">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => setPinnedId(null)}
              >
                <VideoTile
                  stream={pinnedParticipant.stream}
                  name={pinnedParticipant.name}
                  muted={pinnedParticipant.isLocal}
                  isCamOn={pinnedParticipant.isLocal ? isCamOn : true}
                  isMicOn={pinnedParticipant.isLocal ? isMicOn : true}
                  isLocal={pinnedParticipant.isLocal}
                  isPinned
                  onPin={() => setPinnedId(null)}
                />
              </div>
              <div className="flex flex-col gap-3 w-40 overflow-y-auto">
                {otherParticipants.map(p => (
                  <div
                    key={p.id}
                    className="cursor-pointer"
                    style={{ height: '90px' }}
                    onClick={() => setPinnedId(p.id)}
                  >
                    <VideoTile
                      stream={p.stream}
                      name={p.name}
                      muted={p.isLocal}
                      isCamOn={p.isLocal ? isCamOn : true}
                      isMicOn={p.isLocal ? isMicOn : true}
                      isLocal={p.isLocal}
                      onPin={() => setPinnedId(p.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid view */}
          {!pinnedParticipant && (
            <div className={`flex-1 grid ${getGridCols(allParticipants.length)} gap-3 overflow-hidden`}>
              {allParticipants.map(p => (
                <VideoTile
                  key={p.id}
                  stream={p.stream}
                  name={p.name}
                  muted={p.isLocal}
                  isCamOn={p.isLocal ? isCamOn : true}
                  isMicOn={p.isLocal ? isMicOn : true}
                  isLocal={p.isLocal}
                  onPin={() => setPinnedId(p.id)}
                />
              ))}
            </div>
          )}

          {/* Participant count */}
          <div className="flex justify-center">
            <span className="px-3 py-1 rounded-full dark:bg-surface-dark-3 bg-white border border-default text-xs text-secondary font-medium">
              {allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''} · Room: {room}
            </span>
          </div>
        </div>

        {/* Side panels */}
        {sidePanel === 'chat' && (
          <ChatPanel roomId={room} onClose={() => setSidePanel(null)} />
        )}
        {sidePanel === 'participants' && (
          <ParticipantsPanel
            roomId={room}
            localName={user?.name || 'You'}
            peers={peers}
            onClose={() => setSidePanel(null)}
          />
        )}
        {sidePanel === 'ai' && (
          <AIPanel onClose={() => setSidePanel(null)} />
        )}
      </div>

      {/* Control bar */}
      <div className="shrink-0 dark:bg-surface-dark-2 bg-white border-t border-default px-6 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* Left controls */}
          <div className="flex items-center gap-2">
            <ControlButton
              onClick={toggleMic}
              active={isMicOn}
              danger={!isMicOn}
              icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              label={isMicOn ? 'Mute' : 'Unmute'}
            />
            <ControlButton
              onClick={toggleCam}
              active={isCamOn}
              danger={!isCamOn}
              icon={isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              label={isCamOn ? 'Stop video' : 'Start video'}
            />
            <ControlButton
              onClick={toggleScreenShare}
              active={!isScreenSharing}
              icon={isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              label={isScreenSharing ? 'Stop share' : 'Share screen'}
              highlight={isScreenSharing}
            />
          </div>

          {/* Center – end call */}
          <button
            onClick={leaveMeeting}
            className="flex flex-col items-center gap-1 px-6 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-colors shadow-lg shadow-red-500/20"
          >
            <Phone className="w-5 h-5 rotate-[135deg]" />
            <span className="text-xs font-medium">Leave</span>
          </button>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <ControlButton
              onClick={() => openPanel('chat')}
              active={sidePanel !== 'chat'}
              icon={
                <div className="relative">
                  <MessageSquare className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              }
              label="Chat"
              highlight={sidePanel === 'chat'}
            />
            <ControlButton
              onClick={() => openPanel('participants')}
              active={sidePanel !== 'participants'}
              icon={<Users className="w-5 h-5" />}
              label="People"
              highlight={sidePanel === 'participants'}
            />
            <ControlButton
              onClick={() => openPanel('ai')}
              active={sidePanel !== 'ai'}
              icon={<Sparkles className="w-5 h-5" />}
              label="AI"
              highlight={sidePanel === 'ai'}
            />
            <ControlButton
              onClick={() => {}}
              active
              icon={<MoreVertical className="w-5 h-5" />}
              label="More"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface CtrlBtnProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
  active?: boolean
  danger?: boolean
  highlight?: boolean
}

function ControlButton({ onClick, icon, label, active = true, danger, highlight }: CtrlBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all duration-150 min-w-[64px]
        ${danger
          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
          : highlight
          ? 'bg-brand-600/15 text-brand-400 hover:bg-brand-600/25'
          : 'dark:hover:bg-surface-dark-3 hover:bg-gray-100 text-secondary hover:text-primary'
        }
      `}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}
