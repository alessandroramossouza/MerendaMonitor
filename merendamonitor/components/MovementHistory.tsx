import React, { useMemo } from 'react';
import { ConsumptionLog, SupplyLog } from '../types';
import { ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react';

interface MovementHistoryProps {
    ingredientId: string;
    ingredientName: string;
    consumptionLogs: ConsumptionLog[];
    supplyLogs: SupplyLog[];
    onClose: () => void;
}

type MovementEntry = {
    id: string;
    date: string;
    type: 'in' | 'out';
    amount: number;
    description: string;
    details?: string;
};

export const MovementHistory: React.FC<MovementHistoryProps> = ({
    ingredientId,
    ingredientName,
    consumptionLogs,
    supplyLogs,
    onClose
}) => {
    // Combine and sort movements
    const movements = useMemo<MovementEntry[]>(() => {
        const entries: MovementEntry[] = [];

        // Add supply entries (IN)
        supplyLogs
            .filter(log => log.ingredientId === ingredientId)
            .forEach(log => {
                entries.push({
                    id: log.id,
                    date: log.date,
                    type: 'in',
                    amount: log.amountAdded,
                    description: `Entrada de ${log.source || 'Fornecedor'}`,
                    details: log.notes
                });
            });

        // Add consumption entries (OUT)
        consumptionLogs
            .filter(log => log.ingredientId === ingredientId)
            .forEach(log => {
                entries.push({
                    id: log.id,
                    date: log.date,
                    type: 'out',
                    amount: log.amountUsed,
                    description: `Consumo diário`,
                    details: `${log.studentCount} alunos (${log.gramsPerStudent.toFixed(0)}g/aluno)`
                });
            });

        // Sort by date descending
        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [ingredientId, consumptionLogs, supplyLogs]);

    const totalIn = movements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.amount, 0);
    const totalOut = movements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.amount, 0);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-emerald-600 p-6 text-white flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">{ingredientName}</h2>
                        <p className="text-emerald-100">Histórico de Movimentações</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b">
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                        <ArrowDownCircle className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-gray-500">Total Entradas</p>
                            <p className="text-xl font-bold text-green-600">+{totalIn.toFixed(1)} kg</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                        <ArrowUpCircle className="w-8 h-8 text-red-600" />
                        <div>
                            <p className="text-sm text-gray-500">Total Saídas</p>
                            <p className="text-xl font-bold text-red-600">-{totalOut.toFixed(1)} kg</p>
                        </div>
                    </div>
                </div>

                {/* Movement List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {movements.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                            Nenhuma movimentação registrada para este item.
                        </div>
                    ) : (
                        movements.map(movement => (
                            <div
                                key={movement.id}
                                className={`flex items-center gap-4 p-4 rounded-xl border ${movement.type === 'in'
                                        ? 'bg-green-50 border-green-100'
                                        : 'bg-red-50 border-red-100'
                                    }`}
                            >
                                {movement.type === 'in' ? (
                                    <ArrowDownCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                ) : (
                                    <ArrowUpCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-800">{movement.description}</p>
                                            {movement.details && (
                                                <p className="text-sm text-gray-500">{movement.details}</p>
                                            )}
                                        </div>
                                        <span className={`font-bold text-lg ${movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {movement.type === 'in' ? '+' : '-'}{movement.amount.toFixed(1)} kg
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(movement.date).toLocaleDateString('pt-BR', {
                                            weekday: 'short',
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
