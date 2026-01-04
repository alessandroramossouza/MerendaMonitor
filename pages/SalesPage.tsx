import React, { useState, useEffect } from 'react';
import { getProducts, processSale } from '../services/dataService';
import { Product } from '../types';
import { ShoppingBagIcon, TagIcon } from '../components/Icons';

export const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [sellPrice, setSellPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getProducts();
    // Only show products with stock > 0
    setProducts(data.filter(p => p.stock > 0));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSellClick = (product: Product) => {
    setSelectedProduct(product);
    setSellPrice(''); // Reset price so seller types it
    setSellQty(1);
  };

  const confirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !sellPrice) return;

    setIsProcessing(true);
    try {
      await processSale(selectedProduct.id, sellQty, Number(sellPrice));
      alert(`Venda realizada com sucesso!`);
      setSelectedProduct(null);
      loadProducts(); // Refresh stock
    } catch (error: any) {
      alert(error.message || "Erro na venda");
    } finally {
      setIsProcessing(false);
    }
  };

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
          <div key={product.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-48">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-mono">
                  {product.code}
                </span>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                  {product.stock} em estoque
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 line-clamp-2">{product.name}</h3>
              <p className="text-slate-400 text-sm mt-1">Custo base: R$ {product.costPrice.toFixed(2)}</p>
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

              <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-sm">
                 <span className="text-slate-500">Total da Venda:</span>
                 <span className="font-bold text-lg text-slate-800">
                   R$ {((Number(sellPrice) || 0) * sellQty).toFixed(2)}
                 </span>
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