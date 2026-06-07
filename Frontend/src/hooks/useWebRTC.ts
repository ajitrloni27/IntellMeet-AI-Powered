import { useRef, useState, useCallback, useEffect } from 'react'
import { useSocket } from './useSocket'

interface PeerStream {
  socketId: string
  userName: string
  stream: MediaStream
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
}

export const useWebRTC = (roomId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<PeerStream[]>([])
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({})
  const pendingCandidates = useRef<Record<string, RTCIceCandidate[]>>({})
  const { socket, joinRoom, leaveRoom, sendSignal, on, off } = useSocket()

  // Init local media
  const initMedia = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio })
      localStreamRef.current = stream
      setLocalStream(stream)
      return stream
    } catch (err: any) {
      setError('Could not access camera/microphone: ' + err.message)
      const emptyStream = new MediaStream()
      localStreamRef.current = emptyStream
      setLocalStream(emptyStream)
      return emptyStream
    }
  }, [])

  // Create peer connection
  const createPC = useCallback((socketId: string, userName: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnections.current[socketId] = pc

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!)
    })

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal('signal:ice', {
          roomId,
          targetSocketId: socketId,
          candidate: e.candidate
        })
      }
    }

    // Remote stream
    pc.ontrack = (e) => {
      const [remoteStream] = e.streams
      setPeers(prev => {
        const existing = prev.find(p => p.socketId === socketId)
        if (existing) {
          return prev.map(p => p.socketId === socketId ? { ...p, stream: remoteStream } : p)
        }
        return [...prev, { socketId, userName, stream: remoteStream }]
      })
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setPeers(prev => prev.filter(p => p.socketId !== socketId))
        pc.close()
        delete peerConnections.current[socketId]
      }
    }

    // Flush pending candidates
    const pending = pendingCandidates.current[socketId] || []
    pending.forEach(c => pc.addIceCandidate(c))
    delete pendingCandidates.current[socketId]

    return pc
  }, [roomId, sendSignal])

  // Offer to a peer
  const offerTo = useCallback(async (socketId: string, userName: string) => {
    const pc = createPC(socketId, userName)
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendSignal('signal:offer', { roomId, targetSocketId: socketId, offer })
    } catch (err) {
      console.error('Offer failed:', err)
    }
  }, [createPC, roomId, sendSignal])

  // Socket event handlers
  useEffect(() => {
    if (!roomId) return

    const handleParticipants = ({ participants }: { participants: Record<string, string> }) => {
      Object.entries(participants).forEach(([sid, name]) => {
        if (sid !== socket?.id && !peerConnections.current[sid]) {
          offerTo(sid, name)
        }
      })
    }

    const handleUserJoined = ({ socketId, userName }: { socketId: string; userName: string }) => {
      if (socketId !== socket?.id && !peerConnections.current[socketId]) {
        offerTo(socketId, userName)
      }
    }

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      peerConnections.current[socketId]?.close()
      delete peerConnections.current[socketId]
      setPeers(prev => prev.filter(p => p.socketId !== socketId))
    }

    const handleOffer = async ({ fromSocketId, offer }: any) => {
      if (peerConnections.current[fromSocketId]) return
      const pc = createPC(fromSocketId, 'Participant')
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignal('signal:answer', { roomId, targetSocketId: fromSocketId, answer })
      } catch (err) {
        console.error('Answer failed:', err)
      }
    }

    const handleAnswer = async ({ fromSocketId, answer }: any) => {
      const pc = peerConnections.current[fromSocketId]
      if (pc && pc.signalingState !== 'stable') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
        } catch (err) {
          console.error('Set remote answer failed:', err)
        }
      }
    }

    const handleIce = async ({ fromSocketId, candidate }: any) => {
      const pc = peerConnections.current[fromSocketId]
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch {}
      } else {
        if (!pendingCandidates.current[fromSocketId]) {
          pendingCandidates.current[fromSocketId] = []
        }
        pendingCandidates.current[fromSocketId].push(new RTCIceCandidate(candidate))
      }
    }

    on('room:participants', handleParticipants)
    on('user:joined', handleUserJoined)
    on('user:left', handleUserLeft)
    on('signal:offer', handleOffer)
    on('signal:answer', handleAnswer)
    on('signal:ice', handleIce)

    return () => {
      off('room:participants', handleParticipants)
      off('user:joined', handleUserJoined)
      off('user:left', handleUserLeft)
      off('signal:offer', handleOffer)
      off('signal:answer', handleAnswer)
      off('signal:ice', handleIce)
    }
  }, [roomId, socket, offerTo, createPC, sendSignal, on, off])

  // Toggle mic
  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = !t.enabled
    })
    setIsMicOn(prev => !prev)
  }, [])

  // Toggle cam
  const toggleCam = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => {
      t.enabled = !t.enabled
    })
    setIsCamOn(prev => !prev)
  }, [])

  // Screen share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Revert to camera
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        const videoTrack = camStream.getVideoTracks()[0]
        localStreamRef.current?.getVideoTracks().forEach(t => t.stop())
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          sender?.replaceTrack(videoTrack)
        })
        localStreamRef.current = camStream
        setLocalStream(camStream)
        setIsScreenSharing(false)
      } catch {}
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = screenStream.getVideoTracks()[0]
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          sender?.replaceTrack(screenTrack)
        })
        // Replace local video
        const newStream = new MediaStream([
          screenTrack,
          ...(localStreamRef.current?.getAudioTracks() || [])
        ])
        localStreamRef.current = newStream
        setLocalStream(newStream)
        setIsScreenSharing(true)

        screenTrack.onended = () => toggleScreenShare()
      } catch {}
    }
  }, [isScreenSharing])

  // Cleanup
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    Object.values(peerConnections.current).forEach(pc => pc.close())
    peerConnections.current = {}
    setPeers([])
    setLocalStream(null)
    leaveRoom(roomId)
  }, [leaveRoom, roomId])

  return {
    localStream,
    peers,
    isMicOn,
    isCamOn,
    isScreenSharing,
    error,
    initMedia,
    joinRoom,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    cleanup,
  }
}
