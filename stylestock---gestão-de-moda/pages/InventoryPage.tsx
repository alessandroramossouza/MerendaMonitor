import React, { useState, useEffect, useMemo } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, subscribeToProducts } from '../services/dataService';
import { Product } from '../types';
import { PlusIcon, BoxIcon } from '../components/Icons';
import jsPDF from 'jspdf';

// Icons
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

type SortField = 'name' | 'stock' | 'costPrice' | 'value';
type StockFilter = 'all' | 'low' | 'ok';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter State
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [margin, setMargin] = useState('50');
  const [stock, setStock] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editMargin, setEditMargin] = useState('');
  const [editStock, setEditStock] = useState('');
  const [exporting, setExporting] = useState(false);

  // Calculated suggested price
  const suggestedPrice = useMemo(() => {
    const cost = parseFloat(costPrice) || 0;
    const m = parseFloat(margin) || 0;
    return cost * (1 + m / 100);
  }, [costPrice, margin]);

  const editSuggestedPrice = useMemo(() => {
    const cost = parseFloat(editCostPrice) || 0;
    const m = parseFloat(editMargin) || 0;
    return cost * (1 + m / 100);
  }, [editCostPrice, editMargin]);

  useEffect(() => {
    loadProducts();
    const unsubscribe = subscribeToProducts(() => loadProducts());
    return () => unsubscribe();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s));
    }

    // Stock filter
    if (stockFilter === 'low') result = result.filter(p => p.stock <= 5);
    if (stockFilter === 'ok') result = result.filter(p => p.stock > 5);

    // Sort
    result.sort((a, b) => {
      let valueA: any, valueB: any;
      if (sortField === 'name') { valueA = a.name; valueB = b.name; }
      else if (sortField === 'stock') { valueA = a.stock; valueB = b.stock; }
      else if (sortField === 'costPrice') { valueA = a.costPrice; valueB = b.costPrice; }
      else if (sortField === 'value') { valueA = a.costPrice * a.stock; valueB = b.costPrice * b.stock; }

      if (typeof valueA === 'string') return sortAsc ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      return sortAsc ? valueA - valueB : valueB - valueA;
    });

    return result;
  }, [products, search, stockFilter, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !costPrice || !stock) return;

    try {
      await addProduct({
        code,
        name,
        costPrice: Number(costPrice),
        margin: Number(margin),
        suggestedPrice: suggestedPrice,
        stock: Number(stock),
        category: 'Geral'
      });
      setCode(''); setName(''); setCostPrice(''); setMargin('50'); setStock('');
      loadProducts();
    } catch (error) {
      alert("Erro ao salvar produto");
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditCode(product.code);
    setEditName(product.name);
    setEditCostPrice(product.costPrice.toString());
    setEditMargin((product.margin || 50).toString());
    setEditStock(product.stock.toString());
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => { setIsEditModalOpen(false); setEditingProduct(null); };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct.id, {
        code: editCode,
        name: editName,
        costPrice: Number(editCostPrice),
        margin: Number(editMargin),
        suggestedPrice: editSuggestedPrice,
        stock: Number(editStock),
      });
      closeEditModal();
      loadProducts();
    } catch (error) {
      alert("Erro ao atualizar produto");
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Excluir "${product.name}"?`)) return;
    try { await deleteProduct(product.id); loadProducts(); } catch { alert("Erro ao excluir"); }
  };

  const exportStockPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('StyleStock', 20, 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Relatório de Estoque Atual', 20, 32);
      doc.setFontSize(9);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 20, 32, { align: 'right' });

      let yPos = 55;
      const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
      const totalValue = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.text('RESUMO DO ESTOQUE', 20, yPos);
      yPos += 10;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${products.length} Produtos`, 30, yPos + 10);
      doc.text(`${totalItems} Itens`, 80, yPos + 10);
      doc.text(`R$ ${totalValue.toFixed(2)} Valor Total`, 130, yPos + 10);

      yPos += 40;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, yPos, pageWidth - 40, 10, 'F');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CÓDIGO', 25, yPos + 7);
      doc.text('PRODUTO', 50, yPos + 7);
      doc.text('CUSTO', 105, yPos + 7);
      doc.text('MARGEM', 125, yPos + 7);
      doc.text('PREÇO VENDA', 150, yPos + 7);
      doc.text('ESTOQUE', 185, yPos + 7);

      yPos += 10;
      doc.setFont('helvetica', 'normal');

      products.forEach((product, index) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        if (index % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(20, yPos, pageWidth - 40, 10, 'F'); }

        doc.setTextColor(37, 99, 235);
        doc.setFontSize(8);
        doc.text(product.code.substring(0, 10), 25, yPos + 7);
        doc.setTextColor(30, 41, 59);
        doc.text(product.name.substring(0, 20), 50, yPos + 7);
        doc.setTextColor(100, 116, 139);
        doc.text(`R$ ${product.costPrice.toFixed(2)}`, 105, yPos + 7);
        doc.text(`${product.margin || 50}%`, 125, yPos + 7);
        doc.setTextColor(16, 185, 129);
        doc.text(`R$ ${product.suggestedPrice?.toFixed(2) || '-'}`, 150, yPos + 7);
        doc.setTextColor(product.stock <= 5 ? 220 : 22, product.stock <= 5 ? 38 : 163, product.stock <= 5 ? 38 : 74);
        doc.text(`${product.stock} un`, 185, yPos + 7);
        yPos += 10;
      });

      doc.save(`Estoque_StyleStock_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      alert('Erro ao exportar PDF');
    }
    setExporting(false);
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
          <button onClick={exportStockPDF} disabled={exporting || products.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 text-sm">
            <DownloadIcon />
            {exporting ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>
      </header>

      {/* Add Product Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h3 className="font-semibold text-lg text-white flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Cadastrar Novo Produto
          </h3>
          <p className="text-blue-100 text-sm">Preencha os dados do produto para adicionar ao estoque</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Row 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                📦 Código do Produto
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: LC-CAM-001"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-slate-50 hover:bg-white"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🏷️ Nome / Descrição
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Camiseta Lacoste Polo Preta Tamanho M"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-slate-50 hover:bg-white"
                required
              />
            </div>
          </div>

          {/* Row 2: Pricing & Stock */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                💰 Custo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-slate-50 hover:bg-white text-center font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                📊 Margem (%)
              </label>
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                placeholder="50"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-slate-50 hover:bg-white text-center font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                ✨ Preço de Venda
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl text-emerald-700 font-bold text-center text-lg">
                R$ {suggestedPrice.toFixed(2)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                📦 Quantidade
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-slate-50 hover:bg-white text-center font-medium"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Cadastrar</span>
            </button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-slate-400 mt-4 text-center">
            💡 O preço de venda é calculado automaticamente: Custo + Margem%
          </p>
        </form>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStockFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${stockFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Todos ({products.length})
          </button>
          <button onClick={() => setStockFilter('low')} className={`px-4 py-2 rounded-lg text-sm font-medium ${stockFilter === 'low' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
            Baixo ({products.filter(p => p.stock <= 5).length})
          </button>
          <button onClick={() => setStockFilter('ok')} className={`px-4 py-2 rounded-lg text-sm font-medium ${stockFilter === 'ok' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
            OK ({products.filter(p => p.stock > 5).length})
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-700">Estoque Atual ({filteredProducts.length} itens)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-medium text-xs">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                  Produto {sortField === 'name' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('costPrice')}>
                  Custo {sortField === 'costPrice' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3">Margem</th>
                <th className="px-4 py-3">Preço Venda</th>
                <th className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100" onClick={() => handleSort('stock')}>
                  Estoque {sortField === 'stock' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('value')}>
                  Valor Total {sortField === 'value' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Nenhum item encontrado.</td></tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{product.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                    <td className="px-4 py-3">R$ {product.costPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500">{product.margin || 50}%</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">R$ {(product.suggestedPrice || product.costPrice * 1.5).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {product.stock} un
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">R$ {(product.costPrice * product.stock).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(product)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><EditIcon /></button>
                        <button onClick={() => handleDelete(product)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-800">Editar Produto</h3>
              <button onClick={closeEditModal} className="p-1 hover:bg-slate-100 rounded-lg"><CloseIcon /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                  <input type="text" value={editCode} onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Custo (R$)</label>
                  <input type="number" step="0.01" value={editCostPrice} onChange={(e) => setEditCostPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Margem (%)</label>
                  <input type="number" value={editMargin} onChange={(e) => setEditMargin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preço Sugerido</label>
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-medium">
                    R$ {editSuggestedPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                  <input type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeEditModal} className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};