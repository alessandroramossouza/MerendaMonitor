import { GoogleGenAI } from "@google/genai";
import { Ingredient, ConsumptionLog } from "../types";
import { calculateStockForecast } from "./forecasting";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateKitchenInsights = async (
  inventory: Ingredient[],
  logs: ConsumptionLog[]
): Promise<string> => {
  try {
    const inventorySummary = inventory
      .map(i => `- ${i.name}: ${i.currentStock}kg (Mínimo: ${i.minThreshold}kg)`)
      .join('\n');

    // Calculate Forecasts
    const forecasts = calculateStockForecast(inventory, logs);
    const riskItems = forecasts
      .filter(f => f.status === 'critical' || f.status === 'warning')
      .map(f => `- ⚠️ ${f.ingredientName}: Dura apenas ${Math.floor(f.daysRemaining)} dias (${f.averageDailyUsage.toFixed(2)}kg/dia)`)
      .join('\n');

    const safeItems = forecasts
      .filter(f => f.status === 'safe' && !f.monthlySufficiency)
      .map(f => `- ⚠️ ${f.ingredientName}: Dura ${Math.floor(f.daysRemaining)} dias, mas NÃO cobre o mês inteiro.`)
      .join('\n');


    // Get last 3 days of logs
    const recentLogs = logs.slice(-10).map(l =>
      `- ${l.date}: Usou ${l.amountUsed}kg de ${l.ingredientName} para ${l.studentCount} alunos (${l.gramsPerStudent.toFixed(1)}g/aluno)`
    ).join('\n');

    const prompt = `
      Você é um nutricionista escolar especialista e gestor de estoque. Analise os dados abaixo da cantina escolar.

      ESTOQUE ATUAL:
      ${inventorySummary}

      🚨 PREVISÃO E RISCOS (CRÍTICO):
      ${riskItems || "Nenhum item crítico no momento."}
      ${safeItems}

      CONSUMO RECENTE:
      ${recentLogs}

      Por favor, forneça:
      1. 🚨 **AÇÃO IMEDIATA**: Se houver itens na lista de "Previsão e Riscos", sugira ações urgentes (compras ou substituições).
      2. 📅 **Planejamento**: Sugestões de cardápio priorizando o que temos em abundância.
      3. 📊 **Análise de Consumo**: Comentários sobre os itens que não vão durar o mês.
      4. Dicas para evitar desperdício.

      Responda em formato Markdown, seja direto, profissional e use emojis.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Erro ao conectar com a IA. Verifique sua chave de API.";
  }
};