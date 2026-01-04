import React, { useState } from 'react';
import { ViewState } from './types';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { AdminPage } from './pages/AdminPage';
import { BoxIcon, ShoppingBagIcon, ChartIcon } from './components/Icons';

export default function App() {
  const [view, setView] = useState<ViewState>('inventory');

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
          <div className="pt-4 mt-4 border-t border-slate-800">
            <NavItem
              active={view === 'admin'}
              onClick={() => setView('admin')}
              icon={<ChartIcon />}
              label="Administrador"
            />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center md:text-left">
          <span className="hidden md:inline font-bold text-emerald-400">Versão 2.1 (Debug)</span>
          <div className="mt-2 text-[10px] text-slate-600 font-mono">
            DB: {import.meta.env.VITE_SUPABASE_URL ? 'Linked ✅' : 'Missing ❌'}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          {view === 'inventory' && <InventoryPage />}
          {view === 'sales' && <SalesPage />}
          {view === 'admin' && <AdminPage />}
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