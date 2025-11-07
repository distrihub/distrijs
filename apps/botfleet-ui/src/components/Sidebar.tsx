import { Bot, Target, Moon, Activity, BookMarked } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/feed', label: 'Feed', icon: Activity },
  { path: '/bots', label: 'Bots', icon: Bot },
  { path: '/campaigns', label: 'Campaigns', icon: Target },
  { path: '/memories', label: 'Memories', icon: BookMarked },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-950 text-slate-100 border-r border-slate-800 flex flex-col">
      <div className="px-6 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold">
              <Bot className="h-6 w-6 text-indigo-400" />
              Bot Fleet
            </div>
            <p className="text-xs text-slate-500 mt-1">Coordinate every autonomous persona.</p>
          </div>
          <button
            className="p-2 rounded-full border border-slate-700 text-slate-400 hover:text-white"
            type="button"
            aria-label="Toggle theme"
          >
            <Moon className="h-4 w-4" />
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
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="px-6 py-6 border-t border-slate-800 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">Workspace</p>
        <p>studio@botfleet</p>
      </div>
    </aside>
  )
}
