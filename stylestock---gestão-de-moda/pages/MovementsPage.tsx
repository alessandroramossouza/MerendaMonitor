import React, { useState, useEffect } from 'react';
import { getStockMovements, deleteMovement } from '../services/dataService';
import { StockMovement } from '../types';

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const typeLabels: Record<string, { label: string; color: string }> = {
    entrada: { label: 'Entrada', color: 'bg-green-100 text-green-700' },
    saida: { label: 'Saída', color: 'bg-red-100 text-red-700' },
    ajuste: { label: 'Ajuste', color: 'bg-yellow-100 text-yellow-700' },
    venda: { label: 'Venda', color: 'bg-blue-100 text-blue-700' },
};

export const MovementsPage: React.FC = () => {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getStockMovements();
        setMovements(data);
        setLoading(false);
    };

    const handleDelete = async (movement: StockMovement) => {
        if (!window.confirm(`Excluir movimentação de "${movement.productName}"?`)) return;
        try {
            await deleteMovement(movement.id);
            loadData();
        } catch (error: any) {
            alert(`Erro ao excluir: ${error?.message || 'Erro desconhecido'}`);
        }
    };

    const filteredMovements = movements.filter(m => {
        const matchesType = filter === 'all' || m.type === filter;
        const matchesSearch = m.productName.toLowerCase().includes(search.toLowerCase()) ||
            m.reason.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <HistoryIcon />
                    Histórico de Movimentações
                </h2>
                <p className="text-slate-500">Acompanhe todas as entradas e saídas de estoque</p>
            </header>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por produto ou motivo..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('entrada')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'entrada' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                        Entradas
                    </button>
                    <button
                        onClick={() => setFilter('venda')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'venda' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                    >
                        Vendas
                    </button>
                    <button
                        onClick={() => setFilter('ajuste')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'ajuste' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                    >
                        Ajustes
                    </button>
                </div>
            </div>

            {/* Movements List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">Data/Hora</th>
                            <th className="px-4 py-3 text-left">Produto</th>
                            <th className="px-4 py-3 text-center">Tipo</th>
                            <th className="px-4 py-3 text-center">Qtd</th>
                            <th className="px-4 py-3 text-center">Estoque Anterior</th>
                            <th className="px-4 py-3 text-center">Novo Estoque</th>
                            <th className="px-4 py-3 text-left">Motivo</th>
                            <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Carregando...</td>
                            </tr>
                        ) : filteredMovements.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">Nenhuma movimentação encontrada</td>
                            </tr>
                        ) : (
                            filteredMovements.map(movement => (
                                <tr key={movement.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-500 text-xs">
                                        {new Date(movement.timestamp).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{movement.productName}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeLabels[movement.type]?.color || 'bg-slate-100 text-slate-600'}`}>
                                            {typeLabels[movement.type]?.label || movement.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center font-medium">
                                        {movement.type === 'entrada' && <span className="text-green-600">+{movement.quantity}</span>}
                                        {movement.type === 'venda' && <span className="text-red-600">-{movement.quantity}</span>}
                                        {movement.type === 'ajuste' && <span className="text-yellow-600">{movement.quantity}</span>}
                                        {movement.type === 'saida' && <span className="text-red-600">-{movement.quantity}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-400">{movement.previousStock}</td>
                                    <td className="px-4 py-3 text-center font-medium text-slate-700">{movement.newStock}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{movement.reason}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleDelete(movement)}
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            title="Excluir movimentação"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
