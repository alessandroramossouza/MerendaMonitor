import React, { useState } from 'react';
import { Ingredient } from '../types';
import { Truck, Save, PlusCircle, PackageCheck } from 'lucide-react';

interface SupplyManagerProps {
    inventory: Ingredient[];
    onSupplyEntry: (ingredientId: string, amount: number, source: string, notes: string, expirationDate: string) => void;
}

export const SupplyManager: React.FC<SupplyManagerProps> = ({ inventory, onSupplyEntry }) => {
    const [selectedId, setSelectedId] = useState('');
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('Prefeitura (PNAE)');
    const [notes, setNotes] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const selectedIngredient = inventory.find(i => i.id === selectedId);

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
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white flex items-center gap-3">
                    <Truck className="w-10 h-10" />
                    <div>
                        <h2 className="text-2xl font-bold">Entrada de Mercadorias</h2>
                        <p className="text-blue-100">Registre o abastecimento do estoque e validade</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {successMsg && (
                        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center animate-bounce">
                            ✅ {successMsg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-lg font-medium text-gray-700 mb-2">Item Recebido</label>
                            <select
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                                className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-gray-50"
                                required
                            >
                                <option value="">Selecione o produto...</option>
                                {inventory.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} (Atual: {item.currentStock}kg)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-lg font-medium text-gray-700 mb-2">Quantidade (Kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                placeholder="0.0"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-medium text-gray-700 mb-2">Origem / Fornecedor</label>
                            <select
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-gray-50"
                            >
                                <option value="Prefeitura (PNAE)">Prefeitura (PNAE)</option>
                                <option value="Agricultura Familiar">Agricultura Familiar</option>
                                <option value="Doação">Doação</option>
                                <option value="Compra Direta">Compra Direta</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-lg font-medium text-gray-700 mb-2">Data de Validade (Vencimento)</label>
                            <input
                                type="date"
                                value={expirationDate}
                                onChange={(e) => setExpirationDate(e.target.value)}
                                className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-lg font-medium text-gray-700 mb-2">Observações (Lote)</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                placeholder="Ex: Lote 123"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-3 px-8 rounded-xl shadow-lg transform transition-transform active:scale-95 flex items-center gap-2"
                        >
                            <PackageCheck className="w-6 h-6" />
                            Confirmar Entrada
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
