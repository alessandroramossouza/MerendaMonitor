import React, { useState, useMemo } from 'react';
import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { FileText, Download, Calendar, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
    inventory: Ingredient[];
    logs: ConsumptionLog[];
    supplyLogs: SupplyLog[];
}

export const Reports: React.FC<ReportsProps> = ({ inventory, logs, supplyLogs }) => {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Filter logs by selected month
    const filteredConsumption = useMemo(() => {
        return logs.filter(log => log.date.startsWith(selectedMonth));
    }, [logs, selectedMonth]);

    const filteredSupply = useMemo(() => {
        return supplyLogs.filter(log => log.date.startsWith(selectedMonth));
    }, [supplyLogs, selectedMonth]);

    // Calculate summary
    const summary = useMemo(() => {
        const totalConsumed = filteredConsumption.reduce((acc, log) => acc + log.amountUsed, 0);
        const totalReceived = filteredSupply.reduce((acc, log) => acc + log.amountAdded, 0);
        const totalStudents = filteredConsumption.reduce((acc, log) => acc + log.studentCount, 0);
        const uniqueDays = new Set(filteredConsumption.map(log => log.date)).size;

        return {
            totalConsumed,
            totalReceived,
            totalStudents,
            uniqueDays,
            avgStudentsPerDay: uniqueDays > 0 ? Math.round(totalStudents / uniqueDays) : 0
        };
    }, [filteredConsumption, filteredSupply]);

    // Group consumption by ingredient
    const consumptionByIngredient = useMemo(() => {
        const grouped: Record<string, number> = {};
        filteredConsumption.forEach(log => {
            grouped[log.ingredientName] = (grouped[log.ingredientName] || 0) + log.amountUsed;
        });
        return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    }, [filteredConsumption]);

    // Format month for display
    const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${months[parseInt(month) - 1]} de ${year}`;
    };

    // Generate PDF
    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text('MerendaMonitor', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Relatório Mensal - ${formatMonth(selectedMonth)}`, pageWidth / 2, 30, { align: 'center' });

        // Summary Box
        doc.setFontSize(12);
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(14, 40, pageWidth - 28, 40, 3, 3, 'FD');

        doc.setTextColor(100, 100, 100);
        doc.text('Resumo do Mês', 20, 50);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Total Recebido: ${summary.totalReceived.toFixed(1)} kg`, 20, 60);
        doc.text(`Total Consumido: ${summary.totalConsumed.toFixed(1)} kg`, 20, 68);
        doc.text(`Refeições Servidas: ${summary.totalStudents}`, pageWidth / 2, 60);
        doc.text(`Dias de Operação: ${summary.uniqueDays}`, pageWidth / 2, 68);
        doc.text(`Média Alunos/Dia: ${summary.avgStudentsPerDay}`, pageWidth / 2, 76);

        // Consumption by Ingredient Table
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Consumo por Ingrediente', 14, 95);

        autoTable(doc, {
            startY: 100,
            head: [['Ingrediente', 'Quantidade Consumida (kg)']],
            body: consumptionByIngredient.map(([name, amount]) => [name, amount.toFixed(1)]),
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 10 }
        });

        // Current Stock Table
        const finalY = (doc as any).lastAutoTable.finalY || 150;

        doc.text('Estoque Atual', 14, finalY + 15);

        autoTable(doc, {
            startY: finalY + 20,
            head: [['Produto', 'Categoria', 'Quantidade (kg)', 'Status']],
            body: inventory.map(item => [
                item.name,
                item.category,
                item.currentStock.toFixed(1),
                item.currentStock <= item.minThreshold ? '⚠️ Baixo' : '✅ OK'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 10 }
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} - Página ${i} de ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Save
        doc.save(`relatorio_merenda_${selectedMonth}.pdf`);
    };

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FileText className="text-purple-500" />
                        Relatórios
                    </h2>
                    <p className="text-gray-500">Gere relatórios mensais para prestação de contas</p>
                </div>
                <button
                    onClick={generatePDF}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 font-bold shadow-lg transition-transform active:scale-95"
                >
                    <Download className="w-5 h-5" />
                    Baixar PDF
                </button>
            </header>

            {/* Month Selector */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
                <label className="block text-lg font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    Selecione o Mês
                </label>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xl p-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 outline-none"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
                    <p className="text-sm font-medium text-gray-500">Recebido</p>
                    <h3 className="text-3xl font-bold text-green-600 mt-2">{summary.totalReceived.toFixed(1)} kg</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                    <p className="text-sm font-medium text-gray-500">Consumido</p>
                    <h3 className="text-3xl font-bold text-red-600 mt-2">{summary.totalConsumed.toFixed(1)} kg</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                    <p className="text-sm font-medium text-gray-500">Refeições</p>
                    <h3 className="text-3xl font-bold text-blue-600 mt-2">{summary.totalStudents}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
                    <p className="text-sm font-medium text-gray-500">Dias Ativos</p>
                    <h3 className="text-3xl font-bold text-amber-600 mt-2">{summary.uniqueDays}</h3>
                </div>
            </div>

            {/* Consumption Table Preview */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <BarChart3 className="text-purple-500" />
                    Consumo por Ingrediente - {formatMonth(selectedMonth)}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-purple-50 text-purple-900">
                            <tr>
                                <th className="p-4 text-left font-semibold rounded-tl-xl">Ingrediente</th>
                                <th className="p-4 text-right font-semibold rounded-tr-xl">Consumo Total (kg)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {consumptionByIngredient.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="p-8 text-center text-gray-400">Nenhum consumo registrado neste mês.</td>
                                </tr>
                            ) : (
                                consumptionByIngredient.map(([name, amount]) => (
                                    <tr key={name} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">{name}</td>
                                        <td className="p-4 text-right font-mono text-lg">{amount.toFixed(1)} kg</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
