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
  { icon: Presentation, label: 'Tạo Slide', color: 'from-orange-500 to-red-500' },
  { icon: FileText, label: 'Tạo Word', color: 'from-green-500 to-emerald-500' },
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
      } else if (data.action === 'redirect-powerpoint') {
        setTimeout(() => {
          window.location.href = `/pptx-generator?autoPrompt=${encodeURIComponent(data.prompt || '')}`
        }, 1000)
      } else if (data.action === 'redirect-word') {
        setTimeout(() => {
          window.location.href = `/word-generator?autoPrompt=${encodeURIComponent(data.prompt || '')}`
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
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 shadow-2xl"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <Brain className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold">Flaton AI</h2>
                    <p className="text-xs text-white/80">Trợ lý sáng tạo của bạn</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </motion.div>

            {/* Messages Container */}
            <motion.div
              className={`flex-1 overflow-y-auto p-6 space-y-4 ${
                theme === 'dark' ? 'bg-slate-900/50' : 'bg-white/50'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {messages.length === 1 && messages[0].role === 'assistant' && (
                <motion.div
                  className="text-center py-8 space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex gap-4 justify-center flex-wrap">
                    {quickActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <motion.button
                          key={action.label}
                          onClick={() => handleQuickAction(action.label)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${action.color} text-white font-semibold shadow-lg transition-all`}
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs">{action.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm mr-3 flex-shrink-0 mt-2">
                      <Brain className="w-5 h-5" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-xl px-4 py-3 rounded-2xl whitespace-pre-wrap break-words shadow-md backdrop-blur ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none'
                        : theme === 'dark'
                        ? 'bg-slate-800/80 text-slate-100 rounded-bl-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm mr-3 flex-shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl flex items-center gap-2 rounded-bl-none backdrop-blur ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 text-slate-100'
                        : 'bg-white text-slate-900 border border-slate-200'
                    }`}
                  >
                    <motion.div
                      className="flex gap-1"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                    </motion.div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mx-6 mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Section */}
            <motion.form
              onSubmit={handleSendMessage}
              className={`p-6 border-t backdrop-blur ${
                theme === 'dark' ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white/50'
              }`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="flex gap-3">
                <motion.input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Hỏi tôi điều gì..."
                  disabled={isLoading}
                  className={`flex-1 px-4 py-3 rounded-full outline-none transition-all font-medium ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-white placeholder-slate-500 border-2 border-slate-700 focus:border-indigo-500 focus:bg-slate-700'
                      : 'bg-white text-slate-900 placeholder-slate-400 border-2 border-slate-200 focus:border-indigo-500 focus:bg-slate-50'
                  } disabled:opacity-50`}
                  whileFocus={{ scale: 1.02 }}
                />
                <motion.button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={`p-3 rounded-full transition-all font-bold flex items-center justify-center ${
                    isLoading || !input.trim()
                      ? 'opacity-50 cursor-not-allowed bg-slate-400'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg'
                  }`}
                  whileHover={!isLoading && input.trim() ? { scale: 1.05 } : {}}
                  whileTap={!isLoading && input.trim() ? { scale: 0.95 } : {}}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
