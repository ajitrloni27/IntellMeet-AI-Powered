import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, X } from 'lucide-react'
import { useSocket } from '../../hooks/useSocket'
import { useAuthStore } from '../../store/authStore'

interface Message {
  id: string
  author: string
  text: string
  ts: number
  isOwn?: boolean
}

interface ChatPanelProps {
  roomId: string
  onClose: () => void
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPanel({ roomId, onClose }: ChatPanelProps) {
  const { user } = useAuthStore()
  const { sendMessage, sendTyping, on, off } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const handleMsg = (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev
        return [...prev, { ...msg, isOwn: msg.author === user?.name }]
      })
    }

    const handleTyping = ({ author, typing }: { author: string; typing: boolean }) => {
      if (author === user?.name) return
      setTypingUsers(prev =>
        typing ? [...prev.filter(u => u !== author), author] : prev.filter(u => u !== author)
      )
    }

    on('chat:message', handleMsg)
    on('chat:typing', handleTyping)
    return () => {
      off('chat:message', handleMsg)
      off('chat:typing', handleTyping)
    }
  }, [on, off, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    sendMessage(roomId, text)
    setInput('')
    sendTyping(roomId, false)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    sendTyping(roomId, true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => sendTyping(roomId, false), 2000)
  }

  return (
    <div className="sidebar-panel animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-default shrink-0">
        <h3 className="font-semibold text-sm text-primary">Meeting chat</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-tertiary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-tertiary flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-tertiary" />
            </div>
            <p className="text-sm font-medium text-secondary">No messages yet</p>
            <p className="text-xs text-tertiary mt-1">Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
            {!msg.isOwn && (
              <div className="w-7 h-7 participant-avatar text-xs shrink-0">
                {getInitials(msg.author)}
              </div>
            )}
            <div className={`max-w-[75%] ${msg.isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              {!msg.isOwn && (
                <span className="text-xs text-tertiary font-medium px-1">{msg.author}</span>
              )}
              <div
                className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.isOwn
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'dark:bg-surface-dark-4 bg-surface-light-3 text-primary rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-xs text-tertiary px-1">{formatTime(msg.ts)}</span>
            </div>
          </div>
        ))}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-tertiary">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="loading-dot w-1.5 h-1.5 rounded-full bg-tertiary"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-default shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Send a message…"
            value={input}
            onChange={handleInput}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="input text-sm py-2 flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center text-white transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
