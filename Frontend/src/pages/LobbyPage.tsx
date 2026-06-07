import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Mic, MicOff, Video, VideoOff, ArrowRight, ArrowLeft, Settings } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function LobbyPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [deviceError, setDeviceError] = useState(false)

  const title = params.get('title') || 'Meeting'

  useEffect(() => {
    let localStream: MediaStream | null = null

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(s => {
        localStream = s
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => setDeviceError(true))

    return () => {
      localStream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const toggleMic = () => {
    stream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicOn(p => !p)
  }

  const toggleCam = () => {
    stream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOn(p => !p)
  }

  const joinMeeting = () => {
    stream?.getTracks().forEach(t => t.stop())
    navigate(`/room/${roomId}?title=${encodeURIComponent(title)}`)
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen dark:bg-surface-dark bg-surface-light flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl animate-slide-up">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-secondary hover:text-primary text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Video preview */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-surface-dark-3 aspect-video shadow-2xl">
              {camOn && !deviceError ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-24 h-24 participant-avatar text-2xl font-bold">
                    {getInitials(user?.name || 'U')}
                  </div>
                </div>
              )}

              {/* Controls overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={toggleMic}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    micOn
                      ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleCam}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    camOn && !deviceError
                      ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {camOn && !deviceError ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm transition-all shadow-lg">
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Status badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {!micOn && (
                  <span className="px-2 py-1 rounded-lg bg-red-500/80 text-white text-xs font-medium backdrop-blur-sm">
                    Mic off
                  </span>
                )}
                {(!camOn || deviceError) && (
                  <span className="px-2 py-1 rounded-lg bg-red-500/80 text-white text-xs font-medium backdrop-blur-sm">
                    Camera off
                  </span>
                )}
              </div>
            </div>

            {deviceError && (
              <p className="text-xs text-amber-500 text-center">
                ⚠️ Could not access camera/microphone. Check browser permissions.
              </p>
            )}
          </div>

          {/* Join info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-1">Ready to join</p>
              <h1 className="font-display font-bold text-3xl text-primary">{title}</h1>
              <p className="text-secondary mt-2">
                You're about to join as <span className="text-primary font-medium">{user?.name}</span>
              </p>
            </div>

            <div className="card p-4 space-y-3">
              <p className="text-xs font-semibold text-tertiary uppercase tracking-wide">Meeting details</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Meeting ID</span>
                <code className="font-mono text-primary bg-tertiary px-2 py-0.5 rounded-md text-xs">
                  {roomId}
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Microphone</span>
                <span className={micOn ? 'text-green-500' : 'text-red-500'}>
                  {micOn ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Camera</span>
                <span className={camOn && !deviceError ? 'text-green-500' : 'text-red-500'}>
                  {camOn && !deviceError ? 'On' : 'Off'}
                </span>
              </div>
            </div>

            <button
              onClick={joinMeeting}
              className="btn-primary w-full justify-center py-3.5 text-base gap-2"
            >
              Join meeting <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-xs text-tertiary text-center">
              By joining, you agree to IntellMeet's terms of service
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
