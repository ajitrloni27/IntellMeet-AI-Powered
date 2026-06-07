import { useEffect, useRef } from 'react'
import { MicOff, VideoOff, Pin } from 'lucide-react'

interface VideoTileProps {
  stream?: MediaStream | null
  name: string
  muted?: boolean
  isCamOn?: boolean
  isMicOn?: boolean
  isLocal?: boolean
  isPinned?: boolean
  onPin?: () => void
  size?: 'sm' | 'md' | 'lg' | 'full'
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name: string) {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-amber-500',
    'from-red-500 to-rose-500',
    'from-indigo-500 to-violet-500',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export default function VideoTile({
  stream,
  name,
  muted = false,
  isCamOn = true,
  isMicOn = true,
  isLocal = false,
  isPinned = false,
  onPin,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  const showVideo = isCamOn && stream && stream.getVideoTracks().some(t => t.enabled)

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-surface-dark-3 group">
      {/* Video element */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          muted={muted}
          playsInline
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''} ${!showVideo ? 'hidden' : ''}`}
        />
      )}

      {/* Avatar fallback */}
      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(name)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
            {getInitials(name)}
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isMicOn && (
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
          <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
            {name}{isLocal ? ' (You)' : ''}
          </span>
        </div>

        {onPin && (
          <button
            onClick={onPin}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-white' : ''}`} />
          </button>
        )}
      </div>

      {/* No cam indicator */}
      {!showVideo && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
            <VideoOff className="w-3 h-3 text-white" />
          </div>
        </div>
      )}

      {/* Speaking ring */}
      {isMicOn && (
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent speaking-ring-container" />
      )}
    </div>
  )
}
