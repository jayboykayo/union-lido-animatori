import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../lib/supabase'
import {
  Home, CalendarDays, MessageCircle, ChefHat, BookUser,
  Menu, X, Megaphone, Cake, User, ShieldCheck, LogOut, Waves
} from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/programma', icon: CalendarDays, label: 'Programma' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/cucina', icon: ChefHat, label: 'Cucina' },
  { to: '/rubrica', icon: BookUser, label: 'Rubrica' },
]

export default function AppLayout() {
  const { profile, isModerator } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const menuLinks = [
    { to: '/profilo', icon: User, label: 'Il mio profilo' },
    { to: '/annunci', icon: Megaphone, label: 'Annunci' },
    { to: '/compleanni', icon: Cake, label: 'Compleanni' },
    ...(isModerator ? [{ to: '/moderatore', icon: ShieldCheck, label: 'Pannello moderatore' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 safe-top sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Waves size={22} className="text-mare-500" />
            <span className="font-bold text-gray-800 text-base">Fun & Sound</span>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition"
          >
            <Menu size={22} className="text-gray-700" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 main-content page-enter">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-30">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                  isActive
                    ? 'text-mare-600 bg-mare-50'
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Icon size={22} strokeWidth={isActive => isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Drawer menu laterale */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          {/* Pannello */}
          <aside className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col animate-slide-up">
            {/* Header drawer */}
            <div className="bg-gradient-to-br from-mare-500 to-corallo-500 px-6 py-8 safe-top">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <User size={28} className="text-white" />
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-white/80 hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">
                {profile?.nome} {profile?.cognome}
              </h3>
              <p className="text-mare-100 text-sm mt-0.5">{profile?.tipo_animazione || profile?.ruolo}</p>
            </div>

            {/* Links */}
            <div className="flex-1 py-4 overflow-y-auto">
              {menuLinks.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-6 py-4 text-base font-medium transition ${
                      isActive ? 'text-mare-600 bg-mare-50' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon size={20} />
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 p-4 safe-bottom">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition font-medium"
              >
                <LogOut size={20} />
                Esci
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
