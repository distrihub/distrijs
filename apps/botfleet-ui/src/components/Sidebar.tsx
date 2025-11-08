import { Bot, Target, Moon, Activity, BookMarked, Sun } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '@/providers/ThemeProvider'

const navItems = [
  { path: '/feed', label: 'Feed', icon: Activity },
  { path: '/bots', label: 'Bots', icon: Bot },
  { path: '/campaigns', label: 'Campaigns', icon: Target },
  { path: '/memories', label: 'Memories', icon: BookMarked },
]

export function Sidebar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="w-64 bg-white text-slate-900 border-r border-slate-200 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800 flex flex-col transition-colors">
      <div className="px-6 pt-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/feed" className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
              <Bot className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
              Bot Fleet
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Coordinate every autonomous persona.</p>
          </div>
          <button
            className="p-2 rounded-full border border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 transition-colors"
            type="button"
            aria-label="Toggle theme"
            aria-pressed={theme === 'dark'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors border ${
                  isActive
                    ? 'bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700'
                    : 'text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="px-6 py-6 border-t border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <p className="font-semibold text-slate-600 dark:text-slate-400">Workspace</p>
        <p>studio@botfleet</p>
      </div>
    </aside>
  )
}
