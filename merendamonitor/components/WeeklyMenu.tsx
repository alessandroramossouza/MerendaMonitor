import React, { useState, useMemo } from 'react';
import { Ingredient } from '../types';
import { CalendarDays, Plus, Trash2, ShoppingCart, ChefHat, AlertCircle, Check, Wheat, Beef, Carrot, Milk, Utensils, Coffee, Package } from 'lucide-react';

interface WeeklyMenuProps {
    inventory: Ingredient[];
}

const DAYS_OF_WEEK = [
    { id: 0, name: 'Segunda', fullName: 'Segunda-feira' },
    { id: 1, name: 'Terça', fullName: 'Terça-feira' },
    { id: 2, name: 'Quarta', fullName: 'Quarta-feira' },
    { id: 3, name: 'Quinta', fullName: 'Quinta-feira' },
    { id: 4, name: 'Sexta', fullName: 'Sexta-feira' },
];

interface MenuItem {
    ingredientId: string;
    amount: number;
}

interface DayMenu {
    day: number;
    items: MenuItem[];
    students: number;
}

export const WeeklyMenu: React.FC<WeeklyMenuProps> = ({ inventory }) => {
    const [menu, setMenu] = useState<DayMenu[]>(
        DAYS_OF_WEEK.map(d => ({ day: d.id, items: [], students: 200 }))
    );

    const [hoveredDay, setHoveredDay] = useState<number | null>(null);

    const addItem = (dayId: number) => {
        if (inventory.length === 0) return;
        setMenu(prev => prev.map(d =>
            d.day === dayId
                ? { ...d, items: [...d.items, { ingredientId: inventory[0].id, amount: 5 }] }
                : d
        ));
    };

    const removeItem = (dayId: number, index: number) => {
        setMenu(prev => prev.map(d =>
            d.day === dayId
                ? { ...d, items: d.items.filter((_, i) => i !== index) }
                : d
        ));
    };

    const updateItem = (dayId: number, index: number, field: 'ingredientId' | 'amount', value: string | number) => {
        setMenu(prev => prev.map(d =>
            d.day === dayId
                ? {
                    ...d, items: d.items.map((item, i) =>
                        i === index ? { ...item, [field]: value } : item
                    )
                }
                : d
        ));
    };

    const updateStudents = (dayId: number, count: number) => {
        setMenu(prev => prev.map(d =>
            d.day === dayId ? { ...d, students: count } : d
        ));
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Grãos': return <Wheat className="w-4 h-4" />;
            case 'Proteínas': return <Beef className="w-4 h-4" />;
            case 'Hortifruti': return <Carrot className="w-4 h-4" />;
            case 'Laticínios': return <Milk className="w-4 h-4" />;
            case 'Temperos': return <Utensils className="w-4 h-4" />;
            case 'Bebidas': return <Coffee className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    // Calculate stock availability
    const shoppingList = useMemo(() => {
        const totalNeeded: Record<string, number> = {};

        menu.forEach(day => {
            day.items.forEach(item => {
                totalNeeded[item.ingredientId] = (totalNeeded[item.ingredientId] || 0) + item.amount;
            });
        });

        return Object.entries(totalNeeded).map(([id, needed]) => {
            const ingredient = inventory.find(i => i.id === id);
            const available = ingredient?.currentStock || 0;
            return {
                id,
                name: ingredient?.name || 'Desconhecido',
                unit: ingredient?.unit || 'kg',
                category: ingredient?.category || 'Outros',
                needed,
                available,
                shortage: needed > available ? needed - available : 0,
                status: needed > available ? 'shortage' : 'ok'
            };
        }).sort((a, b) => (a.status === 'shortage' ? -1 : 1)); // Show shortages first
    }, [menu, inventory]);

    const shortageCount = shoppingList.filter(i => i.status === 'shortage').length;

    return (
        <div className="p-6 h-full flex flex-col bg-gray-50 overflow-hidden">
            <header className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CalendarDays className="text-indigo-600 w-8 h-8" />
                        Cardápio Semanal 2.0
                    </h2>
                    <p className="text-gray-500">Planeje a semana inteira e gere sua lista de compras automaticamente.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                        <ChefHat className="text-gray-400 w-5 h-5" />
                        <span className="text-sm font-medium text-gray-600">Alunos (Média): 200</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Main Grid - Days */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                    <div className="flex gap-4 h-full min-w-[1000px]"> {/* Ensure min width for horizontal scroll if needed */}
                        {DAYS_OF_WEEK.map(day => {
                            const dayData = menu.find(m => m.day === day.id)!;
                            return (
                                <div
                                    key={day.id}
                                    className={`flex-1 flex flex-col min-w-[200px] bg-white rounded-2xl border transition-all duration-300 ${hoveredDay === day.id ? 'border-indigo-300 shadow-lg -translate-y-1' : 'border-gray-200 shadow-sm'
                                        }`}
                                    onMouseEnter={() => setHoveredDay(day.id)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                >
                                    {/* Column Header */}
                                    <div className={`p-4 border-b ${hoveredDay === day.id ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'} rounded-t-2xl transition-colors`}>
                                        <h3 className={`font-bold text-lg ${hoveredDay === day.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                                            {day.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Alunos</span>
                                            <input
                                                type="number"
                                                value={dayData.students}
                                                onChange={(e) => updateStudents(day.id, parseInt(e.target.value) || 0)}
                                                className="w-16 py-0.5 px-2 text-sm border border-gray-300 rounded text-center bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                                        {dayData.items.map((item, index) => {
                                            const ingredient = inventory.find(i => i.id === item.ingredientId);
                                            return (
                                                <div key={index} className="group relative bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <div className={`p-1.5 rounded-lg ${hoveredDay === day.id ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-100 text-gray-400'} transition-colors`}>
                                                                {getCategoryIcon(ingredient?.category || 'Outros')}
                                                            </div>
                                                            <select
                                                                value={item.ingredientId}
                                                                onChange={(e) => updateItem(day.id, index, 'ingredientId', e.target.value)}
                                                                className="w-full text-sm font-medium text-gray-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer truncate pr-4"
                                                            >
                                                                {inventory.map(ing => (
                                                                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(day.id, index)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-500 hover:bg-red-50 rounded transition-all absolute top-2 right-2 z-10"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1 ml-9">
                                                        <input
                                                            type="number"
                                                            value={item.amount}
                                                            onChange={(e) => updateItem(day.id, index, 'amount', parseFloat(e.target.value) || 0)}
                                                            className="w-12 bg-transparent text-sm font-bold text-gray-800 text-center focus:outline-none"
                                                            step="0.1"
                                                        />
                                                        <span className="text-xs text-gray-500 font-medium">kg</span>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <button
                                            onClick={() => addItem(day.id)}
                                            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-1 group"
                                        >
                                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-medium">Add Item</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar - Smart Shopping List */}
                <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-shrink-0">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                            <ShoppingCart className="text-indigo-600 w-5 h-5" />
                            Lista de Compras
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {shortageCount > 0
                                ? `${shortageCount} itens precisam de reposição`
                                : 'Tudo certo com seu estoque!'}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {shoppingList.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-sm text-gray-400">Adicione itens ao cardápio para gerar sua lista.</p>
                            </div>
                        ) : (
                            shoppingList.map(item => (
                                <div
                                    key={item.id}
                                    className={`p-3 rounded-xl border ${item.status === 'shortage'
                                            ? 'bg-red-50 border-red-100'
                                            : 'bg-white border-gray-100 hover:border-gray-200'
                                        } transition-all`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-gray-50 rounded-md text-gray-400">
                                                {getCategoryIcon(item.category)}
                                            </div>
                                            <span className={`font-medium text-sm ${item.status === 'shortage' ? 'text-red-900' : 'text-gray-700'}`}>
                                                {item.name}
                                            </span>
                                        </div>
                                        {item.status === 'shortage' && (
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        {item.status === 'ok' && (
                                            <div className="bg-green-100 p-0.5 rounded-full">
                                                <Check className="w-3 h-3 text-green-600" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-2 text-xs pl-9">
                                        <div className="flex flex-col">
                                            <span className="text-gray-400">Total</span>
                                            <span className="font-bold text-gray-700 text-sm">{item.needed.toFixed(1)} <span className="text-[10px] font-normal">{item.unit}</span></span>
                                        </div>
                                        <div className="h-4 w-px bg-gray-200 mx-2"></div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-gray-400">Falta</span>
                                            <span className={`font-bold text-sm ${item.shortage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {item.shortage > 0 ? `-${item.shortage.toFixed(1)}` : 'OK'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden ml-1">
                                        <div
                                            className={`h-full rounded-full ${item.status === 'shortage' ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min((item.available / item.needed) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                        <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-sm">
                            <ShoppingCart className="w-4 h-4" />
                            Exportar Lista de Compras
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
