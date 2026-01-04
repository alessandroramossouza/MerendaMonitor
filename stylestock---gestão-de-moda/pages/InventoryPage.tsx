import React, { useState, useEffect } from 'react';
import { getProducts, addProduct, subscribeToProducts } from '../services/dataService';
import { Product } from '../types';
import { PlusIcon, BoxIcon } from '../components/Icons';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Geral');

  useEffect(() => {
    loadProducts();
    const unsubscribe = subscribeToProducts(() => {
      loadProducts();
    });
    return () => unsubscribe();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !costPrice || !stock) return;

    try {
      await addProduct({
        code,
        name,
        costPrice: Number(costPrice),
        stock: Number(stock),
        category
      });

      // Reset Form
      setCode('');
      setName('');
      setCostPrice('');
      setStock('');

      // Refresh list
      loadProducts();
    } catch (error) {
      alert("Erro ao salvar produto");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BoxIcon className="text-blue-600" />
              Gerenciar Estoque
            </h2>
            <p className="text-slate-500">Cadastre novas roupas e controle a entrada de mercadorias.</p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 animate-pulse">
            ● v2.0 ONLINE
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1 h-fit">
          <h3 className="font-semibold text-lg mb-4 text-slate-700">Novo Item</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código da Roupa</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: LC-CAM-001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome / Descrição</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Camiseta Lacoste Preta M"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Cadastrar Item
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700">Estoque Atual</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-medium text-xs">
                <tr>
                  <th className="px-6 py-3">Código</th>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Custo Unit.</th>
                  <th className="px-6 py-3 text-center">Estoque</th>
                  <th className="px-6 py-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Nenhum item cadastrado.
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-600">{product.code}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                      <td className="px-6 py-4">R$ {product.costPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {product.stock} un
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        R$ {(product.costPrice * product.stock).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};