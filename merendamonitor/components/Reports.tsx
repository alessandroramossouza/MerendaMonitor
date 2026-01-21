import React, { useState, useMemo } from 'react';
import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { FileText, Download, Calendar, BarChart3, FileSpreadsheet, CalendarRange } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportsProps {
    inventory: Ingredient[];
    logs: ConsumptionLog[];
    supplyLogs: SupplyLog[];
}

export const Reports: React.FC<ReportsProps> = ({ inventory, logs, supplyLogs }) => {
    // Date range instead of single month
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
    });

    // Filter logs by date range
    const filteredConsumption = useMemo(() => {
        return logs.filter(log => log.date >= startDate && log.date <= endDate)
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [logs, startDate, endDate]);

    const filteredSupply = useMemo(() => {
        return supplyLogs.filter(log => log.date >= startDate && log.date <= endDate)
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [supplyLogs, startDate, endDate]);

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

    // Group consumption by day
    const consumptionByDay = useMemo(() => {
        const grouped: Record<string, { items: string[], total: number, students: number }> = {};
        filteredConsumption.forEach(log => {
            if (!grouped[log.date]) {
                grouped[log.date] = { items: [], total: 0, students: 0 };
            }
            grouped[log.date].items.push(`${log.ingredientName}: ${log.amountUsed.toFixed(1)}kg`);
            grouped[log.date].total += log.amountUsed;
            grouped[log.date].students = Math.max(grouped[log.date].students, log.studentCount);
        });
        return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredConsumption]);

    // Format date for display
    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
    };

    const formatPeriod = () => {
        return `${formatDate(startDate)} a ${formatDate(endDate)}`;
    };

    // Generate Excel
    const generateExcel = () => {
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Resumo
        const resumoData = [
            ['Relatório MerendaMonitor', formatPeriod()],
            [],
            ['Métrica', 'Valor'],
            ['Total Recebido (kg)', summary.totalReceived.toFixed(1)],
            ['Total Consumido (kg)', summary.totalConsumed.toFixed(1)],
            ['Refeições Servidas', summary.totalStudents],
            ['Dias de Operação', summary.uniqueDays],
            ['Média Alunos/Dia', summary.avgStudentsPerDay],
        ];
        const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
        XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo');

        // Sheet 2: Estoque Atual
        const estoqueData = [
            ['Produto', 'Categoria', 'Estoque (kg)', 'Mínimo (kg)', 'Status'],
            ...inventory.map(item => [
                item.name,
                item.category,
                item.currentStock,
                item.minThreshold,
                item.currentStock <= item.minThreshold ? 'Baixo' : 'OK'
            ])
        ];
        const wsEstoque = XLSX.utils.aoa_to_sheet(estoqueData);
        XLSX.utils.book_append_sheet(workbook, wsEstoque, 'Estoque Atual');

        // Sheet 3: Consumo Diário Detalhado
        const consumoData = [
            ['Data', 'Ingrediente', 'Quantidade (kg)', 'Alunos', 'Gramas/Aluno'],
            ...filteredConsumption.map(log => [
                formatDate(log.date),
                log.ingredientName,
                log.amountUsed,
                log.studentCount,
                log.gramsPerStudent.toFixed(0)
            ])
        ];
        const wsConsumo = XLSX.utils.aoa_to_sheet(consumoData);
        XLSX.utils.book_append_sheet(workbook, wsConsumo, 'Consumo Diário');

        // Sheet 4: Entradas
        const entradasData = [
            ['Data', 'Ingrediente', 'Quantidade (kg)', 'Origem', 'Validade', 'Observações'],
            ...filteredSupply.map(log => [
                formatDate(log.date),
                log.ingredientName,
                log.amountAdded,
                log.source,
                log.expirationDate ? formatDate(log.expirationDate) : '',
                log.notes || ''
            ])
        ];
        const wsEntradas = XLSX.utils.aoa_to_sheet(entradasData);
        XLSX.utils.book_append_sheet(workbook, wsEntradas, 'Entradas');

        // Save
        XLSX.writeFile(workbook, `merenda_${startDate}_${endDate}.xlsx`);
    };

    // Generate PDF
    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(16, 185, 129);
        doc.text('MerendaMonitor', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Relatório de ${formatPeriod()}`, pageWidth / 2, 28, { align: 'center' });

        // Summary Box
        doc.setFontSize(11);
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(14, 35, pageWidth - 28, 35, 3, 3, 'FD');

        doc.setTextColor(100, 100, 100);
        doc.text('Resumo do Período', 20, 44);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.text(`Total Recebido: ${summary.totalReceived.toFixed(1)} kg`, 20, 53);
        doc.text(`Total Consumido: ${summary.totalConsumed.toFixed(1)} kg`, 20, 60);
        doc.text(`Refeições Servidas: ${summary.totalStudents}`, pageWidth / 2, 53);
        doc.text(`Dias de Operação: ${summary.uniqueDays}`, pageWidth / 2, 60);
        doc.text(`Média Alunos/Dia: ${summary.avgStudentsPerDay}`, pageWidth / 2, 67);

        // Consumption by Ingredient Table
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('Consumo por Ingrediente', 14, 80);

        autoTable(doc, {
            startY: 84,
            head: [['Ingrediente', 'Total Consumido (kg)']],
            body: consumptionByIngredient.map(([name, amount]) => [name, amount.toFixed(1)]),
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 9 }
        });

        // Daily Consumption Detail
        let currentY = (doc as any).lastAutoTable.finalY + 10;

        // Check if we need a new page
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(11);
        doc.text('Consumo Diário Detalhado', 14, currentY);

        autoTable(doc, {
            startY: currentY + 4,
            head: [['Data', 'Ingrediente', 'Qtd (kg)', 'Alunos', 'g/Aluno']],
            body: filteredConsumption.map(log => [
                formatDate(log.date),
                log.ingredientName,
                log.amountUsed.toFixed(1),
                log.studentCount,
                log.gramsPerStudent.toFixed(0)
            ]),
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 50 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25 }
            }
        });

        // Current Stock Table
        currentY = (doc as any).lastAutoTable.finalY + 10;

        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(11);
        doc.text('Estoque Atual', 14, currentY);

        autoTable(doc, {
            startY: currentY + 4,
            head: [['Produto', 'Categoria', 'Qtd (kg)', 'Status']],
            body: inventory.map(item => [
                item.name,
                item.category,
                item.currentStock.toFixed(1),
                item.currentStock <= item.minThreshold ? 'BAIXO' : 'OK'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 9 }
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
        doc.save(`relatorio_merenda_${startDate}_${endDate}.pdf`);
    };

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FileText className="text-purple-500" />
                        Relatórios
                    </h2>
                    <p className="text-gray-500">Gere relatórios por período para prestação de contas</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={generateExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 font-bold shadow-lg transition-transform active:scale-95"
                    >
                        <FileSpreadsheet className="w-5 h-5" />
                        Baixar Excel
                    </button>
                    <button
                        onClick={generatePDF}
                        className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 font-bold shadow-lg transition-transform active:scale-95"
                    >
                        <Download className="w-5 h-5" />
                        Baixar PDF
                    </button>
                </div>
            </header>

            {/* Date Range Selector */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
                <label className="block text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <CalendarRange className="w-5 h-5 text-purple-500" />
                    Selecione o Período
                </label>
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Data Inicial</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-lg p-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 outline-none"
                        />
                    </div>
                    <span className="text-gray-400 text-xl mt-6">até</span>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Data Final</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-lg p-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 outline-none"
                        />
                    </div>
                </div>
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

            {/* Consumption by Ingredient */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <BarChart3 className="text-purple-500" />
                    Consumo por Ingrediente
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-purple-50 text-purple-900">
                            <tr>
                                <th className="p-4 text-left font-semibold rounded-tl-xl">Ingrediente</th>
                                <th className="p-4 text-right font-semibold rounded-tr-xl">Total (kg)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {consumptionByIngredient.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="p-8 text-center text-gray-400">Nenhum consumo no período.</td>
                                </tr>
                            ) : (
                                consumptionByIngredient.map(([name, amount]) => (
                                    <tr key={name} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">{name}</td>
                                        <td className="p-4 text-right font-mono text-lg">{amount.toFixed(1)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Daily Consumption Detail */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Calendar className="text-blue-500" />
                    Consumo Diário Detalhado
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-blue-50 text-blue-900">
                            <tr>
                                <th className="p-4 text-left font-semibold rounded-tl-xl">Data</th>
                                <th className="p-4 text-left font-semibold">Ingrediente</th>
                                <th className="p-4 text-right font-semibold">Qtd (kg)</th>
                                <th className="p-4 text-right font-semibold">Alunos</th>
                                <th className="p-4 text-right font-semibold rounded-tr-xl">g/Aluno</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredConsumption.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">Nenhum consumo no período.</td>
                                </tr>
                            ) : (
                                filteredConsumption.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-600">{formatDate(log.date)}</td>
                                        <td className="p-4 font-medium text-gray-800">{log.ingredientName}</td>
                                        <td className="p-4 text-right font-mono">{log.amountUsed.toFixed(1)}</td>
                                        <td className="p-4 text-right">{log.studentCount}</td>
                                        <td className="p-4 text-right font-mono">{log.gramsPerStudent.toFixed(0)}</td>
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
