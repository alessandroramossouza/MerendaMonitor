import { GoogleGenAI } from "@google/genai";
import { Sale, Product } from "../types";

// In a real production app, never expose keys on the client side without safeguards.
// For this demo, we assume VITE_API_KEY is available or configured in build.
const apiKey = import.meta.env.VITE_API_KEY || '';

export const analyzeBusinessData = async (sales: Sale[], products: Product[]) => {
  if (!apiKey) {
    throw new Error("API Key não configurada");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare a summary of data to save tokens
  const salesSummary = sales.map(s => ({
    item: s.productName,
    soldFor: s.salePrice,
    cost: s.costAtSale,
    profit: (s.salePrice - s.costAtSale) * s.quantity,
    date: s.timestamp.split('T')[0]
  })).slice(-50); // Analyze last 50 sales for performance

  const stockSummary = products.filter(p => p.stock < 5).map(p => ({
    item: p.name,
    stockLeft: p.stock
  }));

  const prompt = `
    Atue como um consultor de negócios sênior para uma loja de roupas.
    Analise os seguintes dados brutos de vendas e estoque:
    
    Vendas Recentes: ${JSON.stringify(salesSummary)}
    Estoque Baixo: ${JSON.stringify(stockSummary)}

    Forneça um relatório conciso em HTML (sem markdown code blocks, apenas tags html puras como <p>, <strong>, <ul>) com:
    1. Uma análise de lucro (quais itens dão mais lucro).
    2. Identificação de tendências de vendas.
    3. Alertas de reposição de estoque.
    4. Uma sugestão estratégica para aumentar o lucro na próxima semana.
    
    Seja direto e profissional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Erro na análise IA:", error);
    return "<p>Não foi possível gerar a análise no momento. Verifique sua chave de API.</p>";
  }
};