import { GoogleGenAI } from "@google/genai";
import { Ingredient, ConsumptionLog } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateKitchenInsights = async (
  inventory: Ingredient[],
  logs: ConsumptionLog[]
): Promise<string> => {
  try {
    const inventorySummary = inventory
      .map(i => `- ${i.name}: ${i.currentStock}kg (Mínimo: ${i.minThreshold}kg)`)
      .join('\n');

    // Get last 3 days of logs
    const recentLogs = logs.slice(-10).map(l =>
      `- ${l.date}: Usou ${l.amountUsed}kg de ${l.ingredientName} para ${l.studentCount} alunos (${l.gramsPerStudent.toFixed(1)}g/aluno)`
    ).join('\n');

    const prompt = `
      Você é um nutricionista escolar especialista e gestor de estoque. Analise os dados abaixo da cantina escolar.

      ESTOQUE ATUAL:
      ${inventorySummary}

      CONSUMO RECENTE:
      ${recentLogs}

      Por favor, forneça:
      1. Sugestões de cardápio baseadas no que temos muito no estoque.
      2. Alertas nutricionais se o consumo por aluno (gramas/aluno) parecer muito baixo ou muito alto.
      3. Dicas para evitar desperdício baseadas nos itens com estoque crítico.

      Responda em formato Markdown, seja conciso, profissional e use emojis para facilitar a leitura.
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