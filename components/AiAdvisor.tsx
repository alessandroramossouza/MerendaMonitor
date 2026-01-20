import React, { useState } from 'react';
import { Ingredient, ConsumptionLog } from '../types';
import { generateKitchenInsights } from '../services/geminiService';
import { Sparkles, RefreshCw, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AiAdvisorProps {
  inventory: Ingredient[];
  logs: ConsumptionLog[];
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ inventory, logs }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateKitchenInsights(inventory, logs);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-purple-600" />
            Nutri IA Insights
          </h2>
          <p className="text-gray-500">Inteligência artificial analisando seu estoque e consumo.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-purple-200'
          }`}
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <MessageSquare className="w-5 h-5" />
          )}
          {loading ? 'Analisando...' : 'Gerar Novas Ideias'}
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 overflow-y-auto">
        {!insight && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Sparkles className="w-16 h-16 mb-4 text-purple-200" />
            <p className="text-lg">Clique no botão para receber sugestões de cardápio e alertas.</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-100 rounded-xl"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        )}

        {insight && !loading && (
          <div className="prose prose-emerald max-w-none">
            <ReactMarkdown>{insight}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};