import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Terminal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
  ];

  return (
    <aside className="w-64 bg-[#161c2a]/60 border-r border-gray-800 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-md">
      {/* Header Logo */}
      <div>
        <div className="p-6 border-b border-gray-850 flex items-center gap-3">
          <div className="p-2 bg-teal-950 text-accentTeal rounded-xl border border-teal-800">
            <Terminal size={22} className="text-glow" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              ArchitectAI
            </h1>
            <span className="text-xs text-gray-500 font-medium">Architecture Copilot</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-205 ${
                  isActive
                    ? 'bg-teal-950/40 text-accentTeal border border-teal-900/60'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/40 border border-transparent'
                }`
              }
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-gray-850 space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-accentNavy border border-teal-900/50 flex items-center justify-center font-semibold text-accentTeal uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-gray-200 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/20 hover:bg-rose-950/20 text-gray-400 hover:text-rose-300 rounded-xl text-xs font-medium border border-gray-800 hover:border-rose-900/40 transition-all"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
