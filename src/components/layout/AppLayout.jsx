import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { useLanguage } from '../../hooks/useLanguage'
import { signOut } from '../../lib/supabase'
import { Home, CalendarDays, MessageCircle, ChefHat, BookUser,
  Menu, X, Megaphone, Cake, User, ShieldCheck, LogOut, Waves, Sun, Moon, Languages, WashingMachine
} from 'lucide-react'

const LINGUE = [
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
]

export default function AppLayout() {
  const { profile, isModerator } = useAuth()
  const { dark, setDark } = useTheme()
  const { t, lang, changeLang } = useLanguage()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: Home, label: t('home'), exact: true },
    { to: '/programma', icon: CalendarDays, label: t('programma') },
    { to: '/chat', icon: MessageCircle, label: t('chat') },
    { to: '/cucina', icon: ChefHat, label: t('cucina') },
    { to: '/rubrica', icon: BookUser, label: t('rubrica') },
  ]

  const menuLinks = [
  { to: '/profilo', icon: User, label: t('ilMioProfilo') },
  { to: '/annunci', icon: Megaphone, label: t('annunci') },
  { to: '/compleanni', icon: Cake, label: t('compleanni') },
  { to: '/lavatrice', icon: WashingMachine, label: 'Lavatrice' },
  ...(isModerator ? [{ to: '/moderatore', icon: ShieldCheck, label: t('pannelloModeratore') }] : []),
]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 safe-top sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Fun and Sound" className="w-11 h-11 object-contain" />
            <span className="font-bold text-gray-800 dark:text-gray-100 text-base">Fun & Sound</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {dark
                ? <Sun size={20} className="text-yellow-400" />
                : <Moon size={20} className="text-gray-500" />}
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition"
            >
              <Menu size={22} className="text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 main-content page-enter">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 safe-bottom z-30">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                  isActive
                    ? 'text-mare-600 bg-mare-50 dark:bg-mare-900/30'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'
                }`
              }
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Drawer menu laterale */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-gray-800 z-50 shadow-2xl flex flex-col animate-slide-up">
            {/* Header drawer */}
            <div className="bg-gradient-to-br from-mare-500 to-corallo-500 px-6 py-8 safe-top">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <User size={28} className="text-white" />
                </div>
                <button onClick={() => setMenuOpen(false)} className="p-2 text-white/80 hover:text-white">
                  <X size={22} />
                </button>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">
                {profile?.nome} {profile?.cognome}
              </h3>
              <p className="text-mare-100 text-sm mt-0.5">{profile?.ruolo}</p>
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
                      isActive
                        ? 'text-mare-600 bg-mare-50 dark:bg-mare-900/30 dark:text-mare-300'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon size={20} />
                  {label}
                </NavLink>
              ))}

              {/* Selettore lingua */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 mt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('lingua')}
                </p>
                <div className="flex gap-2">
                  {LINGUE.map(({ code, flag, label }) => (
                    <button
                      key={code}
                      onClick={() => changeLang(code)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold transition ${
                        lang === code
                          ? 'bg-mare-500 text-white shadow'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-lg">{flag}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-4 safe-bottom">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition font-medium"
              >
                <LogOut size={20} />
                {t('esci')}
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}