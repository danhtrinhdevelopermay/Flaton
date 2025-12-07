import { useState, useEffect } from 'react'
import { Activity, Coins, Server, Zap, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  latency?: number
}

export default function StatusPage() {
  const [credits, setCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API Server', status: 'operational', latency: 0 },
    { name: 'Image Generation', status: 'operational', latency: 0 },
    { name: 'Video Generation', status: 'operational', latency: 0 },
    { name: 'Music Generation', status: 'operational', latency: 0 },
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
        s.name === 'API Server' 
          ? { ...s, status: 'operational' as const, latency }
          : s
      ))
    } catch (error) {
      console.error('Failed to fetch credits:', error)
      setServices(prev => prev.map(s => 
        s.name === 'API Server' 
          ? { ...s, status: 'down' as const }
          : s
      ))
    } finally {
      setLoadingCredits(false)
      setLastUpdated(new Date())
    }
  }

  useEffect(() => {
    fetchCredits()
    const interval = setInterval(fetchCredits, 30000)
    return () => clearInterval(interval)
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

  const allOperational = services.every(s => s.status === 'operational')

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
        <p>Trang này tự động cập nhật mỗi 30 giây</p>
      </div>
    </div>
  )
}
