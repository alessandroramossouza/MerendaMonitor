import React, { useState, useEffect } from 'react';
import { getSales, getProducts } from '../services/dataService';
import { Sale, Product, PAYMENT_METHODS } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

// Icons
const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export const DashboardPage: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

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

    // Today's date
    const today = new Date().toISOString().split('T')[0];

    // Today's sales
    const todaySales = sales.filter(s => s.timestamp?.split('T')[0] === today);
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
    const todayProfit = todaySales.reduce((acc, s) => acc + ((s.salePrice - s.costAtSale) * s.quantity), 0);

    // This month
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthSales = sales.filter(s => s.timestamp?.slice(0, 7) === thisMonth);
    const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);

    // Low stock products
    const lowStockProducts = products.filter(p => p.stock <= 5);

    // Last 5 sales
    const recentSales = sales.slice(0, 5);

    // Sales by payment method
    const paymentStats = PAYMENT_METHODS.map(pm => ({
        name: pm.label,
        value: sales.filter(s => s.paymentMethod === pm.value).reduce((acc, s) => acc + s.total, 0)
    })).filter(p => p.value > 0);

    // Last 7 days trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
    });

    const trendData = last7Days.map(date => {
        const daySales = sales.filter(s => s.timestamp?.split('T')[0] === date);
        return {
            date: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
            revenue: daySales.reduce((acc, s) => acc + s.total, 0),
        };
    });

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <HomeIcon />
                    Dashboard
                </h2>
                <p className="text-slate-500">Visão geral do seu negócio</p>
            </header>

            {/* Today's Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white shadow-lg shadow-blue-500/25">
                    <p className="text-blue-100 text-sm font-medium">Vendas Hoje</p>
                    <h3 className="text-3xl font-bold mt-1">{todaySales.length}</h3>
                    <p className="text-blue-200 text-xs mt-2">transações</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-xl text-white shadow-lg shadow-emerald-500/25">
                    <p className="text-emerald-100 text-sm font-medium">Faturamento Hoje</p>
                    <h3 className="text-3xl font-bold mt-1">R$ {todayRevenue.toFixed(2)}</h3>
                    <p className="text-emerald-200 text-xs mt-2">lucro: R$ {todayProfit.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl text-white shadow-lg shadow-purple-500/25">
                    <p className="text-purple-100 text-sm font-medium">Faturamento Mês</p>
                    <h3 className="text-3xl font-bold mt-1">R$ {monthRevenue.toFixed(2)}</h3>
                    <p className="text-purple-200 text-xs mt-2">{monthSales.length} vendas este mês</p>
                </div>
                <div className={`p-5 rounded-xl ${lowStockProducts.length > 0 ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25' : 'bg-white border border-slate-200'}`}>
                    <p className={`text-sm font-medium ${lowStockProducts.length > 0 ? 'text-red-100' : 'text-slate-500'}`}>Estoque Baixo</p>
                    <h3 className={`text-3xl font-bold mt-1 ${lowStockProducts.length > 0 ? 'text-white' : 'text-slate-800'}`}>{lowStockProducts.length}</h3>
                    <p className={`text-xs mt-2 ${lowStockProducts.length > 0 ? 'text-red-200' : 'text-slate-400'}`}>produtos com ≤5 un</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-slate-700 mb-4">📈 Vendas - Últimos 7 dias</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" fontSize={11} stroke="#94a3b8" />
                                <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={v => `R$${v}`} />
                                <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']} />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-slate-700 mb-4">💳 Formas de Pagamento</h3>
                    <div className="h-64">
                        {paymentStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {paymentStats.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Total']} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Sem dados de pagamento
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sales */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-semibold text-slate-700">🕐 Últimas Vendas</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentSales.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">Nenhuma venda registrada</div>
                        ) : (
                            recentSales.map(sale => (
                                <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                    <div>
                                        <p className="font-medium text-slate-800">{sale.productName}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(sale.timestamp).toLocaleString('pt-BR')} • {sale.quantity}x
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600">R$ {sale.total.toFixed(2)}</p>
                                        <p className="text-xs text-slate-400 capitalize">{sale.paymentMethod?.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-red-50">
                        <h3 className="font-semibold text-red-700">⚠️ Alertas de Estoque Baixo</h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-80 overflow-auto">
                        {lowStockProducts.length === 0 ? (
                            <div className="p-6 text-center text-slate-400">✅ Todo estoque está OK!</div>
                        ) : (
                            lowStockProducts.map(product => (
                                <div key={product.id} className="p-4 flex items-center justify-between hover:bg-red-50/50">
                                    <div>
                                        <p className="font-medium text-slate-800">{product.name}</p>
                                        <p className="text-xs text-slate-400 font-mono">{product.code}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                                        {product.stock} un
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
