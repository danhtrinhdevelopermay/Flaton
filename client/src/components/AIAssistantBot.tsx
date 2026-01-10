import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Sparkles, Zap, Image, Music, FileText, Presentation, Brain } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickActions = [
  { icon: Image, label: 'Tạo hình ảnh', color: 'from-blue-500 to-cyan-500' },
  { icon: Music, label: 'Tạo nhạc', color: 'from-purple-500 to-pink-500' },
  { icon: Brain, label: 'Manus AI Agent', color: 'from-indigo-600 to-blue-600' },
]

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
        content: 'Xin chào! 👋 Tôi là Flaton AI - trợ lý sáng tạo của bạn. Hãy cho tôi biết bạn muốn tạo gì, và tôi sẽ giúp bạn thực hiện điều đó một cách tuyệt vời!',
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen])

  const handleQuickAction = (label: string) => {
    setInput(label)
  }

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

      if (data.action === 'redirect-image') {
        setTimeout(() => {
          window.location.href = `/image-generator?autoPrompt=${encodeURIComponent(data.prompt || '')}`
        }, 1000)
      } else if (data.action === 'redirect-video') {
        setTimeout(() => {
          window.location.href = `/video-generator?autoPrompt=${encodeURIComponent(data.prompt || '')}`
        }, 1000)
      } else if (data.action === 'redirect-music') {
        setTimeout(() => {
          window.location.href = `/music-generator?autoPrompt=${encodeURIComponent(data.prompt || '')}`
        }, 1000)
      } else if (data.action === 'redirect-manus') {
        setTimeout(() => {
          window.location.href = `/manus?autoPrompt=${encodeURIComponent(data.prompt || '')}`
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
        className={`fixed bottom-6 right-6 z-[80] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center group ${
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
        
        {/* Pulse effect */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600"
            animate={{
              scale: [1, 1.3],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed inset-0 z-[90] w-full h-full flex flex-col overflow-hidden ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
                : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
            }}
          >
            {/* Header */}
            <motion.div
              className="bg-[#4D96FF] border-b-8 border-[#3A7EE6] text-white p-8 shadow-2xl"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner transform -rotate-6"
                    animate={{ rotate: [-6, 6, -6] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Brain className="w-8 h-8 text-white drop-shadow-md" />
                  </motion.div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">FLATON AI</h2>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#6BCB77] animate-pulse" />
                      <p className="text-xs font-bold uppercase tracking-widest opacity-80">Online & Ready!</p>
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
                >
                  <X className="w-8 h-8" />
                </motion.button>
              </div>
            </motion.div>

            {/* Messages Container */}
            <motion.div
              className={`flex-1 overflow-y-auto p-8 space-y-6 ${
                theme === 'dark' ? 'bg-[#1e202f]' : 'bg-slate-50'
              }`}
            >
              {messages.length === 1 && messages[0].role === 'assistant' && (
                <div className="grid grid-cols-2 gap-4 pb-8">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <motion.button
                        key={action.label}
                        onClick={() => handleQuickAction(action.label)}
                        className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[1.5rem] bg-white border-b-4 border-slate-200 text-slate-900 font-black shadow-lg transition-all active:translate-y-1 active:border-b-0 hover:border-[#4D96FF] hover:bg-[#4D96FF]/5`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm uppercase tracking-tighter">{action.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-xl bg-[#4D96FF] border-b-4 border-[#3A7EE6] flex items-center justify-center text-white mr-4 flex-shrink-0 mt-1 shadow-md">
                      <Brain className="w-6 h-6" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] px-6 py-4 rounded-[1.5rem] font-bold text-lg shadow-xl ${
                      message.role === 'user'
                        ? 'bg-[#4D96FF] border-b-4 border-[#3A7EE6] text-white rounded-br-none'
                        : theme === 'dark'
                        ? 'bg-[#2a2d3e] border-b-4 border-[#1e202f] text-white rounded-bl-none'
                        : 'bg-white border-b-4 border-slate-200 text-slate-900 rounded-bl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-10 h-10 rounded-xl bg-[#4D96FF] border-b-4 border-[#3A7EE6] flex items-center justify-center text-white mr-4 flex-shrink-0 shadow-md">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div className={`px-6 py-4 rounded-[1.5rem] bg-white border-b-4 border-slate-200 flex items-center gap-2 rounded-bl-none shadow-xl`}>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#4D96FF] animate-bounce" />
                      <div className="w-3 h-3 rounded-full bg-[#FF6B6B] animate-bounce [animation-delay:0.2s]" />
                      <div className="w-3 h-3 rounded-full bg-[#6BCB77] animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>

            {/* Input Section */}
            <motion.form
              onSubmit={handleSendMessage}
              className={`p-8 border-t-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] ${
                theme === 'dark' ? 'border-[#1e202f] bg-[#2a2d3e]' : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex gap-4">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Chat gì đó đi bạn ơi... 🎮"
                  disabled={isLoading}
                  className={`flex-1 px-6 h-16 rounded-2xl font-bold text-lg outline-none transition-all shadow-inner border-4 ${
                    theme === 'dark'
                      ? 'bg-[#1e202f] text-white placeholder-slate-600 border-[#32354a] focus:border-[#4D96FF]'
                      : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-100 focus:border-[#4D96FF]'
                  } disabled:opacity-50`}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={`w-16 h-16 rounded-2xl font-bold flex items-center justify-center transition-all shadow-xl ${
                    isLoading || !input.trim()
                      ? 'opacity-50 cursor-not-allowed bg-slate-400 border-b-4 border-slate-500'
                      : 'bg-[#FF6B6B] border-b-8 border-[#EE5253] text-white hover:translate-y-1 hover:border-b-4 active:translate-y-2 active:border-b-0'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Send className="w-8 h-8" />
                  )}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
