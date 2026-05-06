'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { ChatMessage } from '@/types'

const SUGGESTED_QUESTIONS = [
  '¿Cuánto gasté este mes?',
  '¿En qué estoy gastando más?',
  '¿Cuánto puedo ahorrar este mes?',
  '¿Qué gastos podría reducir?',
  '¿Cómo voy con mi presupuesto?',
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hola, soy Fina, tu asistente financiera. Estoy aquí para ayudarte a entender mejor tus finanzas. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const history = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user' as 'model' | 'user',
    parts: [{ text: m.content }],
  }))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMessage: ChatMessage = { role: 'user', content: text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response ?? 'Lo siento, ocurrió un error. Intenta de nuevo.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Ocurrió un error de conexión. Intenta de nuevo.', timestamp: new Date() },
      ])
    }

    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-4 animate-fade-up shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-[10px] flex items-center justify-center">
            <span className="text-sm font-bold text-[#818CF8]" style={{ fontFamily: 'var(--font-instrument-serif)' }}>F</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#E8E9F0] tracking-tight">Fina</h1>
            <p className="text-xs text-[#6B7280]">Tu asistente financiera personal</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-[#34D399]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
            En línea
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 animate-fade-up animate-fade-up-delay-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-[6px] flex items-center justify-center mr-2 shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-[#818CF8]" style={{ fontFamily: 'var(--font-instrument-serif)' }}>F</span>
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-3 rounded-[12px] text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#6366F1] text-white rounded-tr-[4px]'
                  : 'bg-[#13141A] border border-[#1E2028] text-[#E8E9F0] rounded-tl-[4px]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-[6px] flex items-center justify-center mr-2 shrink-0">
              <span className="text-[10px] font-bold text-[#818CF8]" style={{ fontFamily: 'var(--font-instrument-serif)' }}>F</span>
            </div>
            <div className="bg-[#13141A] border border-[#1E2028] rounded-[12px] rounded-tl-[4px] px-4 py-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 1 && (
        <div className="shrink-0 mb-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-3 py-1.5 bg-[#13141A] border border-[#1E2028] rounded-[6px] text-[#6B7280] hover:text-[#E8E9F0] hover:border-[#6366F1]/40 transition-colors duration-150"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex gap-2 bg-[#13141A] border border-[#1E2028] rounded-[12px] p-2 animate-fade-up"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregúntale algo a Fina..."
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm bg-transparent text-[#E8E9F0] placeholder:text-[#3D4051] outline-none"
        />
        <Button type="submit" disabled={!input.trim() || loading} size="sm">
          Enviar
        </Button>
      </form>
    </div>
  )
}
