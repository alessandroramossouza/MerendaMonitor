import React, { useState, useEffect, useMemo } from 'react';
import { ChefHat, Users, Utensils, Calendar, TrendingUp, AlertCircle, Package, Clock, Soup } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Ingredient } from '../types';

interface AttendanceSummary {
    totalStudents: number;
    byShift: { shift: string; count: number }[];
    byClassroom: { name: string; count: number }[];
}

interface MealRequirement {
    ingredientId: string;
    ingredientName: string;
    requiredAmount: number;
    currentStock: number;
    unit: string;
    status: 'sufficient' | 'low' | 'critical';
}

export const KitchenDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>({
        totalStudents: 0,
        byShift: [],
        byClassroom: []
    });
    const [inventory, setInventory] = useState<Ingredient[]>([]);
    const [portionSize, setPortionSize] = useState(0.15); // kg por aluno (default 150g)

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch attendance for selected date
            const { data: attendanceData, error: attError } = await supabase
                .from('daily_attendance')
                .select(`
          present_count,
          shift,
          classrooms (name)
        `)
                .eq('date', selectedDate);

            if (attError) {
                console.error('Error fetching attendance:', attError);
            }

            if (attendanceData) {
                const totalStudents = attendanceData.reduce((sum, record) => sum + (record.present_count || 0), 0);

                // Group by shift
                const shiftMap = new Map<string, number>();
                attendanceData.forEach(record => {
                    const current = shiftMap.get(record.shift) || 0;
                    shiftMap.set(record.shift, current + (record.present_count || 0));
                });
                const byShift = Array.from(shiftMap.entries()).map(([shift, count]) => ({ shift, count }));

                // Group by classroom
                const classroomMap = new Map<string, number>();
                attendanceData.forEach(record => {
                    const classroomName = (record.classrooms as any)?.name || 'Desconhecida';
                    const current = classroomMap.get(classroomName) || 0;
                    classroomMap.set(classroomName, current + (record.present_count || 0));
                });
                const byClassroom = Array.from(classroomMap.entries()).map(([name, count]) => ({ name, count }));

                setAttendanceSummary({ totalStudents, byShift, byClassroom });
            }

            // Fetch inventory
            const { data: inventoryData, error: invError } = await supabase
                .from('ingredients')
                .select('*')
                .order('name');

            if (invError) {
                console.error('Error fetching inventory:', invError);
            }

            if (inventoryData) {
                setInventory(inventoryData.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    unit: item.unit,
                    currentStock: item.current_stock,
                    minThreshold: item.min_threshold,
                    costPerUnit: item.cost_per_unit || 0,
                    expirationDate: item.expiration_date
                })));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getShiftLabel = (shift: string) => {
        const labels: Record<string, string> = {
            morning: '☀️ Manhã',
            afternoon: '🌅 Tarde',
            evening: '🌙 Noite',
            full_time: '🕐 Integral'
        };
        return labels[shift] || shift;
    };

    // Calculate meal requirements based on attendance
    const mealRequirements = useMemo((): MealRequirement[] => {
        if (attendanceSummary.totalStudents === 0) return [];

        return inventory.map(ingredient => {
            // Estimate required amount (simplified: portion size * students)
            // In a real scenario, this would be based on recipes and menu for the day
            const requiredAmount = attendanceSummary.totalStudents * portionSize *
                (ingredient.category === 'Proteína' ? 0.8 :
                    ingredient.category === 'Carboidrato' ? 1.2 :
                        ingredient.category === 'Legumes' ? 0.5 : 0.3);

            const status: 'sufficient' | 'low' | 'critical' =
                ingredient.currentStock >= requiredAmount * 1.5 ? 'sufficient' :
                    ingredient.currentStock >= requiredAmount ? 'low' : 'critical';

            return {
                ingredientId: ingredient.id,
                ingredientName: ingredient.name,
                requiredAmount: Math.round(requiredAmount * 100) / 100,
                currentStock: ingredient.currentStock,
                unit: ingredient.unit,
                status
            };
        }).filter(req => req.requiredAmount > 0).sort((a, b) => {
            const statusOrder = { critical: 0, low: 1, sufficient: 2 };
            return statusOrder[a.status] - statusOrder[b.status];
        });
    }, [attendanceSummary.totalStudents, inventory, portionSize]);

    const criticalItems = mealRequirements.filter(r => r.status === 'critical');
    const lowItems = mealRequirements.filter(r => r.status === 'low');

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <ChefHat className="text-orange-600" />
                        Dashboard da Cozinha
                    </h2>
                    <p className="text-gray-500">Planejamento de refeições baseado na presença do dia</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 border-2 border-orange-200 rounded-xl focus:border-orange-500 outline-none font-medium"
                    />
                </div>
            </header>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Students Card */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-2xl shadow-lg md:col-span-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-orange-100 text-sm flex items-center gap-1">
                                <Users className="w-4 h-4" /> Alunos Presentes Hoje
                            </p>
                            <h3 className="text-5xl font-bold mt-2">{attendanceSummary.totalStudents}</h3>
                            <p className="text-orange-100 text-sm mt-2">
                                {selectedDate === new Date().toISOString().split('T')[0] ? 'Atualizado em tempo real' : `Data: ${new Date(selectedDate).toLocaleDateString('pt-BR')}`}
                            </p>
                        </div>
                        <div className="p-4 bg-white/20 rounded-2xl">
                            <Soup className="w-12 h-12" />
                        </div>
                    </div>
                </div>

                {/* Estimated Portions */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <Utensils className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Porções Estimadas</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{attendanceSummary.totalStudents}</p>
                    <p className="text-xs text-gray-400 mt-1">~{(attendanceSummary.totalStudents * portionSize).toFixed(1)}kg total</p>
                </div>

                {/* Alerts Card */}
                <div className={`p-6 rounded-2xl shadow-sm border ${criticalItems.length > 0 ? 'bg-red-50 border-red-200' : lowItems.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-xl ${criticalItems.length > 0 ? 'bg-red-100 text-red-600' : lowItems.length > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Status do Estoque</p>
                    </div>
                    <p className={`text-2xl font-bold ${criticalItems.length > 0 ? 'text-red-600' : lowItems.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {criticalItems.length > 0 ? `${criticalItems.length} Crítico(s)` : lowItems.length > 0 ? `${lowItems.length} Atenção` : 'Tudo OK'}
                    </p>
                </div>
            </div>

            {/* Breakdown by Shift */}
            {attendanceSummary.byShift.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="text-purple-600" />
                        Distribuição por Turno
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {attendanceSummary.byShift.map(shift => (
                            <div key={shift.shift} className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <p className="text-sm text-purple-600 font-medium">{getShiftLabel(shift.shift)}</p>
                                <p className="text-2xl font-bold text-purple-800">{shift.count} alunos</p>
                                <p className="text-xs text-purple-500">{(shift.count * portionSize).toFixed(1)}kg de refeição</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Breakdown by Classroom */}
            {attendanceSummary.byClassroom.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users className="text-blue-600" />
                        Distribuição por Turma
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {attendanceSummary.byClassroom.map(classroom => (
                            <div key={classroom.name} className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                                <p className="text-sm font-medium text-blue-800 truncate" title={classroom.name}>{classroom.name}</p>
                                <p className="text-xl font-bold text-blue-600">{classroom.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Meal Requirements */}
            {mealRequirements.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Package className="text-green-600" />
                            Ingredientes Necessários para Hoje
                        </h3>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Porção/aluno:</label>
                            <input
                                type="number"
                                value={portionSize}
                                onChange={(e) => setPortionSize(Number(e.target.value))}
                                step="0.05"
                                min="0.05"
                                className="w-20 px-2 py-1 border rounded-lg text-center"
                            />
                            <span className="text-sm text-gray-500">kg</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Ingrediente</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Necessário</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Em Estoque</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mealRequirements.slice(0, 10).map(req => (
                                    <tr key={req.ingredientId} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-gray-800">{req.ingredientName}</td>
                                        <td className="py-3 px-4 text-center">{req.requiredAmount} {req.unit}</td>
                                        <td className="py-3 px-4 text-center">{req.currentStock} {req.unit}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'sufficient' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'low' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {req.status === 'sufficient' ? 'Suficiente' : req.status === 'low' ? 'Atenção' : 'Crítico'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {attendanceSummary.totalStudents === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-yellow-700 mb-2">Nenhuma Chamada Registrada</h3>
                    <p className="text-yellow-600">
                        Ainda não há registros de presença para {selectedDate === new Date().toISOString().split('T')[0] ? 'hoje' : 'esta data'}.
                    </p>
                    <p className="text-yellow-500 text-sm mt-2">
                        Os professores precisam fazer a chamada para que os dados apareçam aqui.
                    </p>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                <ChefHat className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-orange-800 font-medium">Dica para a Cozinha</p>
                    <p className="text-orange-700 text-sm mt-1">
                        Este painel mostra a quantidade estimada de refeições baseada na presença dos alunos.
                        Use o seletor de data para planejar com antecedência ou verificar dias anteriores.
                        A quantidade de ingredientes é uma estimativa e pode variar de acordo com o cardápio do dia.
                    </p>
                </div>
            </div>
        </div>
    );
};
