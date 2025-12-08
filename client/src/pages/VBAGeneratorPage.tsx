import { useState, useRef, useEffect } from 'react'
import { FileText, FileSpreadsheet, Presentation, Send, Download, Copy, Check, Loader2, Code, MessageSquare, Trash2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  vbaCode?: string
}

type DocumentType = 'word' | 'excel' | 'powerpoint'

export default function VBAGeneratorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [documentType, setDocumentType] = useState<DocumentType>('excel')
  const [currentVbaCode, setCurrentVbaCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [downloadTitle, setDownloadTitle] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const documentTypes = [
    { type: 'word' as DocumentType, label: 'Word', icon: FileText, color: 'bg-blue-500' },
    { type: 'excel' as DocumentType, label: 'Excel', icon: FileSpreadsheet, color: 'bg-green-500' },
    { type: 'powerpoint' as DocumentType, label: 'PowerPoint', icon: Presentation, color: 'bg-orange-500' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch('/api/vba/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: allMessages })
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          vbaCode: data.extractedCode
        }
        setMessages(prev => [...prev, assistantMessage])
        
        if (data.extractedCode) {
          setCurrentVbaCode(data.extractedCode)
        }
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Xin lỗi, đã xảy ra lỗi: ${error.message}. Vui lòng thử lại.`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateQuick = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/vba/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: input, documentType })
      })

      const data = await response.json()

      if (data.success) {
        setCurrentVbaCode(data.vbaCode)
        
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: `Tạo mã VBA cho ${documentType === 'word' ? 'Word' : documentType === 'excel' ? 'Excel' : 'PowerPoint'}: ${input}`
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Đây là mã VBA cho yêu cầu của bạn:\n\n\`\`\`vba\n${data.vbaCode}\n\`\`\``,
          vbaCode: data.vbaCode
        }
        
        setMessages(prev => [...prev, userMessage, assistantMessage])
        setInput('')
      } else {
        throw new Error(data.error || 'Failed to generate VBA code')
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Xin lỗi, đã xảy ra lỗi: ${error.message}. Vui lòng thử lại.`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!currentVbaCode) return

    try {
      const response = await fetch('/api/vba/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          vbaCode: currentVbaCode, 
          documentType,
          title: downloadTitle || 'VBA Macro'
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const extension = documentType === 'word' ? 'docx' : documentType === 'excel' ? 'xlsx' : 'pptx'
        const filename = `${downloadTitle || 'vba-macro'}.${extension}`
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Download failed')
      }
    } catch (error: any) {
      alert('Lỗi tải file: ' + error.message)
    }
  }

  const handleCopyCode = () => {
    if (!currentVbaCode) return
    navigator.clipboard.writeText(currentVbaCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const clearChat = () => {
    setMessages([])
    setCurrentVbaCode('')
  }

  const formatMessage = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const codeMatch = part.match(/```(?:vba|vb)?\n?([\s\S]*?)```/)
        if (codeMatch) {
          return (
            <pre key={index} className="bg-slate-900 p-4 rounded-lg overflow-x-auto my-2 text-sm font-mono text-green-400">
              {codeMatch[1].trim()}
            </pre>
          )
        }
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="min-h-[80vh] flex flex-col">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          VBA Document Generator
        </h1>
        <p className="text-slate-400">
          Chat với AI để tạo mã VBA và xuất file Word, Excel, PowerPoint
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {documentTypes.map(({ type, label, icon: Icon, color }) => (
          <button
            key={type}
            onClick={() => setDocumentType(type)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              documentType === type
                ? `${color} text-white`
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-4 min-h-[500px]">
        <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <span className="font-medium">Chat với AI</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1 px-3 py-1 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Xóa chat
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 py-12">
                <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Bắt đầu chat để tạo mã VBA!</p>
                <p className="text-sm mt-2">Ví dụ: "Tạo macro đếm số ô có giá trị trong Excel"</p>
              </div>
            )}
            
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-700/50 text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {formatMessage(message.content)}
                  </div>
                  {message.vbaCode && message.role === 'assistant' && (
                    <button
                      onClick={() => setCurrentVbaCode(message.vbaCode!)}
                      className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Code className="w-3 h-3" />
                      Sử dụng code này
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700/50 px-4 py-3 rounded-2xl">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Nhập yêu cầu VBA của bạn..."
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleGenerateQuick}
                disabled={isLoading || !input.trim()}
                className="px-4 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center gap-2"
                title="Tạo code nhanh"
              >
                <Code className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Nút xanh: Tạo code nhanh | Nút tím: Chat để thảo luận
            </p>
          </form>
        </div>

        <div className="w-96 flex flex-col glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-slate-700/50">
            <Code className="w-5 h-5 text-green-400" />
            <span className="font-medium">VBA Code</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {currentVbaCode ? (
              <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap break-words">
                {currentVbaCode}
              </pre>
            ) : (
              <div className="text-center text-slate-500 py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Code VBA sẽ hiển thị ở đây</p>
              </div>
            )}
          </div>

          {currentVbaCode && (
            <div className="p-4 border-t border-slate-700/50 space-y-3">
              <input
                type="text"
                value={downloadTitle}
                onChange={e => setDownloadTitle(e.target.value)}
                placeholder="Tên file (tùy chọn)"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm"
              />
              
              <div className="flex gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Đã copy!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  Tải {documentType === 'word' ? 'Word' : documentType === 'excel' ? 'Excel' : 'PPT'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
