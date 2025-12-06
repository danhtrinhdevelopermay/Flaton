import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Image, Video, Home, Music, History, LogIn, UserPlus, LogOut, User, Coins } from 'lucide-react'
import { ReactNode, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)

  const fetchCredits = async () => {
    try {
      setLoadingCredits(true)
      const response = await fetch('/api/credits')
      const data = await response.json()
      if (data.code === 200 && data.data !== undefined) {
        setCredits(typeof data.data === 'number' ? data.data : data.data.credits)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    } finally {
      setLoadingCredits(false)
    }
  }

  useEffect(() => {
    fetchCredits()
    const interval = setInterval(fetchCredits, 60000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/image-generator', label: 'Tạo hình ảnh', icon: Image },
    { path: '/video-generator', label: 'Tạo video', icon: Video },
    { path: '/music-generator', label: 'Tạo nhạc', icon: Music },
  ]

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-indigo-500" />
                <span className="text-xl font-bold gradient-text">Flaton</span>
              </Link>
              
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                <Coins className="w-4 h-4 text-amber-400" />
                {loadingCredits ? (
                  <span className="text-amber-300 text-sm">...</span>
                ) : credits !== null ? (
                  <span className="text-amber-300 text-sm font-medium">{credits.toLocaleString()} credits</span>
                ) : (
                  <span className="text-amber-300/50 text-sm">--</span>
                )}
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    location.pathname === item.path
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <nav className="md:hidden flex items-center gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`p-2 rounded-lg transition-all ${
                      location.pathname === item.path
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                  </Link>
                ))}
              </nav>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden md:block">{user?.email}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 glass rounded-xl overflow-hidden shadow-xl">
                      <Link
                        to="/history"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-slate-700/50 transition-all"
                      >
                        <History className="w-4 h-4" />
                        Lịch sử tạo
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-700/50 transition-all text-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden md:block">Đăng nhập</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden md:block">Đăng ký</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="glass mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>Powered by <a href="https://kie.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">KIE AI</a></p>
        </div>
      </footer>
    </div>
  )
}
