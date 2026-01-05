import React, { useState, useEffect } from 'react';
import { getProducts, processSale, getCustomers } from '../services/dataService';
import { Product, Customer, PaymentMethod, PAYMENT_METHODS } from '../types';
import { ShoppingBagIcon } from '../components/Icons';

export const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [sellPrice, setSellPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [pData, cData] = await Promise.all([getProducts(), getCustomers()]);
    setProducts(pData.filter(p => p.stock > 0));
    setCustomers(cData);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSellClick = (product: Product) => {
    setSelectedProduct(product);
    setSellPrice(product.suggestedPrice?.toFixed(2) || '');
    setSellQty(1);
    setPaymentMethod('dinheiro');
    setSelectedCustomerId('');
  };

  const confirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !sellPrice) return;

    setIsProcessing(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      await processSale(
        selectedProduct.id,
        sellQty,
        Number(sellPrice),
        paymentMethod,
        selectedCustomerId || undefined,
        customer?.name
      );
      alert(`Venda realizada com sucesso!`);
      setSelectedProduct(null);
      loadData();
    } catch (error: any) {
      alert(error.message || "Erro na venda");
    } finally {
      setIsProcessing(false);
    }
  };

  const profit = selectedProduct ? (Number(sellPrice) - selectedProduct.costPrice) * sellQty : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBagIcon className="text-emerald-600" />
            Frente de Caixa (PDV)
          </h2>
          <p className="text-slate-500">Selecione o produto e registre a venda.</p>
        </div>
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Buscar por código ou nome..."
            className="w-full px-4 py-2 rounded-full border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-52">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-mono">
                  {product.code}
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${product.stock <= 5 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                  {product.stock} em estoque
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 line-clamp-2">{product.name}</h3>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-slate-400 text-xs">Custo: R$ {product.costPrice.toFixed(2)}</p>
                <p className="text-emerald-600 font-bold text-sm">R$ {(product.suggestedPrice || product.costPrice * 1.5).toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={() => handleSellClick(product)}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Vender
            </button>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            Nenhum produto encontrado com estoque disponível.
          </div>
        )}
      </div>

      {/* Sale Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-emerald-600 p-4 text-white">
              <h3 className="font-bold text-lg">Registrar Venda</h3>
              <p className="text-emerald-100 text-sm">{selectedProduct.code} - {selectedProduct.name}</p>
            </div>

            <form onSubmit={confirmSale} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={sellQty}
                    onChange={(e) => setSellQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor Venda (Unit.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold text-lg text-emerald-700"
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${paymentMethod === pm.value
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente (opcional)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- Sem cliente --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total da Venda:</span>
                  <span className="font-bold text-lg text-slate-800">
                    R$ {((Number(sellPrice) || 0) * sellQty).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Lucro estimado:</span>
                  <span className={`font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Processando...' : 'Confirmar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};