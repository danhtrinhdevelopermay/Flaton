import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAssistantBot() {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '0',
        role: 'assistant',
        content: 'Xin chào! 👋 Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn:\n\n• 🎨 Tạo hình ảnh (trực tiếp)\n• 🎬 Tạo video (hỗ trợ kế hoạch)\n• 🎵 Tạo nhạc (hỗ trợ kế hoạch)\n• 📊 Tạo PowerPoint\n• 📝 Tạo Word\n• 💬 Trả lời các câu hỏi\n\nChỉ cần nói những gì bạn muốn tạo!',
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.content || errorData.error || 'Lỗi kết nối')
      }

      const data = await response.json()
      let assistantContent = data.content || 'Xin lỗi, không thể xử lý yêu cầu.'

      // If image was generated, show preview
      if (data.type === 'image' && data.imageUrl) {
        assistantContent = `${data.content}\n\n[Hình ảnh đã được tạo]`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      // Handle redirects and actions
      if (data.action === 'redirect-image') {
        setTimeout(() => {
          window.location.href = '/image-generator'
        }, 1000)
      } else if (data.action === 'redirect-video') {
        setTimeout(() => {
          window.location.href = '/video-generator'
        }, 1000)
      } else if (data.action === 'redirect-music') {
        setTimeout(() => {
          window.location.href = '/music-generator'
        }, 1000)
      } else if (data.action === 'redirect-powerpoint') {
        setTimeout(() => {
          window.location.href = '/pptx-generator'
        }, 1000)
      } else if (data.action === 'redirect-word') {
        setTimeout(() => {
          window.location.href = '/word-generator'
        }, 1000)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi không xác định'
      setError(errorMsg)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ ${errorMsg}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[80] w-14 h-14 rounded-full shadow-lg flex items-center justify-center ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
            : 'bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
        }`}
        title="Trợ lý AI"
        animate={{
          scale: isOpen ? 1.1 : 1,
          rotate: isOpen ? 90 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
        whileHover={{ scale: isOpen ? 1.15 : 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
        </motion.div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed inset-0 z-[90] w-full h-full flex flex-col overflow-hidden ${
              theme === 'dark'
                ? 'bg-slate-900'
                : 'bg-white'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
            }}
          >
          {/* Header */}
          <div
            className={`p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold">Trợ lý AI</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-4 ${
              theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
            }`}
          >
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg whitespace-pre-wrap break-words ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : theme === 'dark'
                      ? 'bg-slate-800 text-slate-100 rounded-bl-none'
                      : 'bg-slate-200 text-slate-900 rounded-bl-none'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-slate-100'
                      : 'bg-slate-200 text-slate-900'
                  }`}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className={`p-4 border-t ${
              theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
            }`}
          >
            {error && (
              <div className="mb-2 text-xs text-red-500">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Nhập câu hỏi..."
                disabled={isLoading}
                className={`flex-1 px-3 py-2 rounded-lg outline-none transition-all text-sm ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:border-indigo-500'
                    : 'bg-slate-100 text-slate-900 placeholder-slate-500 border border-slate-300 focus:border-indigo-500'
                } disabled:opacity-50`}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`p-2 rounded-lg transition-all ${
                  isLoading || !input.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
