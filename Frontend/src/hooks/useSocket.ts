import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let globalSocket: Socket | null = null

export const useSocket = () => {
  const { user } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      })
    }
    socketRef.current = globalSocket

    return () => {
      // Don't disconnect on unmount – keep persistent connection
    }
  }, [])

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('room:join', {
      roomId,
      userName: user?.name || 'Guest'
    })
  }, [user])

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('room:leave', { roomId })
  }, [])

  const sendMessage = useCallback((roomId: string, text: string) => {
    socketRef.current?.emit('chat:message', {
      roomId,
      author: user?.name || 'Guest',
      text,
      id: crypto.randomUUID(),
    })
  }, [user])

  const sendTyping = useCallback((roomId: string, typing: boolean) => {
    socketRef.current?.emit('chat:typing', {
      roomId,
      author: user?.name || 'Guest',
      typing,
    })
  }, [user])

  const sendSignal = useCallback((event: string, payload: object) => {
    socketRef.current?.emit(event, payload)
  }, [])

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler)
    return () => { socketRef.current?.off(event, handler) }
  }, [])

  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler)
  }, [])

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    sendSignal,
    on,
    off,
    socketId: socketRef.current?.id
  }
}
