import React, { useState } from 'react';
import { ViewState } from './types';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { AdminPage } from './pages/AdminPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage, User } from './pages/LoginPage';
import { BoxIcon, ShoppingBagIcon, ChartIcon } from './components/Icons';

// Report Icon
const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Logout Icon
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// User Icon
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function App() {
  const [view, setView] = useState<ViewState>('inventory');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('inventory');
  };

  const handleLogout = () => {
    setUser(null);
    setView('inventory');
  };

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Check if user has access to admin page
  const hasAdminAccess = user.role === 'admin';

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 flex items-center gap-3 font-bold text-xl tracking-tight border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">S</div>
          <span className="hidden md:inline">StyleStock</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            active={view === 'inventory'}
            onClick={() => setView('inventory')}
            icon={<BoxIcon />}
            label="Estoque"
          />
          <NavItem
            active={view === 'sales'}
            onClick={() => setView('sales')}
            icon={<ShoppingBagIcon />}
            label="Vendas"
          />
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
            <NavItem
              active={view === 'reports'}
              onClick={() => setView('reports')}
              icon={<FileTextIcon />}
              label="Relatórios"
            />
            {hasAdminAccess && (
              <NavItem
                active={view === 'admin'}
                onClick={() => setView('admin')}
                icon={<ChartIcon />}
                label="Administrador"
              />
            )}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-600' : 'bg-emerald-600'
              }`}>
              <UserIcon />
            </div>
            <div className="hidden md:block flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className={`text-xs ${user.role === 'admin' ? 'text-purple-400' : 'text-emerald-400'}`}>
                {user.role === 'admin' ? 'Administrador' : 'Vendedor'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center md:justify-start gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
          >
            <LogoutIcon />
            <span className="hidden md:inline">Sair</span>
          </button>

          <div className="mt-3 text-xs text-slate-500 text-center md:text-left">
            <span className="hidden md:inline font-bold text-emerald-400">Versão 2.2</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          {view === 'inventory' && <InventoryPage />}
          {view === 'sales' && <SalesPage />}
          {view === 'reports' && <ReportsPage />}
          {view === 'admin' && hasAdminAccess && <AdminPage />}
        </div>
      </main>
    </div>
  );
}

// Nav Helper Component
const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
      {icon}
    </span>
    <span className="hidden md:inline font-medium">{label}</span>
  </button>
);