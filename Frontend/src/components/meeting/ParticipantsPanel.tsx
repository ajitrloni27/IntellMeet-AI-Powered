import { useState, useEffect } from 'react'
import { X, Mic, MicOff, Video, VideoOff, Crown } from 'lucide-react'
import { useSocket } from '../../hooks/useSocket'
import { useAuthStore } from '../../store/authStore'

interface Participant {
  socketId: string
  name: string
  isLocal?: boolean
}

interface ParticipantsPanelProps {
  roomId: string
  localName: string
  peers: { socketId: string; userName: string }[]
  onClose: () => void
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function ParticipantsPanel({ roomId, localName, peers, onClose }: ParticipantsPanelProps) {
  const { user } = useAuthStore()
  const { on, off } = useSocket()
  const [remoteParticipants, setRemoteParticipants] = useState<Participant[]>([])

  useEffect(() => {
    setRemoteParticipants(peers.map(p => ({ socketId: p.socketId, name: p.userName })))
  }, [peers])

  useEffect(() => {
    const handleJoined = ({ socketId, userName }: any) => {
      setRemoteParticipants(prev => {
        if (prev.find(p => p.socketId === socketId)) return prev
        return [...prev, { socketId, name: userName }]
      })
    }

    const handleLeft = ({ socketId }: any) => {
      setRemoteParticipants(prev => prev.filter(p => p.socketId !== socketId))
    }

    on('user:joined', handleJoined)
    on('user:left', handleLeft)
    return () => {
      off('user:joined', handleJoined)
      off('user:left', handleLeft)
    }
  }, [on, off])

  const allParticipants: Participant[] = [
    { socketId: 'local', name: localName, isLocal: true },
    ...remoteParticipants
  ]

  return (
    <div className="sidebar-panel animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-default shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-primary">Participants</h3>
          <span className="badge bg-brand-600/15 text-brand-400 text-xs font-semibold">
            {allParticipants.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-tertiary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {allParticipants.map(p => (
          <div
            key={p.socketId}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-tertiary transition-colors group"
          >
            <div className="w-9 h-9 participant-avatar text-sm shrink-0">
              {getInitials(p.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-primary truncate">
                  {p.name}
                </span>
                {p.isLocal && (
                  <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Host" />
                )}
              </div>
              {p.isLocal && (
                <span className="text-xs text-tertiary">You · Host</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 opacity-60">
              <Mic className="w-3.5 h-3.5 text-secondary" />
              <Video className="w-3.5 h-3.5 text-secondary" />
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-default shrink-0">
        <div className="text-xs text-tertiary text-center">
          Room ID: <code className="font-mono text-secondary">{roomId}</code>
        </div>
      </div>
    </div>
  )
}
