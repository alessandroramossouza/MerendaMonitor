import React from 'react';
import { LayoutDashboard, ShoppingBasket, Utensils, PieChart, BrainCircuit, LogOut, Truck } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  switchRole: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, activeTab, setActiveTab, switchRole }) => {
  const menuItems = currentRole === 'admin'
    ? [
      { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
      { id: 'inventory', label: 'Estoque', icon: ShoppingBasket },
      { id: 'supply', label: 'Entradas', icon: Truck },
      { id: 'insights', label: 'IA Insights', icon: BrainCircuit },
    ]
    : [
      { id: 'daily-log', label: 'Registro Diário', icon: Utensils },
    ];

  return (
    <div className="w-64 bg-emerald-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 border-b border-emerald-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Utensils className="w-8 h-8 text-emerald-400" />
          MerendaMonitor
        </h1>
        <p className="text-xs text-emerald-300 mt-2 uppercase tracking-wider font-semibold">
          {currentRole === 'admin' ? 'Administrador' : 'Cozinha'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-emerald-100 hover:bg-emerald-800'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-emerald-800">
        <button
          onClick={switchRole}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-950 rounded-lg hover:bg-black/20 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Trocar Perfil (Demo)
        </button>
      </div>
    </div>
  );
};