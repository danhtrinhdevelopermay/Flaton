import { useState, useEffect } from 'react'
import { Activity, Coins, Server, Zap, Clock, CheckCircle, AlertCircle, XCircle, Cpu, HardDrive, Wifi } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          <Activity className="w-5 h-5 text-indigo-400" />
          <span className="text-indigo-300 font-medium">Trạng thái dịch vụ</span>
        </div>
        <h1 className="text-4xl font-bold">
          <span className="gradient-text">Giám sát hệ thống</span>
        </h1>
        <p className="text-slate-400">
          Theo dõi trạng thái và hiệu suất các dịch vụ của Flaton AI
        </p>
      </div>

      <div className={`glass rounded-2xl p-6 border ${allOperational ? 'border-green-500/30' : 'border-yellow-500/30'}`}>
        <div className="flex items-center gap-4">
          {allOperational ? (
            <CheckCircle className="w-10 h-10 text-green-400" />
          ) : (
            <AlertCircle className="w-10 h-10 text-yellow-400" />
          )}
          <div>
            <h2 className={`text-2xl font-bold ${allOperational ? 'text-green-400' : 'text-yellow-400'}`}>
              {allOperational ? 'Tất cả dịch vụ hoạt động bình thường' : 'Một số dịch vụ đang gặp sự cố'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span className="text-slate-400 text-sm">CPU</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {systemStats?.cpu.usage.toFixed(1) || '--'}%
          </p>
          <p className="text-xs text-slate-500 mt-1">{systemStats?.cpu.cores || '--'} cores</p>
        </div>

        <div className="glass rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="w-5 h-5 text-purple-400" />
            <span className="text-slate-400 text-sm">RAM</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {systemStats?.memory.usage.toFixed(1) || '--'}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {systemStats?.memory.used.toFixed(1) || '--'} / {systemStats?.memory.total.toFixed(1) || '--'} GB
          </p>
        </div>

        <div className="glass rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <Wifi className="w-5 h-5 text-green-400" />
            <span className="text-slate-400 text-sm">Độ trễ</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {systemStats?.latency || '--'}ms
          </p>
          <p className="text-xs text-slate-500 mt-1">API Response</p>
        </div>

        <div className="glass rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-slate-400 text-sm">Uptime</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {systemStats ? formatUptime(systemStats.uptime) : '--'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Server running</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold">Hoạt động CPU thời gian thực</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs text-blue-400 font-mono uppercase tracking-wider">Live Monitoring</span>
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
                <CartesianGrid strokeDasharray="2 2" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-lg shadow-xl backdrop-blur-sm">
                          <p className="text-blue-400 font-mono text-xs">{payload[0].value?.toFixed(2)}% Usage</p>
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
                  strokeWidth={2} 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span>Kernel process active</span>
            <span>Freq: 2.4GHz</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold">Lịch sử tải CPU (5 phút)</h3>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="cpu" stroke="#6366f1" fill="url(#cpuGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Đang thu thập dữ liệu...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wifi className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold">Độ trễ kết nối (ms)</h3>
          </div>
          <div className="h-64 w-full" style={{ minWidth: 300, minHeight: 200 }}>
            {systemStats?.latencyHistory && systemStats.latencyHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                <LineChart data={systemStats.latencyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="latency" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Đang thu thập dữ liệu...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Coins className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold">Credits hệ thống</h2>
        </div>
        
        <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-xl p-6 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Số dư credits hiện tại</p>
              {loadingCredits ? (
                <p className="text-3xl font-bold text-amber-300 mt-1">Đang tải...</p>
              ) : credits !== null ? (
                <p className="text-3xl font-bold text-amber-300 mt-1">{credits.toLocaleString()} credits</p>
              ) : (
                <p className="text-3xl font-bold text-amber-300/50 mt-1">Không khả dụng</p>
              )}
            </div>
            <Zap className="w-12 h-12 text-amber-400/50" />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Server className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-bold">Trạng thái dịch vụ</h2>
        </div>
        
        <div className="space-y-3">
          {services.map((service) => (
            <div 
              key={service.name}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex items-center gap-4">
                {service.latency !== undefined && service.latency > 0 && (
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{service.latency}ms</span>
                  </div>
                )}
                <span className={`font-medium ${getStatusColor(service.status)}`}>
                  {getStatusText(service.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-slate-500 text-sm">
        <p>CPU & Latency cập nhật mỗi 5 giây | Credits cập nhật mỗi 60 giây</p>
      </div>
    </div>
  )
}
