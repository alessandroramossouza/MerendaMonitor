import React, { useState, useEffect, useRef } from 'react';
import { getSales, getProducts } from '../services/dataService';
import { Sale, Product } from '../types';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Icons
const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const ReportsPage: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Period Filter
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [sData, pData] = await Promise.all([getSales(), getProducts()]);
        setSales(sData);
        setProducts(pData);
        setLoading(false);
    };

    // Filter sales by period
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
        return saleDate >= startDate && saleDate <= endDate;
    });

    // Calculations
    const totalRevenue = filteredSales.reduce((acc, curr) => acc + curr.total, 0);
    const totalCost = filteredSales.reduce((acc, curr) => acc + (curr.costAtSale * curr.quantity), 0);
    const totalProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const totalQuantitySold = filteredSales.reduce((acc, curr) => acc + curr.quantity, 0);
    const averageTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    // Stock value
    const totalStockValue = products.reduce((acc, curr) => acc + (curr.costPrice * curr.stock), 0);
    const totalStockItems = products.reduce((acc, curr) => acc + curr.stock, 0);

    // Sales by product (Pie Chart)
    const salesByProduct = filteredSales.reduce((acc: any[], sale) => {
        const existing = acc.find(item => item.name === sale.productName);
        if (existing) {
            existing.value += sale.total;
            existing.quantity += sale.quantity;
        } else {
            acc.push({ name: sale.productName, value: sale.total, quantity: sale.quantity });
        }
        return acc;
    }, []).sort((a, b) => b.value - a.value);

    // Daily sales trend (Line Chart)
    const dailySales = filteredSales.reduce((acc: any, sale) => {
        const date = new Date(sale.timestamp).toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = { date, revenue: 0, profit: 0, count: 0 };
        }
        acc[date].revenue += sale.total;
        acc[date].profit += (sale.salePrice - sale.costAtSale) * sale.quantity;
        acc[date].count += 1;
        return acc;
    }, {});

    const dailySalesArray = Object.values(dailySales).sort((a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Low stock products
    const lowStockProducts = products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);

    // Export PDF function
    const exportToPDF = async () => {
        if (!reportRef.current) return;

        setExporting(true);

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#f8fafc'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;

            // Add multiple pages if needed
            let heightLeft = imgHeight * ratio;
            let position = 0;

            while (heightLeft > 0) {
                pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
                heightLeft -= pdfHeight;
                position -= pdfHeight;
                if (heightLeft > 0) {
                    pdf.addPage();
                }
            }

            const fileName = `Relatorio_StyleStock_${startDate}_${endDate}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Erro ao exportar PDF');
        }

        setExporting(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="space-y-6">
            {/* Header with Export Button */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileTextIcon />
                        Relatórios
                    </h2>
                    <p className="text-slate-500">Relatório detalhado de vendas, faturamento e estoque.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Period Selector */}
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <CalendarIcon />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border-none bg-transparent text-sm focus:outline-none"
                        />
                        <span className="text-slate-400">até</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border-none bg-transparent text-sm focus:outline-none"
                        />
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={exportToPDF}
                        disabled={exporting}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
                    >
                        <DownloadIcon />
                        {exporting ? 'Exportando...' : 'Exportar PDF'}
                    </button>
                </div>
            </header>

            {/* Report Content (for PDF export) */}
            <div ref={reportRef} className="space-y-6 bg-slate-50 p-1">
                {/* Report Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
                                <h1 className="text-2xl font-bold">StyleStock</h1>
                            </div>
                            <p className="text-slate-300 text-sm">Relatório de Vendas e Estoque</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold">Período do Relatório</p>
                            <p className="text-slate-300">
                                {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} — {new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Vendas no Período</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-2">{filteredSales.length}</h3>
                        <p className="text-xs text-slate-400 mt-1">{totalQuantitySold} itens vendidos</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Faturamento</p>
                        <h3 className="text-3xl font-bold text-blue-600 mt-2">R$ {totalRevenue.toFixed(2)}</h3>
                        <p className="text-xs text-slate-400 mt-1">Ticket médio: R$ {averageTicket.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Custo dos Produtos</p>
                        <h3 className="text-3xl font-bold text-slate-600 mt-2">R$ {totalCost.toFixed(2)}</h3>
                        <p className="text-xs text-slate-400 mt-1">Base para cálculo de lucro</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border-2 border-purple-200 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                        <p className="text-purple-600 text-xs font-medium uppercase tracking-wide">Lucro Líquido</p>
                        <h3 className="text-3xl font-bold text-purple-600 mt-2">R$ {totalProfit.toFixed(2)}</h3>
                        <p className="text-xs text-purple-400 mt-1">Margem: {margin.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Trend Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-700 mb-4">📈 Evolução Diária de Vendas</h3>
                        <div className="h-64 w-full">
                            {dailySalesArray.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailySalesArray}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatDate} />
                                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            formatter={(value: number, name: string) => [`R$ ${value.toFixed(2)}`, name === 'revenue' ? 'Faturamento' : 'Lucro']}
                                            labelFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" name="Faturamento" />
                                        <Area type="monotone" dataKey="profit" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProfit)" name="Lucro" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    Nenhuma venda no período selecionado.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sales by Product Pie Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-700 mb-4">🥧 Vendas por Produto</h3>
                        <div className="h-64 w-full">
                            {salesByProduct.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={salesByProduct.slice(0, 6)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {salesByProduct.slice(0, 6).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    Nenhuma venda no período selecionado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stock Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stock Summary */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-xl text-white">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            📦 Resumo do Estoque
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-emerald-100 text-sm">Itens em Estoque</p>
                                <p className="text-3xl font-bold">{totalStockItems} un</p>
                            </div>
                            <div>
                                <p className="text-emerald-100 text-sm">Valor Total do Estoque</p>
                                <p className="text-3xl font-bold">R$ {totalStockValue.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-emerald-100 text-sm">Produtos Cadastrados</p>
                                <p className="text-2xl font-bold">{products.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            ⚠️ Produtos com Estoque Baixo (≤ 5 unidades)
                        </h3>
                        {lowStockProducts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-red-50 text-red-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left rounded-l-lg">Produto</th>
                                            <th className="px-4 py-2 text-center">Código</th>
                                            <th className="px-4 py-2 text-center">Estoque</th>
                                            <th className="px-4 py-2 text-right rounded-r-lg">Custo Unit.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {lowStockProducts.slice(0, 5).map(product => (
                                            <tr key={product.id} className="hover:bg-red-50/50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                                                <td className="px-4 py-3 text-center font-mono text-xs text-blue-600">{product.code}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                        {product.stock} un
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-600">R$ {product.costPrice.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                ✅ Todos os produtos estão com estoque adequado!
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed Sales Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-700">📋 Detalhamento de Vendas no Período</h3>
                        <span className="text-sm text-slate-500">{filteredSales.length} registros</span>
                    </div>
                    <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left">Data</th>
                                    <th className="px-4 py-3 text-left">Produto</th>
                                    <th className="px-4 py-3 text-center">Qtd</th>
                                    <th className="px-4 py-3 text-right">Custo</th>
                                    <th className="px-4 py-3 text-right">Venda</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 text-right">Lucro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                            Nenhuma venda encontrada no período selecionado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map(sale => {
                                        const profit = (sale.salePrice - sale.costAtSale) * sale.quantity;
                                        return (
                                            <tr key={sale.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-slate-500 text-xs">
                                                    {new Date(sale.timestamp).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-900">{sale.productName}</td>
                                                <td className="px-4 py-3 text-center">{sale.quantity}</td>
                                                <td className="px-4 py-3 text-right text-slate-500">R$ {sale.costAtSale.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right text-slate-700">R$ {sale.salePrice.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-medium">R$ {sale.total.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600">+ R$ {profit.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-400 py-4">
                    Relatório gerado automaticamente pelo StyleStock • {new Date().toLocaleString('pt-BR')}
                </div>
            </div>
        </div>
    );
};
