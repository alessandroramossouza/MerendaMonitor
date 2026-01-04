import React, { useState, useEffect } from 'react';
import { getSales, getProducts, subscribeToSales, subscribeToProducts } from '../services/dataService';
import { analyzeBusinessData } from '../services/geminiService';
import { Sale, Product } from '../types';
import { ChartIcon, SparklesIcon } from '../components/Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AdminPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();

    const unsubSales = subscribeToSales(() => loadData());
    const unsubProducts = subscribeToProducts(() => loadData());

    return () => {
      unsubSales();
      unsubProducts();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [sData, pData] = await Promise.all([getSales(), getProducts()]);
    setSales(sData);
    setProducts(pData);
    setLoading(false);
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    const result = await analyzeBusinessData(sales, products);
    setAiAnalysis(result || "Sem dados suficientes.");
    setAnalyzing(false);
  };

  // Calculations
  const totalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0);
  const totalCost = sales.reduce((acc, curr) => acc + (curr.costAtSale * curr.quantity), 0);
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Chart Data Preparation (Group by product)
  const chartData = sales.reduce((acc: any[], sale) => {
    const existing = acc.find(item => item.name === sale.productName);
    const profit = (sale.salePrice - sale.costAtSale) * sale.quantity;
    if (existing) {
      existing.profit += profit;
      existing.revenue += sale.total;
    } else {
      acc.push({ name: sale.productName, profit, revenue: sale.total });
    }
    return acc;
  }, []).sort((a, b) => b.profit - a.profit).slice(0, 5); // Top 5

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ChartIcon className="text-purple-600" />
            Painel Administrativo
          </h2>
          <p className="text-slate-500">Acompanhe o lucro e performance da loja.</p>
        </div>
        <button
          onClick={loadData}
          className="text-sm text-blue-600 hover:underline"
        >
          Atualizar Dados
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Vendas Totais</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{sales.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Faturamento</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">R$ {totalRevenue.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Custo Total</p>
          <h3 className="text-2xl font-bold text-slate-600 mt-1">R$ {totalCost.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-2 bg-purple-500"></div>
          <p className="text-slate-500 text-sm font-medium">Lucro Líquido</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">R$ {totalProfit.toFixed(2)}</h3>
          <p className="text-xs text-purple-400 mt-1 font-medium">Margem: {margin.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-96">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">
            Histórico de Vendas
          </div>
          <div className="overflow-auto flex-1 p-0">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                <tr>
                  <th className="px-4 py-2">Produto</th>
                  <th className="px-4 py-2 text-right">Compra</th>
                  <th className="px-4 py-2 text-right">Venda</th>
                  <th className="px-4 py-2 text-right">Lucro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map(sale => {
                  const profit = (sale.salePrice - sale.costAtSale) * sale.quantity;
                  return (
                    <tr key={sale.id}>
                      <td className="px-4 py-2 truncate max-w-[150px]">{sale.productName} <span className="text-xs text-slate-400">x{sale.quantity}</span></td>
                      <td className="px-4 py-2 text-right text-slate-400">R$ {sale.costAtSale.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-800">R$ {sale.salePrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-600">+ R$ {profit.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl shadow-lg text-white p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <SparklesIcon className="text-yellow-400" />
              IA Smart Insights
            </h3>
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || sales.length === 0}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
            >
              {analyzing ? 'Analisando...' : 'Gerar Relatório'}
            </button>
          </div>

          <div className="flex-1 bg-white/5 rounded-lg p-4 overflow-y-auto text-sm leading-relaxed border border-white/10">
            {aiAnalysis ? (
              <div dangerouslySetInnerHTML={{ __html: aiAnalysis }} className="space-y-2 [&_strong]:text-yellow-200 [&_ul]:list-disc [&_ul]:pl-4" />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/50 text-center">
                <p>Clique em "Gerar Relatório" para usar o Gemini AI.</p>
                <p className="text-xs mt-2 max-w-xs">Ele analisará suas vendas e identificará oportunidades de lucro automaticamente.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4">Top 5 Produtos por Lucratividade</h3>
        <div className="h-64 w-full">
          {sales.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Lucro']}
                />
                <Bar dataKey="profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              Registre vendas para ver o gráfico.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};