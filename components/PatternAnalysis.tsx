import React from 'react';
import { PatternAnalysis } from '../types';
import { Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  analysis: PatternAnalysis | null;
  loading: boolean;
}

export const PatternAnalysisPanel: React.FC<Props> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 animate-pulse">
        <Sparkles className="w-5 h-5 mb-2 text-purple-400" />
        <span className="text-xs">Gemini is analyzing pattern structure...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-600">
             <span className="text-xs">Select a pattern to see AI analysis</span>
        </div>
    )
  }

  const sentimentColor = 
    analysis.sentiment === 'bullish' ? 'text-green-400' : 
    analysis.sentiment === 'bearish' ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="h-full flex flex-col p-1">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-gray-200">Gemini Analysis</h3>
      </div>
      
      <div className="bg-gray-800/50 rounded p-3 border border-gray-700/50 flex-1 overflow-y-auto">
        <div className="flex justify-between items-start mb-2">
            <span className="text-lg font-semibold text-white">{analysis.name}</span>
            <span className={`text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-gray-900 border border-gray-700 ${sentimentColor}`}>
                {analysis.sentiment}
            </span>
        </div>
        
        <p className="text-sm text-gray-300 leading-relaxed mb-3">
            {analysis.explanation}
        </p>
        
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-auto">
             <AlertCircle size={12} />
             <span>Confidence: <span className="text-gray-300">{analysis.confidence}</span></span>
        </div>
      </div>
    </div>
  );
};