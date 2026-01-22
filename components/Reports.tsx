import React, { useState, useMemo } from 'react';
import { Ingredient, ConsumptionLog, SupplyLog } from '../types';
import { FileText, Download, Calendar, BarChart3, FileSpreadsheet, CalendarRange } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { calculateStockForecast } from '../services/forecasting';
import { AlertTriangle, ShieldCheck, Hourglass } from 'lucide-react';


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
        return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredConsumption]);

    // Forecast Data
    const forecast = useMemo(() => calculateStockForecast(inventory, logs), [inventory, logs]);

    const forecastSummary = useMemo(() => {
        const critical = forecast.filter(f => f.status === 'critical').length;
        const warning = forecast.filter(f => f.status === 'warning').length;
        const safe = forecast.filter(f => f.status === 'safe' || f.status === 'abundant').length;
        // Items that won't last the month
        const insufficientForMonth = forecast.filter(f => !f.monthlySufficiency && f.averageDailyUsage > 0).length;

        return { critical, warning, safe, insufficientForMonth };
    }, [forecast]);


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

    // Generate PDF - Ultra Modern Professional Design
    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Colors - Enhanced Palette
        const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald 500
        const primaryDark: [number, number, number] = [6, 78, 59]; // Emerald 900
        const darkColor: [number, number, number] = [17, 24, 39]; // Gray 900
        const grayColor: [number, number, number] = [107, 114, 128]; // Gray 500
        const lightGray: [number, number, number] = [243, 244, 246]; // Gray 100

        // ===== HEADER SECTION =====
        // Modern Header with Gradient-like effect using rectangles
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 45, 'F');



        // Logo/Title
        doc.setFontSize(26);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('MerendaMonitor', 20, 24);

        // Subtitle
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('RELATÓRIO DE GESTÃO E PRESTAÇÃO DE CONTAS', 20, 34);

        // Period badge
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(pageWidth - 90, 12, 70, 22, 4, 4, 'F');

        doc.setTextColor(...primaryDark);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('PERÍODO DO RELATÓRIO', pageWidth - 85, 19);

        doc.setTextColor(...darkColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(formatPeriod(), pageWidth - 85, 28);

        // ===== METRICS CARDS SECTION =====
        const cardY = 55;
        const cardHeight = 35;
        const cardWidth = (pageWidth - 40 - 15) / 4; // 4 cards with gaps
        const cardGap = 5;

        const metrics = [
            {
                label: 'TOTAL RECEBIDO',
                value: `${summary.totalReceived.toFixed(1)} kg`,
                subtext: 'Entrada de mercadorias',
                color: [34, 197, 94] as [number, number, number]
            },
            {
                label: 'TOTAL CONSUMIDO',
                value: `${summary.totalConsumed.toFixed(1)} kg`,
                subtext: 'Saída para merenda',
                color: [239, 68, 68] as [number, number, number]
            },
            {
                label: 'REFEIÇÕES SERVIDAS',
                value: summary.totalStudents.toString(),
                subtext: 'Alunos atendidos',
                color: [59, 130, 246] as [number, number, number]
            },
            {
                label: 'DIAS DE OPERAÇÃO',
                value: summary.uniqueDays.toString(),
                subtext: 'Dias com registro',
                color: [245, 158, 11] as [number, number, number]
            },
        ];

        metrics.forEach((metric, index) => {
            const x = 20 + (cardWidth + cardGap) * index;

            // Card background with shadow effect (simulated by darker rect behind)
            doc.setFillColor(229, 231, 235); // Shadow color
            doc.roundedRect(x + 1, cardY + 1, cardWidth, cardHeight, 3, 3, 'F');

            doc.setFillColor(255, 255, 255); // White bg
            doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, 'F');

            // Top colored bar
            doc.setFillColor(...metric.color);
            doc.rect(x, cardY, cardWidth, 2, 'F');

            // Label
            doc.setFontSize(7);
            doc.setTextColor(...grayColor);
            doc.setFont('helvetica', 'bold');
            doc.text(metric.label, x + 5, cardY + 10);

            // Value
            doc.setFontSize(14);
            doc.setTextColor(...darkColor);
            doc.setFont('helvetica', 'bold');
            doc.text(metric.value, x + 5, cardY + 20);

            // Subtext
            doc.setFontSize(6);
            doc.setTextColor(...grayColor);
            doc.setFont('helvetica', 'normal');
            doc.text(metric.subtext, x + 5, cardY + 28);
        });

        // ===== CONSUMPTION BY INGREDIENT =====
        let currentY = cardY + cardHeight + 20;

        doc.setFontSize(14);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Análise de Consumo por Ingrediente', 20, currentY);

        // Modern decorative line
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1.5);
        doc.line(20, currentY + 3, 40, currentY + 3);
        doc.setDrawColor(229, 231, 235);
        doc.line(42, currentY + 3, pageWidth - 20, currentY + 3);

        autoTable(doc, {
            startY: currentY + 8,
            head: [['PRODUTO / INGREDIENTE', 'CONSUMO TOTAL (KG)']],
            body: consumptionByIngredient.map(([name, amount]) => [
                name.toUpperCase(),
                amount.toFixed(1)
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: [243, 244, 246] as [number, number, number],
                textColor: [55, 65, 81],
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'left',
                lineColor: [229, 231, 235],
                lineWidth: 0.1
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [17, 24, 39],
                cellPadding: 4,
                lineColor: [229, 231, 235],
                lineWidth: 0.1
            },
            alternateRowStyles: { fillColor: [255, 255, 255] },
            columnStyles: {
                0: { cellWidth: 120 },
                1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
            },
            margin: { left: 20, right: 20 }
        });

        // ===== DAILY CONSUMPTION DETAIL =====
        currentY = (doc as any).lastAutoTable.finalY + 15;

        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Registro Diário de Consumo', 20, currentY);

        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(1);
        doc.line(20, currentY + 2, 78, currentY + 2);

        autoTable(doc, {
            startY: currentY + 6,
            head: [['Data', 'Ingrediente', 'Quantidade', 'Alunos', 'g/Aluno']],
            body: filteredConsumption.map(log => [
                formatDate(log.date),
                log.ingredientName,
                `${log.amountUsed.toFixed(1)} kg`,
                log.studentCount.toString(),
                `${log.gramsPerStudent.toFixed(0)}g`
            ]),
            theme: 'plain',
            headStyles: {
                fillColor: [59, 130, 246] as [number, number, number],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 2.5
            },
            alternateRowStyles: { fillColor: [239, 246, 255] },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 55 },
                2: { cellWidth: 28, halign: 'right' },
                3: { cellWidth: 22, halign: 'center' },
                4: { cellWidth: 22, halign: 'right' }
            },
            margin: { left: 20, right: 20 }
        });

        // ===== CURRENT STOCK =====
        currentY = (doc as any).lastAutoTable.finalY + 15;

        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Estoque Atual', 20, currentY);

        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.line(20, currentY + 2, 52, currentY + 2);

        autoTable(doc, {
            startY: currentY + 6,
            head: [['Produto', 'Categoria', 'Estoque', 'Status']],
            body: inventory.map(item => [
                item.name,
                item.category,
                `${item.currentStock.toFixed(1)} kg`,
                item.currentStock <= item.minThreshold ? 'BAIXO' : 'OK'
            ]),
            theme: 'plain',
            headStyles: {
                fillColor: [...primaryColor] as [number, number, number],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 4
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 3
            },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 40 },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 25, halign: 'center' }
            },
            didParseCell: (data) => {
                if (data.column.index === 3 && data.section === 'body') {
                    if (data.cell.raw === 'BAIXO') {
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = 'bold';
                    } else {
                        data.cell.styles.textColor = [22, 163, 74];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
            margin: { left: 20, right: 20 }
        });

        // ===== FOOTER =====
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Footer line
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.5);
            doc.line(20, pageHeight - 18, pageWidth - 20, pageHeight - 18);

            // Footer text
            doc.setFontSize(8);
            doc.setTextColor(...grayColor);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
                20,
                pageHeight - 10
            );
            doc.text(
                `Página ${i} de ${pageCount}`,
                pageWidth - 20,
                pageHeight - 10,
                { align: 'right' }
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
            {/* Forecast / Sufficiency Dashboard */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
                <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
                    <Hourglass className="text-indigo-600" />
                    Previsão de Suficiência (Estoque vs. Consumo)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-red-200 flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-full">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Risco Imediato (&lt;7 dias)</p>
                            <h4 className="text-2xl font-bold text-red-700">{forecastSummary.critical} Itens</h4>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-200 flex items-center gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Não dura o mês</p>
                            <h4 className="text-2xl font-bold text-amber-700">{forecastSummary.insufficientForMonth} Itens</h4>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-200 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Estoque Seguro</p>
                            <h4 className="text-2xl font-bold text-emerald-700">{forecastSummary.safe} Itens</h4>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
                    <table className="w-full">
                        <thead className="bg-indigo-50 text-indigo-900">
                            <tr>
                                <th className="p-4 text-left font-semibold">Produto</th>
                                <th className="p-4 text-right font-semibold">Consumo Diário</th>
                                <th className="p-4 text-right font-semibold">Dias Restantes</th>
                                <th className="p-4 text-center font-semibold">Previsão Fim</th>
                                <th className="p-4 text-center font-semibold text-xs">Status Mês</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {forecast
                                .filter(f => f.averageDailyUsage > 0)
                                .sort((a, b) => a.daysRemaining - b.daysRemaining)
                                .slice(0, 5) // Show top 5 critical
                                .map(f => (
                                    <tr key={f.ingredientId} className={f.daysRemaining < 15 ? 'bg-red-50/30' : ''}>
                                        <td className="p-4 font-medium text-gray-800">{f.ingredientName}</td>
                                        <td className="p-4 text-right">{f.averageDailyUsage.toFixed(2)} kg/dia</td>
                                        <td className="p-4 text-right font-bold">
                                            <span className={f.daysRemaining < 7 ? 'text-red-600' : f.daysRemaining < 15 ? 'text-amber-600' : 'text-emerald-600'}>
                                                {Math.floor(f.daysRemaining)} dias
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-gray-500">
                                            {f.projectedStockoutDate?.toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4 text-center">
                                            {!f.monthlySufficiency ? (
                                                <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded">FALTARÁ</span>
                                            ) : (
                                                <span className="text-emerald-600 font-bold text-xs bg-emerald-100 px-2 py-1 rounded">COBRE</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            {forecast.filter(f => f.averageDailyUsage > 0).length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Sem dados de consumo suficientes para previsão.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <div className="p-3 text-center text-indigo-500 text-xs font-medium border-t border-indigo-50 hover:bg-indigo-50 cursor-pointer">
                        Ver Lista Completa de Previsões
                    </div>
                </div>
            </div>

        </div>
    );
};

