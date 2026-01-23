import React from 'react';
import { LayoutDashboard, ShoppingBasket, Utensils, PieChart, BrainCircuit, LogOut, Truck, Calculator, FileText, CalendarDays, Trash2, Calendar as CalendarIcon, TrendingUp, Clock, ChefHat, Users, Bell, GraduationCap, School, Briefcase, BookOpen, ClipboardCheck, UserCheck, Building2, ChevronDown, ChevronRight, Boxes } from 'lucide-react';
import { UserRole } from '../types';

import { supabase } from '../services/supabase';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  switchRole: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, activeTab, setActiveTab, switchRole }) => {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    school: true,
    kitchen: true,
    control: true,
    admin: false,
    inventory: true
  });

  const [classrooms, setClassrooms] = React.useState<{ id: string, name: string }[]>([]);

  React.useEffect(() => {
    if (currentRole === 'admin') {
      fetchClassrooms();
    }
  }, [currentRole]);

  const fetchClassrooms = async () => {
    try {
      const { data } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (data) {
        setClassrooms(data);
      }
    } catch (e) {
      console.error('Error loading sidebar classrooms', e);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const menuItems = currentRole === 'admin'
    ? [
      { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, section: 'main' },
      { id: 'notifications', label: 'Notificações', icon: Bell, section: 'main' },

      // GESTÃO ESCOLAR
      { id: 'attendance-dashboard', label: '📊 Presença Hoje', icon: UserCheck, section: 'school' },
      { id: 'attendance-register', label: 'Fazer Chamada', icon: ClipboardCheck, section: 'school' },
      { id: 'students', label: 'Alunos', icon: Users, section: 'school' },
      { id: 'classrooms', label: 'Salas/Turmas', icon: School, section: 'school' },
      // Removed school-assets from here
      { id: 'teachers', label: 'Professores', icon: GraduationCap, section: 'school' },
      { id: 'grades', label: 'Séries', icon: BookOpen, section: 'school' },
      { id: 'staff', label: 'Direção', icon: Briefcase, section: 'school' },
      { id: 'school-info', label: 'Dados da Escola', icon: Building2, section: 'school' },

      // MERENDA
      { id: 'inventory', label: 'Estoque', icon: ShoppingBasket, section: 'kitchen' },
      { id: 'supply', label: 'Entradas', icon: Truck, section: 'kitchen' },
      { id: 'daily-log', label: 'Registro Diário', icon: Utensils, section: 'kitchen' },
      { id: 'waste-tracker', label: 'Desperdícios', icon: Trash2, section: 'kitchen' },
      { id: 'recipe-manager', label: 'Receitas', icon: ChefHat, section: 'kitchen' },
      { id: 'calculator', label: 'Calculadora', icon: Calculator, section: 'kitchen' },
      { id: 'weekly-menu', label: 'Cardápio', icon: CalendarDays, section: 'kitchen' },

      // CONTROLES
      { id: 'school-calendar', label: 'Calendário Escolar', icon: CalendarIcon, section: 'control' },
      { id: 'weekly-control', label: 'Controle Semanal', icon: Clock, section: 'control' },
      { id: 'monthly-control', label: 'Controle Mensal', icon: TrendingUp, section: 'control' },

      // ADMIN
      { id: 'supplier-manager', label: 'Fornecedores', icon: Truck, section: 'admin' },
      { id: 'reports', label: 'Relatórios', icon: FileText, section: 'admin' },
      { id: 'insights', label: 'IA Insights', icon: BrainCircuit, section: 'admin' },
    ]
    : [
      { id: 'attendance-dashboard', label: '📊 Presença Hoje', icon: UserCheck, section: 'main' },
      { id: 'daily-log', label: 'Registro Diário', icon: Utensils, section: 'main' },
      { id: 'waste-tracker', label: 'Desperdícios', icon: Trash2, section: 'main' },
      { id: 'inventory', label: 'Estoque (Consulta)', icon: ShoppingBasket, section: 'main' },
      { id: 'supply', label: 'Entradas', icon: Truck, section: 'main' },
      { id: 'calculator', label: 'Calculadora', icon: Calculator, section: 'main' },
      { id: 'weekly-menu', label: 'Cardápio', icon: CalendarDays, section: 'main' },
      { id: 'attendance-register', label: 'Fazer Chamada', icon: ClipboardCheck, section: 'main' },
    ];

  return (
    <div className="w-64 bg-emerald-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50 overflow-hidden">
      <div className="p-6 border-b border-emerald-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Utensils className="w-8 h-8 text-emerald-400" />
          MerendaMonitor
        </h1>
        <p className="text-xs text-emerald-300 mt-2 uppercase tracking-wider font-semibold">
          {currentRole === 'admin' ? 'Administrador' : 'Cozinha'}
        </p>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto sidebar-scrollbar">
        <div className="p-4 space-y-1">
          {currentRole === 'admin' ? (
            <>
              {/* Main */}
              {menuItems.filter(item => item.section === 'main').map((item) => (
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

              {/* School Section */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('school')}
                  className="w-full flex items-center justify-between px-2 py-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Gestão Escolar</span>
                  {expandedSections.school ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {expandedSections.school && (
                  <div className="space-y-1 animate-fade-in-down">
                    {menuItems.filter(item => item.section === 'school').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${activeTab === item.id
                          ? 'bg-emerald-700 text-white shadow-md'
                          : 'text-emerald-100 hover:bg-emerald-800'
                          }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* INVENTORY SECTION (DYNAMIC) */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('inventory')}
                  className="w-full flex items-center justify-between px-2 py-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Inventários</span>
                  {expandedSections.inventory ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {expandedSections.inventory && (
                  <div className="space-y-1 animate-fade-in-down">
                    {/* All */}
                    <button
                      onClick={() => setActiveTab('school-assets')}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${activeTab === 'school-assets' || activeTab === 'school-assets-all'
                        ? 'bg-emerald-700 text-white shadow-md'
                        : 'text-emerald-100 hover:bg-emerald-800'
                        }`}
                    >
                      <Boxes className="w-4 h-4" />
                      <span className="font-medium">Todos os Locais</span>
                    </button>

                    {/* General */}
                    <button
                      onClick={() => setActiveTab('school-assets-general')}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${activeTab === 'school-assets-general'
                        ? 'bg-emerald-700 text-white shadow-md'
                        : 'text-emerald-100 hover:bg-emerald-800'
                        }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center">🏢</span>
                      <span className="font-medium">Área Comum</span>
                    </button>

                    {classrooms.length > 0 && (
                      <div className="px-4 py-1 mt-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Salas de Aula</div>
                    )}

                    {classrooms.map(room => (
                      <button
                        key={room.id}
                        onClick={() => setActiveTab(`school-assets-${room.id}`)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${activeTab === `school-assets-${room.id}`
                          ? 'bg-emerald-700 text-white shadow-md'
                          : 'text-emerald-100 hover:bg-emerald-800'
                          }`}
                      >
                        <span className="w-4 h-4 flex items-center justify-center">🎓</span>
                        <span className="font-medium truncate">{room.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Kitchen Section */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('kitchen')}
                  className="w-full flex items-center justify-between px-2 py-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Merenda</span>
                  {expandedSections.kitchen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {expandedSections.kitchen && (
                  <div className="space-y-1 animate-fade-in-down">
                    {menuItems.filter(item => item.section === 'kitchen').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${activeTab === item.id
                          ? 'bg-emerald-700 text-white shadow-md'
                          : 'text-emerald-100 hover:bg-emerald-800'
                          }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Control Section */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('control')}
                  className="w-full flex items-center justify-between px-2 py-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Controles</span>
                  {expandedSections.control ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {expandedSections.control && (
                  <div className="space-y-1 animate-fade-in-down">
                    {menuItems.filter(item => item.section === 'control').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${activeTab === item.id
                          ? 'bg-emerald-700 text-white shadow-md'
                          : 'text-emerald-100 hover:bg-emerald-800'
                          }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Section */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('admin')}
                  className="w-full flex items-center justify-between px-2 py-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Administração</span>
                  {expandedSections.admin ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {expandedSections.admin && (
                  <div className="space-y-1 animate-fade-in-down">
                    {menuItems.filter(item => item.section === 'admin').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${activeTab === item.id
                          ? 'bg-emerald-700 text-white shadow-md'
                          : 'text-emerald-100 hover:bg-emerald-800'
                          }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            // Cook menu - simple list
            menuItems.map((item) => (
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
            ))
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-emerald-800">
        <button
          onClick={switchRole}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-100 rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </div>
  );
};