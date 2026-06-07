import { useState, useRef } from 'react'
import { X, Mic, FileText, Sparkles, Square, Download, Copy, CheckCircle } from 'lucide-react'
import { aiApi } from '../../api/client'

interface AIPanel {
  onClose: () => void
}

interface ActionItem {
  task: string
  owner: string
  priority: 'High' | 'Medium' | 'Low'
  dueDate: string
}

interface Summary {
  summary: string
  actionItems: ActionItem[]
  confidenceScore: number
}

const PRIORITY_COLORS = {
  High: 'bg-red-500/15 text-red-400',
  Medium: 'bg-amber-500/15 text-amber-400',
  Low: 'bg-green-500/15 text-green-400',
}

export default function AIPanel({ onClose }: AIPanel) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState<'transcribe' | 'summary' | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunks.current = []

      mr.ondataavailable = (e) => chunks.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
        await transcribeAudio(file)
      }

      mr.start()
      mediaRecorder.current = mr
      setIsRecording(true)
      setError('')
    } catch (err) {
      setError('Could not access microphone')
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  const transcribeAudio = async (file: File) => {
    setLoading('transcribe')
    try {
      const { data } = await aiApi.transcribe(file)
      setTranscript(data.text)
    } catch {
      setError('Transcription failed. Ensure backend is running.')
    } finally {
      setLoading(null)
    }
  }

  const generateSummary = async () => {
    if (!transcript.trim()) return
    setLoading('summary')
    setSummary(null)
    try {
      const { data } = await aiApi.summary(transcript)
      setSummary(data)
    } catch {
      setError('Summary generation failed.')
    } finally {
      setLoading(null)
    }
  }

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadSummary = () => {
    if (!summary) return
    const text = [
      '# Meeting Summary',
      '',
      summary.summary,
      '',
      '## Action Items',
      ...summary.actionItems.map(a =>
        `- [${a.priority}] ${a.task} (Owner: ${a.owner}, Due: ${a.dueDate})`
      )
    ].join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'meeting-summary.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="sidebar-panel animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-default shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h3 className="font-semibold text-sm text-primary">AI Intelligence</h3>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-tertiary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Recording */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-secondary" />
            <h4 className="text-sm font-semibold text-primary">Transcription</h4>
          </div>

          <p className="text-xs text-tertiary">
            Record audio from your meeting to generate a live transcript using Whisper AI.
          </p>

          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={loading !== null}
              className="btn-primary w-full justify-center text-sm py-2 gap-2"
            >
              <Mic className="w-4 h-4" />
              Start recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
            >
              <Square className="w-4 h-4 fill-white" />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Recording…
              </span>
            </button>
          )}

          {loading === 'transcribe' && (
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              Transcribing audio…
            </div>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-secondary" />
                <h4 className="text-sm font-semibold text-primary">Transcript</h4>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyTranscript}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-tertiary transition-colors"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="max-h-32 overflow-y-auto text-xs text-secondary leading-relaxed p-3 rounded-xl bg-tertiary">
              {transcript}
            </div>

            <button
              onClick={generateSummary}
              disabled={loading !== null}
              className="btn-primary w-full justify-center text-sm py-2 gap-2"
            >
              {loading === 'summary' ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate summary
                </>
              )}
            </button>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="space-y-3">
            <div className="card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-primary">Summary</h4>
                <button
                  onClick={downloadSummary}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-tertiary transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-secondary leading-relaxed">{summary.summary}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-tertiary">Confidence:</span>
                <span className="text-xs font-medium text-green-400">
                  {Math.round(summary.confidenceScore * 100)}%
                </span>
              </div>
            </div>

            {summary.actionItems.length > 0 && (
              <div className="card p-4 space-y-3">
                <h4 className="text-sm font-semibold text-primary">Action items</h4>
                <div className="space-y-2">
                  {summary.actionItems.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-tertiary">
                      <div className="shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-brand-400" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs text-primary font-medium leading-relaxed">{item.task}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`badge text-xs px-1.5 py-0.5 rounded-md font-medium ${PRIORITY_COLORS[item.priority]}`}>
                            {item.priority}
                          </span>
                          <span className="text-xs text-tertiary">{item.owner}</span>
                          {item.dueDate && (
                            <span className="text-xs text-tertiary">· {item.dueDate}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
