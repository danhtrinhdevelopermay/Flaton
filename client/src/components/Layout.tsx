import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Image, Video, Home } from 'lucide-react'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/image-generator', label: 'Tạo hình ảnh', icon: Image },
    { path: '/video-generator', label: 'Tạo video', icon: Video },
  ]

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-500" />
              <span className="text-xl font-bold gradient-text">KIE AI Tools</span>
            </Link>

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
