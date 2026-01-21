import React, { useState, useMemo } from 'react';
import { Ingredient } from '../types';
import { Calculator, Users, ChefHat, Sparkles } from 'lucide-react';

interface CookingCalculatorProps {
    inventory: Ingredient[];
}

// Default grams per student for common ingredients
const DEFAULT_PORTIONS: Record<string, number> = {
    'Arroz': 100,
    'Feijão': 60,
    'Macarrão': 80,
    'Frango': 100,
    'Carne': 100,
    'Cenoura': 30,
    'Batata': 80,
    'Legumes': 50,
};

export const CookingCalculator: React.FC<CookingCalculatorProps> = ({ inventory }) => {
    const [studentCount, setStudentCount] = useState<string>('');
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
    const [customPortions, setCustomPortions] = useState<Record<string, number>>({});

    // Get default portion for an ingredient based on name matching
    const getDefaultPortion = (name: string): number => {
        for (const [key, value] of Object.entries(DEFAULT_PORTIONS)) {
            if (name.toLowerCase().includes(key.toLowerCase())) {
                return value;
            }
        }
        return 80; // Default fallback
    };

    // Calculate quantities needed
    const calculations = useMemo(() => {
        if (!studentCount || parseInt(studentCount) <= 0) return [];

        const students = parseInt(studentCount);

        return inventory
            .filter(item => selectedItems[item.id])
            .map(item => {
                const portionGrams = customPortions[item.id] || getDefaultPortion(item.name);
                const neededKg = (portionGrams * students) / 1000;
                const available = item.currentStock;
                const shortage = neededKg > available ? neededKg - available : 0;

                return {
                    id: item.id,
                    name: item.name,
                    portionGrams,
                    neededKg,
                    available,
                    shortage,
                    isEnough: available >= neededKg
                };
            });
    }, [studentCount, selectedItems, customPortions, inventory]);

    const toggleItem = (id: string) => {
        setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const updatePortion = (id: string, value: number) => {
        setCustomPortions(prev => ({ ...prev, [id]: value }));
    };

    const selectAll = () => {
        const allSelected: Record<string, boolean> = {};
        inventory.forEach(item => { allSelected[item.id] = true; });
        setSelectedItems(allSelected);
    };

    const clearAll = () => {
        setSelectedItems({});
    };

    return (
        <div className="p-6 space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Calculator className="text-orange-500" />
                    Calculadora: Quanto Cozinhar?
                </h2>
                <p className="text-gray-500">Informe o número de alunos e veja as quantidades ideais</p>
            </header>

            {/* Input Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                <div className="flex flex-wrap items-end gap-6">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-lg font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Users className="w-5 h-5 text-orange-500" />
                            Quantos alunos vão comer hoje?
                        </label>
                        <input
                            type="number"
                            value={studentCount}
                            onChange={(e) => setStudentCount(e.target.value)}
                            className="w-full text-3xl p-4 border-2 border-orange-200 rounded-xl focus:border-orange-500 outline-none font-bold text-center"
                            placeholder="0"
                            min="1"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={selectAll}
                            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium"
                        >
                            Selecionar Todos
                        </button>
                        <button
                            onClick={clearAll}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            Limpar
                        </button>
                    </div>
                </div>
            </div>

            {/* Ingredient Selection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ChefHat className="text-orange-500" />
                    Selecione os ingredientes do cardápio de hoje
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {inventory.map(item => (
                        <button
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${selectedItems[item.id]
                                    ? 'border-orange-500 bg-orange-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-orange-200'
                                }`}
                        >
                            <span className="font-semibold text-gray-800 block">{item.name}</span>
                            <span className="text-sm text-gray-500">{item.currentStock}kg disponível</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {calculations.length > 0 && studentCount && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Sparkles className="text-orange-500" />
                        Receita para {studentCount} alunos
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-orange-50 text-orange-900">
                                <tr>
                                    <th className="p-4 text-left font-semibold rounded-tl-xl">Ingrediente</th>
                                    <th className="p-4 text-center font-semibold">Porção/Aluno</th>
                                    <th className="p-4 text-center font-semibold">Quantidade Necessária</th>
                                    <th className="p-4 text-center font-semibold">Disponível</th>
                                    <th className="p-4 text-center font-semibold rounded-tr-xl">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {calculations.map(calc => (
                                    <tr key={calc.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">{calc.name}</td>
                                        <td className="p-4 text-center">
                                            <input
                                                type="number"
                                                value={calc.portionGrams}
                                                onChange={(e) => updatePortion(calc.id, parseInt(e.target.value) || 0)}
                                                className="w-20 p-2 border border-gray-200 rounded-lg text-center font-mono"
                                            />
                                            <span className="text-sm text-gray-500 ml-1">g</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-2xl font-bold text-orange-600">{calc.neededKg.toFixed(1)}</span>
                                            <span className="text-sm text-gray-500 ml-1">kg</span>
                                        </td>
                                        <td className="p-4 text-center font-mono">{calc.available.toFixed(1)} kg</td>
                                        <td className="p-4 text-center">
                                            {calc.isEnough ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                                                    ✅ OK
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                                                    ⚠️ Faltam {calc.shortage.toFixed(1)}kg
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-gray-600">Total de ingredientes:</span>
                                <span className="font-bold text-gray-800 ml-2">{calculations.length} itens</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Peso total a cozinhar:</span>
                                <span className="font-bold text-orange-600 text-xl ml-2">
                                    {calculations.reduce((acc, c) => acc + c.neededKg, 0).toFixed(1)} kg
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
