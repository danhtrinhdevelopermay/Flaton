import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Image, Video, Home, Music, History, LogIn, UserPlus, LogOut, User, Coins, Menu, X } from 'lucide-react'
import { ReactNode, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageTransition } from './animations'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNavModal, setShowNavModal] = useState(false)
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

  useEffect(() => {
    setShowNavModal(false)
  }, [location.pathname])

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/image-generator', label: 'Tạo hình ảnh', icon: Image },
    { path: '/video-generator', label: 'Tạo video', icon: Video },
    { path: '/music-generator', label: 'Tạo nhạc', icon: Music },
  ]

  return (
    <div className="min-h-screen">
      <header className="glass fixed top-[7px] left-[7px] right-[7px] z-50 rounded-full shadow-2xl shadow-indigo-500/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-14">
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

            <button
              onClick={() => setShowNavModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-all"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden sm:block">Menu</span>
            </button>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-all"
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
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden md:block">Đăng nhập</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition-all"
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

      {showNavModal && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setShowNavModal(false)}
              className="p-2 text-gray-500 hover:text-gray-800 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex flex-col px-6 pt-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowNavModal(false)}
                className={`py-3 text-2xl font-medium transition-all ${
                  location.pathname === item.path
                    ? 'text-indigo-600'
                    : 'text-gray-900 hover:text-indigo-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      <footer className="glass mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>Powered by <a href="https://facebook.com/danhtrinh.official" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Danh Trình</a></p>
        </div>
      </footer>
    </div>
  )
}
