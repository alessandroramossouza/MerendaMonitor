import React, { useState } from 'react';
import { Ingredient } from '../types';
import { Utensils, Save, AlertCircle } from 'lucide-react';

interface DailyRegisterProps {
    inventory: Ingredient[];
    onConsumption: (ingredientId: string, amount: number, students: number) => void;
}

export const DailyRegister: React.FC<DailyRegisterProps> = ({ inventory, onConsumption }) => {
    const [selectedId, setSelectedId] = useState('');
    const [amount, setAmount] = useState('');
    const [students, setStudents] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const selectedItem = inventory.find(i => i.id === selectedId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId || !amount || !students) return;

        onConsumption(selectedId, parseFloat(amount), parseInt(students));

        setSuccessMsg(`Consumo de ${amount}kg registrado para ${selectedItem?.name}!`);
        setTimeout(() => setSuccessMsg(''), 3000);

        setAmount('');
        // Keep student count as it might be same for next item
        // setStudents(''); 
        setSelectedId('');
    };

    return (
        <div className="p-6 space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Utensils className="text-orange-500" />
                    Registro Diário
                </h2>
                <p className="text-gray-500">Registre o consumo da merenda do dia.</p>
            </header>

            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
                <div className="bg-orange-500 p-6 text-white text-center">
                    <h3 className="text-2xl font-bold">O que foi servido hoje?</h3>
                    <p className="text-orange-100">Registre a saída dos ingredientes</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {successMsg && (
                        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-center font-medium animate-bounce">
                            ✅ {successMsg}
                        </div>
                    )}

                    <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Ingrediente Utilizado</label>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none bg-white"
                            required
                        >
                            <option value="">Selecione...</option>
                            {inventory.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} (Disp: {item.currentStock.toFixed(1)}kg)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-lg font-medium text-gray-700 mb-2">Quantidade (Kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none"
                                placeholder="0.0"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-medium text-gray-700 mb-2">Nº de Alunos</label>
                            <input
                                type="number"
                                value={students}
                                onChange={(e) => setStudents(e.target.value)}
                                className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none"
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    {selectedItem && (parseFloat(amount) > selectedItem.currentStock) && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-bold">Atenção: Quantidade maior que o estoque atual!</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xl font-bold py-4 rounded-xl shadow-lg transform transition-transform active:scale-95 flex justify-center items-center gap-2"
                    >
                        <Save className="w-6 h-6" />
                        Registrar Consumo
                    </button>
                </form>
            </div>
        </div>
    );
};
