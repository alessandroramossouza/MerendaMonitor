import React, { useState, useMemo } from 'react';
import { Ingredient } from '../types';
import { CalendarDays, Plus, Trash2, CheckCircle, AlertTriangle, Save } from 'lucide-react';

interface WeeklyMenuProps {
    inventory: Ingredient[];
}

const DAYS_OF_WEEK = [
    { id: 0, name: 'Segunda-feira', short: 'Seg' },
    { id: 1, name: 'Terça-feira', short: 'Ter' },
    { id: 2, name: 'Quarta-feira', short: 'Qua' },
    { id: 3, name: 'Quinta-feira', short: 'Qui' },
    { id: 4, name: 'Sexta-feira', short: 'Sex' },
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

    const [selectedDay, setSelectedDay] = useState(0);

    const currentDay = menu.find(m => m.day === selectedDay)!;

    const addItem = () => {
        if (inventory.length === 0) return;
        setMenu(prev => prev.map(d =>
            d.day === selectedDay
                ? { ...d, items: [...d.items, { ingredientId: inventory[0].id, amount: 5 }] }
                : d
        ));
    };

    const removeItem = (index: number) => {
        setMenu(prev => prev.map(d =>
            d.day === selectedDay
                ? { ...d, items: d.items.filter((_, i) => i !== index) }
                : d
        ));
    };

    const updateItem = (index: number, field: 'ingredientId' | 'amount', value: string | number) => {
        setMenu(prev => prev.map(d =>
            d.day === selectedDay
                ? {
                    ...d, items: d.items.map((item, i) =>
                        i === index ? { ...item, [field]: value } : item
                    )
                }
                : d
        ));
    };

    const updateStudents = (count: number) => {
        setMenu(prev => prev.map(d =>
            d.day === selectedDay ? { ...d, students: count } : d
        ));
    };

    // Calculate stock availability
    const stockCheck = useMemo(() => {
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
                needed,
                available,
                shortage: needed > available ? needed - available : 0
            };
        }).filter(item => item.needed > 0);
    }, [menu, inventory]);

    const hasShortages = stockCheck.some(s => s.shortage > 0);

    return (
        <div className="p-6 space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <CalendarDays className="text-indigo-500" />
                    Cardápio Semanal
                </h2>
                <p className="text-gray-500">Planeje as refeições da semana e verifique se há ingredientes suficientes</p>
            </header>

            {/* Day Tabs */}
            <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                {DAYS_OF_WEEK.map(day => (
                    <button
                        key={day.id}
                        onClick={() => setSelectedDay(day.id)}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${selectedDay === day.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {day.short}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Day Editor */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">
                            {DAYS_OF_WEEK.find(d => d.id === selectedDay)?.name}
                        </h3>
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-500">Alunos previstos:</label>
                            <input
                                type="number"
                                value={currentDay.students}
                                onChange={(e) => updateStudents(parseInt(e.target.value) || 0)}
                                className="w-24 p-2 border border-gray-200 rounded-lg text-center font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {currentDay.items.length === 0 ? (
                            <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-xl">
                                Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                            </div>
                        ) : (
                            currentDay.items.map((item, index) => (
                                <div key={index} className="flex gap-4 items-center p-4 bg-gray-50 rounded-xl">
                                    <select
                                        value={item.ingredientId}
                                        onChange={(e) => updateItem(index, 'ingredientId', e.target.value)}
                                        className="flex-1 p-3 border border-gray-200 rounded-lg bg-white"
                                    >
                                        {inventory.map(ing => (
                                            <option key={ing.id} value={ing.id}>{ing.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={item.amount}
                                        onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                                        className="w-24 p-3 border border-gray-200 rounded-lg text-center font-mono"
                                        step="0.5"
                                    />
                                    <span className="text-gray-500 text-sm">kg</span>
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={addItem}
                        className="mt-4 w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-xl hover:bg-indigo-50 font-medium flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Item
                    </button>
                </div>

                {/* Stock Check */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        {hasShortages ? (
                            <AlertTriangle className="text-amber-500" />
                        ) : (
                            <CheckCircle className="text-green-500" />
                        )}
                        Verificação de Estoque
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Total necessário para a semana:</p>

                    <div className="space-y-3">
                        {stockCheck.length === 0 ? (
                            <p className="text-center text-gray-400 py-4">Adicione itens ao cardápio para ver a verificação.</p>
                        ) : (
                            stockCheck.map(item => (
                                <div
                                    key={item.id}
                                    className={`p-3 rounded-xl border ${item.shortage > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-800">{item.name}</span>
                                        <span className={`font-bold ${item.shortage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {item.needed.toFixed(1)} kg
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Disponível: {item.available.toFixed(1)} kg
                                        {item.shortage > 0 && (
                                            <span className="text-red-600 ml-2 font-bold">
                                                (Faltam {item.shortage.toFixed(1)} kg)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {hasShortages && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-amber-800 text-sm font-medium">
                                ⚠️ Atenção: Há ingredientes insuficientes para o cardápio planejado. Considere revisar as quantidades ou solicitar reposição.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
