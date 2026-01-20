import React, { useState } from 'react';
import { Ingredient } from '../types';
import { ChefHat, Save, Calculator, AlertCircle } from 'lucide-react';

interface DailyLogProps {
  inventory: Ingredient[];
  onLogConsumption: (ingredientId: string, amount: number, students: number) => void;
}

export const DailyLog: React.FC<DailyLogProps> = ({ inventory, onLogConsumption }) => {
  const [selectedId, setSelectedId] = useState('');
  const [amount, setAmount] = useState('');
  const [students, setStudents] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const selectedIngredient = inventory.find(i => i.id === selectedId);

  // Calculate grams per student on the fly for preview
  const previewGrams = (amount && students && parseInt(students) > 0) 
    ? ((parseFloat(amount) * 1000) / parseInt(students)).toFixed(1) 
    : '0.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !amount || !students) return;

    onLogConsumption(selectedId, parseFloat(amount), parseInt(students));
    
    // Feedback
    setSuccessMsg(`Registro salvo! ${previewGrams}g por aluno.`);
    setTimeout(() => setSuccessMsg(''), 3000);

    // Reset fields except students (likely same for next ingredient)
    setAmount('');
    setSelectedId('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-emerald-600 p-6 text-white flex items-center gap-3">
          <ChefHat className="w-10 h-10" />
          <div>
            <h2 className="text-2xl font-bold">Registro de Consumo</h2>
            <p className="text-emerald-100">Área da Cozinha</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {successMsg && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center animate-bounce">
               ✅ {successMsg}
            </div>
          )}

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Qual alimento foi usado?
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none bg-gray-50"
              required
            >
              <option value="">Selecione um ingrediente...</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (Disp: {item.currentStock.toFixed(1)}kg)
                </option>
              ))}
            </select>
            {selectedIngredient && selectedIngredient.currentStock < 5 && (
              <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Atenção: Estoque baixo!
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Quantidade usada (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-2xl p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none pl-4"
                  placeholder="0.0"
                  required
                />
                <span className="absolute right-4 top-4 text-gray-400 font-bold">KG</span>
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Nº de Alunos Servidos
              </label>
              <input
                type="number"
                value={students}
                onChange={(e) => setStudents(e.target.value)}
                className="w-full text-2xl p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl flex items-center justify-between border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-800">
              <Calculator className="w-6 h-6" />
              <span className="font-medium">Média por Aluno:</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {previewGrams} <span className="text-sm font-normal text-emerald-600">gramas</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold py-4 rounded-xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Save className="w-6 h-6" />
            Registrar Uso
          </button>
        </form>
      </div>
    </div>
  );
};