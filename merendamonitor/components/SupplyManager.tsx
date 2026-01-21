import React, { useState, useMemo } from 'react';
import { Ingredient, SupplyLog } from '../types';
import { Truck, PackageCheck, Clock, ArrowRight, Package } from 'lucide-react';

interface SupplyManagerProps {
    inventory: Ingredient[];
    supplyLogs: SupplyLog[];
    onSupplyEntry: (ingredientId: string, amount: number, source: string, notes: string, expirationDate: string) => void;
}

export const SupplyManager: React.FC<SupplyManagerProps> = ({ inventory, supplyLogs, onSupplyEntry }) => {
    const [selectedId, setSelectedId] = useState('');
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('Prefeitura (PNAE)');
    const [notes, setNotes] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const selectedIngredient = inventory.find(i => i.id === selectedId);

    // Recent entries (last 10)
    const recentEntries = useMemo(() => {
        return [...supplyLogs]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    }, [supplyLogs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId || !amount) return;

        onSupplyEntry(selectedId, parseFloat(amount), source, notes, expirationDate);

        // Feedback
        setSuccessMsg(`Recebimento registrado! +${amount}kg de ${selectedIngredient?.name}`);
        setTimeout(() => setSuccessMsg(''), 3000);

        // Reset fields except source (convenience)
        setAmount('');
        setSelectedId('');
        setNotes('');
        setExpirationDate('');
    };

    return (
        <div className="p-6 space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Truck className="text-blue-500" />
                    Entrada de Mercadorias
                </h2>
                <p className="text-gray-500">Registre todo abastecimento do estoque aqui</p>
            </header>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Package className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-blue-800 font-medium">Fluxo Correto</p>
                    <p className="text-blue-700 text-sm flex items-center gap-2">
                        <span>Cadastre o produto em "Estoque"</span>
                        <ArrowRight className="w-4 h-4" />
                        <span>Registre a entrada aqui com validade</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Entry Form */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                    <div className="bg-blue-600 p-4 text-white flex items-center gap-3">
                        <PackageCheck className="w-6 h-6" />
                        <span className="font-bold text-lg">Nova Entrada</span>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {successMsg && (
                            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center">
                                ✅ {successMsg}
                            </div>
                        )}

                        {inventory.length === 0 && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
                                ⚠️ Nenhum produto cadastrado. Vá em "Estoque" primeiro para cadastrar produtos.
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block font-medium text-gray-700 mb-2">Produto</label>
                                <select
                                    value={selectedId}
                                    onChange={(e) => setSelectedId(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-gray-50"
                                    required
                                    disabled={inventory.length === 0}
                                >
                                    <option value="">Selecione o produto...</option>
                                    {inventory.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} (Atual: {item.currentStock.toFixed(1)}kg)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-2">Quantidade (Kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    placeholder="0.0"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-2">Origem / Fornecedor</label>
                                <select
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-gray-50"
                                >
                                    <option value="Prefeitura (PNAE)">Prefeitura (PNAE)</option>
                                    <option value="Agricultura Familiar">Agricultura Familiar</option>
                                    <option value="Doação">Doação</option>
                                    <option value="Compra Direta">Compra Direta</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-2">
                                    Data de Validade
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={expirationDate}
                                    onChange={(e) => setExpirationDate(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block font-medium text-gray-700 mb-2">Observações (Lote)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    placeholder="Ex: Lote 123"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={inventory.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg transform transition-transform active:scale-95 flex items-center gap-2"
                            >
                                <PackageCheck className="w-5 h-5" />
                                Confirmar Entrada
                            </button>
                        </div>
                    </form>
                </div>

                {/* Recent Entries */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-500" />
                            Últimas Entradas
                        </h3>
                    </div>
                    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                        {recentEntries.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">Nenhuma entrada registrada ainda.</p>
                        ) : (
                            recentEntries.map(entry => (
                                <div key={entry.id} className="p-3 bg-green-50 border border-green-100 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800">{entry.ingredientName}</p>
                                            <p className="text-sm text-gray-500">{entry.source}</p>
                                        </div>
                                        <span className="font-bold text-green-600">+{entry.amountAdded.toFixed(1)}kg</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                                        <span>{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                                        {entry.expirationDate && (
                                            <span className="text-amber-600">
                                                Val: {new Date(entry.expirationDate).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
