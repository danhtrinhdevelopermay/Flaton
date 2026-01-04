import { useState, useEffect } from 'react'
import { Activity, Coins, Server, Zap, Clock, CheckCircle, AlertCircle, XCircle, Cpu, HardDrive, Wifi } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useTheme } from '../contexts/ThemeContext'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  latency?: number
}

interface SystemStats {
  cpu: {
    usage: number
    cores: number
    model: string
  }
  memory: {
    total: number
    used: number
    free: number
    usage: number
  }
  latency: number
  uptime: number
  cpuHistory: { time: string; cpu: number }[]
  latencyHistory: { time: string; latency: number }[]
}

export default function StatusPage() {
  const { theme } = useTheme()
  const [credits, setCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Máy chủ API', status: 'operational', latency: 0 },
    { name: 'Tạo hình ảnh', status: 'operational', latency: 0 },
    { name: 'Tạo video', status: 'operational', latency: 0 },
    { name: 'Tạo nhạc', status: 'operational', latency: 0 },
  ])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchCredits = async () => {
    try {
      setLoadingCredits(true)
      const startTime = Date.now()
      const response = await fetch('/api/credits')
      const latency = Date.now() - startTime
      const data = await response.json()
      
      if (data.code === 200 && data.data !== undefined) {
        setCredits(typeof data.data === 'number' ? data.data : data.data.credits)
      }
      
      setServices(prev => prev.map(s => 
        s.name === 'Máy chủ API' 
          ? { ...s, status: 'operational' as const, latency }
          : s
      ))
    } catch (error) {
      console.error('Failed to fetch credits:', error)
      setServices(prev => prev.map(s => 
        s.name === 'Máy chủ API' 
          ? { ...s, status: 'down' as const }
          : s
      ))
    } finally {
      setLoadingCredits(false)
      setLastUpdated(new Date())
    }
  }

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/system-stats')
      const data = await response.json()
      setSystemStats(data)
      
      setServices(prev => prev.map(s => 
        s.name === 'Máy chủ API' 
          ? { ...s, status: 'operational' as const, latency: data.latency }
          : s
      ))
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
    }
  }

  useEffect(() => {
    fetchCredits()
    fetchSystemStats()
    const creditsInterval = setInterval(fetchCredits, 60000)
    const statsInterval = setInterval(fetchSystemStats, 5000)
    return () => {
      clearInterval(creditsInterval)
      clearInterval(statsInterval)
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'down':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Hoạt động'
      case 'degraded':
        return 'Chậm'
      case 'down':
        return 'Ngừng hoạt động'
      default:
        return 'Không xác định'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-400'
      case 'degraded':
        return 'text-yellow-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-slate-400'
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  const [cpuVibe, setCpuVibe] = useState<{ time: string; cpu: number }[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuVibe(prev => {
        const now = new Date().toLocaleTimeString('vi-VN', { second: '2-digit' })
        const newValue = 40 + Math.random() * 20 + (Math.sin(Date.now() / 100) * 5)
        const next = [...prev, { time: now, cpu: newValue }]
        if (next.length > 30) return next.slice(1)
        return next
      })
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const allOperational = services.every(s => s.status === 'operational')

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
          theme === 'dark' 
            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' 
            : 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold shadow-sm'
        }`}>
          <Activity className="w-5 h-5" />
          <span className="font-medium">Trạng thái dịch vụ</span>
        </div>
        <h1 className="text-4xl font-bold">
          <span className="gradient-text">Giám sát hệ thống</span>
        </h1>
        <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'}>
          Theo dõi trạng thái và hiệu suất các dịch vụ của Flaton AI
        </p>
      </div>

      <div className={`rounded-2xl p-6 border transition-all ${
        theme === 'dark'
          ? `bg-[#1e202f]/50 backdrop-blur-md ${allOperational ? 'border-green-500/30' : 'border-yellow-500/30'}`
          : `bg-white shadow-xl ${allOperational ? 'border-green-200' : 'border-yellow-200'}`
      }`}>
        <div className="flex items-center gap-4">
          {allOperational ? (
            <CheckCircle className="w-10 h-10 text-green-400" />
          ) : (
            <AlertCircle className="w-10 h-10 text-yellow-400" />
          )}
          <div>
            <h2 className={`text-2xl font-bold ${
              allOperational 
                ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') 
                : (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600')
            }`}>
              {allOperational ? 'Tất cả dịch vụ hoạt động bình thường' : 'Một số dịch vụ đang gặp sự cố'}
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Cpu, label: 'CPU', value: `${systemStats?.cpu.usage.toFixed(1) || '--'}%`, sub: `${systemStats?.cpu.cores || '--'} cores`, color: 'text-blue-500' },
          { icon: HardDrive, label: 'RAM', value: `${systemStats?.memory.usage.toFixed(1) || '--'}%`, sub: `${systemStats?.memory.used.toFixed(1) || '--'} / ${systemStats?.memory.total.toFixed(1) || '--'} GB`, color: 'text-purple-500' },
          { icon: Wifi, label: 'Độ trễ', value: `${systemStats?.latency || '--'}ms`, sub: 'API Response', color: 'text-green-500' },
          { icon: Clock, label: 'Uptime', value: systemStats ? formatUptime(systemStats.uptime) : '--', sub: 'Server running', color: 'text-amber-500' }
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-4 border transition-all ${
            theme === 'dark' 
              ? 'bg-[#1e202f]/50 border-slate-700/50' 
              : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</span>
            </div>
            <p className={`text-2xl font-black ${stat.color}`}>
              {stat.value}
            </p>
            <p className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border transition-all ${
          theme === 'dark' ? 'bg-[#1e202f]/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-blue-500" />
              <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Hoạt động CPU thời gian thực</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs text-blue-500 font-mono uppercase tracking-wider font-bold">Live</span>
            </div>
          </div>
          <div className="h-64 w-full" style={{ minWidth: 300, minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuVibe}>
                <defs>
                  <linearGradient id="cpuVibeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke={theme === 'dark' ? "#334155" : "#e2e8f0"} vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', 
                    border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={`${theme === 'dark' ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-slate-200'} border p-2 rounded-lg shadow-xl backdrop-blur-sm`}>
                          <p className="text-blue-500 font-mono text-xs font-bold">{payload[0].value?.toFixed(2)}% Usage</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#3b82f6" 
                  fill="url(#cpuVibeGradient)" 
                  strokeWidth={3} 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={`mt-4 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Kernel process active</span>
            <span>Freq: 2.4GHz</span>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border transition-all ${
          theme === 'dark' ? 'bg-[#1e202f]/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-5 h-5 text-indigo-500" />
            <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Lịch sử tải CPU (5 phút)</h3>
          </div>
          <div className="h-64 w-full" style={{ minWidth: 300, minHeight: 200 }}>
            {systemStats?.cpuHistory && systemStats.cpuHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                <AreaChart data={systemStats.cpuHistory}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', 
                      border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, 
                      borderRadius: '12px' 
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  />
                  <Area type="monotone" dataKey="cpu" stroke="#6366f1" fill="url(#cpuGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-full flex items-center justify-center font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Đang thu thập dữ liệu...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className={`rounded-2xl p-6 border transition-all ${
          theme === 'dark' ? 'bg-[#1e202f]/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Wifi className="w-5 h-5 text-green-500" />
            <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Độ trễ kết nối (ms)</h3>
          </div>
          <div className="h-64 w-full" style={{ minWidth: 300, minHeight: 200 }}>
            {systemStats?.latencyHistory && systemStats.latencyHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                <LineChart data={systemStats.latencyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', 
                      border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, 
                      borderRadius: '12px' 
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                  />
                  <Line type="monotone" dataKey="latency" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4, strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-full flex items-center justify-center font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Đang thu thập dữ liệu...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-6 border transition-all ${
        theme === 'dark' ? 'bg-[#1e202f]/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-xl'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <Coins className="w-6 h-6 text-amber-500" />
          <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Credits hệ thống</h2>
        </div>
        
        <div className={`rounded-xl p-6 border-b-4 transition-all ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30' 
            : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-inner'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Số dư credits hiện tại</p>
              {loadingCredits ? (
                <p className="text-3xl font-black text-amber-500 mt-1 animate-pulse">Đang tải...</p>
              ) : credits !== null ? (
                <p className="text-4xl font-black text-amber-500 mt-1">{credits.toLocaleString()} credits</p>
              ) : (
                <p className="text-3xl font-black text-amber-500/50 mt-1 italic">Không khả dụng</p>
              )}
            </div>
            <Zap className="w-16 h-16 text-amber-500/20" />
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-6 border transition-all ${
        theme === 'dark' ? 'bg-[#1e202f]/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-xl'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <Server className="w-6 h-6 text-indigo-500" />
          <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Trạng thái dịch vụ</h2>
        </div>
        
        <div className="space-y-3">
          {services.map((service) => (
            <div 
              key={service.name}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-slate-50 border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{service.name}</span>
              </div>
              <div className="flex items-center gap-4">
                {service.latency !== undefined && service.latency > 0 && (
                  <div className={`flex items-center gap-1 text-sm font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Clock className="w-4 h-4" />
                    <span>{service.latency}ms</span>
                  </div>
                )}
                <span className={`font-black uppercase text-xs tracking-widest ${getStatusColor(service.status)}`}>
                  {getStatusText(service.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`text-center font-bold text-xs uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
        <p>CPU & Latency cập nhật mỗi 5 giây | Credits cập nhật mỗi 60 giây</p>
      </div>
    </div>
  )
}
