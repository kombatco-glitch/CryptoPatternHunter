import React from 'react';
import { CandleData, MatchResult } from '../types';
import { Search, TrendingUp, Activity } from 'lucide-react';

interface SidebarProps {
  matches: MatchResult[];
  onSelectMatch: (match: MatchResult) => void;
  selectedMatchIndex: number | null;
  isSearching: boolean;
}

// Mini chart for sidebar items
const MiniChart = ({ data, isMatch }: { data: CandleData[], isMatch: boolean }) => {
  const min = Math.min(...data.map(d => d.low));
  const max = Math.max(...data.map(d => d.high));
  const range = max - min;
  const height = 40;
  const width = 100;
  
  // Simple SVG path
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.close - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const color = isMatch ? '#F59E0B' : '#6B7280';

  return (
    <svg width="100%" height={height} className="overflow-visible">
      <polyline 
        points={points} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
      />
    </svg>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ matches, onSelectMatch, selectedMatchIndex, isSearching }) => {
  if (isSearching) {
     return (
         <div className="w-80 bg-gray-900 border-l border-gray-800 p-6 flex flex-col items-center justify-center text-gray-500 h-full">
            <Activity className="w-8 h-8 mb-3 animate-spin text-blue-500" />
            <p>Searching patterns...</p>
         </div>
     );
  }

  if (matches.length === 0) {
    return (
      <div className="w-80 bg-gray-900 border-l border-gray-800 p-6 flex flex-col items-center justify-center text-gray-500 h-full">
        <Search className="w-8 h-8 mb-3 opacity-50" />
        <p className="text-center text-sm">Draw on the chart to find similar historical patterns.</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 bg-gray-900 z-10">
        <h2 className="font-bold text-gray-200 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500"/>
            Pattern Matches
        </h2>
        <p className="text-xs text-gray-500 mt-1">Found {matches.length} similar instances</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {matches.map((match, idx) => {
          // Calculate visual percentage return of the pattern
          const startPrice = match.data[0].open;
          const endPrice = match.data[match.data.length - 1].close;
          const pct = ((endPrice - startPrice) / startPrice) * 100;
          const isWin = pct >= 0;

          return (
            <div 
              key={match.startIndex}
              onClick={() => onSelectMatch(match)}
              className={`
                p-3 rounded-lg cursor-pointer border transition-all
                ${selectedMatchIndex === match.startIndex 
                  ? 'bg-gray-800 border-blue-500 ring-1 ring-blue-500' 
                  : 'bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-gray-700'}
              `}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400 font-mono">
                  {new Date(match.data[0].time).toLocaleDateString()}
                </span>
                <span className={`text-xs font-bold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                  {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
                </span>
              </div>
              
              <MiniChart data={match.data} isMatch={selectedMatchIndex === match.startIndex} />
              
              <div className="mt-2 flex justify-between items-center text-[10px] text-gray-500">
                 <span>Similarity Score: {match.score.toFixed(3)}</span>
                 <span>{match.data.length} candles</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};