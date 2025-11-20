import React, { useEffect, useState, useMemo } from 'react';
import { fetchMarketData } from './utils/data';
import { findSimilarPatterns } from './utils/math';
import { analyzePatternWithGemini } from './services/gemini';
import { CandleChart } from './components/CandleChart';
import { Sidebar } from './components/Sidebar';
import { PatternAnalysisPanel } from './components/PatternAnalysis';
import { CandleData, MatchResult, PatternAnalysis } from './types';
import { BarChart2, History, ChevronLeft, ChevronRight } from 'lucide-react';

// Constants
const VISIBLE_POINTS = 80;

const App: React.FC = () => {
  const [data, setData] = useState<CandleData[]>([]);
  
  // Navigation state
  const [viewStartIndex, setViewStartIndex] = useState(0);
  
  // Pattern Matching State
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Gemini State
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize Data
  useEffect(() => {
    const initData = async () => {
      const marketData = await fetchMarketData();
      setData(marketData);
      // Start at the end (most recent)
      setViewStartIndex(Math.max(0, marketData.length - VISIBLE_POINTS));
    };
    initData();
  }, []);

  // Handle user drawing a box
  const handleSelection = async (startIdx: number, endIdx: number) => {
    const pattern = data.slice(startIdx, endIdx + 1);
    if (pattern.length < 3) return; // Too short

    setIsSearching(true);
    setSelectedMatch(null); // Clear previous selection highlight
    setMatches([]);
    setAnalysis(null);

    // Run pattern matching (async to allow UI render)
    setTimeout(async () => {
        const results = findSimilarPatterns(pattern, data);
        setMatches(results);
        setIsSearching(false);
        
        // Trigger AI analysis
        if (process.env.API_KEY) {
            setIsAnalyzing(true);
            const aiResult = await analyzePatternWithGemini(pattern);
            setAnalysis(aiResult);
            setIsAnalyzing(false);
        }
    }, 100);
  };

  // Handle clicking a match in sidebar
  const handleSelectMatch = (match: MatchResult) => {
    setSelectedMatch(match);
    
    // Center the view on the match
    // We want the match to be in the middle of the visible area
    const centerOffset = Math.floor(VISIBLE_POINTS / 2);
    const matchCenter = match.startIndex + Math.floor((match.endIndex - match.startIndex) / 2);
    
    let newStart = matchCenter - centerOffset;
    // Bounds check
    if (newStart < 0) newStart = 0;
    if (newStart > data.length - VISIBLE_POINTS) newStart = data.length - VISIBLE_POINTS;
    
    setViewStartIndex(newStart);
  };

  // Navigation Handlers
  const scrollLeft = () => {
    setViewStartIndex(prev => Math.max(0, prev - Math.floor(VISIBLE_POINTS / 2)));
  };
  
  const scrollRight = () => {
    setViewStartIndex(prev => Math.min(data.length - VISIBLE_POINTS, prev + Math.floor(VISIBLE_POINTS / 2)));
  };
  
  const jumpToLatest = () => {
    setViewStartIndex(Math.max(0, data.length - VISIBLE_POINTS));
  };

  return (
    <div className="flex h-screen bg-black text-gray-100 overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                <BarChart2 className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">
              Crypto<span className="text-blue-500">Pattern</span>Hunter
            </h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            {!process.env.API_KEY && (
                <div className="px-3 py-1 rounded bg-red-900/30 border border-red-800 text-red-400 text-xs">
                    Warning: No API_KEY found for Gemini
                </div>
            )}
            <div className="text-gray-400 flex items-center gap-2">
               <History size={14} />
               <span>BTC/USDT 5m</span>
            </div>
            <div className="bg-gray-800 px-3 py-1 rounded text-gray-300 font-mono text-xs border border-gray-700">
                {data.length > 0 ? new Date(data[Math.min(data.length - 1, viewStartIndex + VISIBLE_POINTS - 1)].time).toLocaleString() : 'Loading...'}
            </div>
          </div>
        </header>

        {/* Chart Area */}
        <div className="flex-1 relative bg-gray-950">
          {data.length > 0 ? (
            <CandleChart 
              data={data} 
              startIndex={viewStartIndex} 
              visibleCount={VISIBLE_POINTS} 
              onSelectionComplete={handleSelection}
              highlightRange={selectedMatch ? { start: selectedMatch.startIndex, end: selectedMatch.endIndex } : null}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
               <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <span className="text-sm">Fetching Live Bitcoin Data...</span>
            </div>
          )}
          
          {/* Navigation Controls Overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/90 p-1 rounded-full border border-gray-700 shadow-xl backdrop-blur-sm z-10">
             <button onClick={scrollLeft} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={20} />
             </button>
             <span className="px-4 text-xs font-mono text-gray-500 pointer-events-none select-none">
                Zoom: {VISIBLE_POINTS} bars
             </span>
             <button onClick={scrollRight} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                <ChevronRight size={20} />
             </button>
              <button onClick={jumpToLatest} className="px-3 py-1 ml-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors">
                LATEST
             </button>
          </div>
        </div>

        {/* Bottom Analysis Panel (Fixed Height) */}
        <div className="h-48 border-t border-gray-800 bg-gray-900 px-6 py-4">
             <PatternAnalysisPanel analysis={analysis} loading={isAnalyzing} />
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        matches={matches} 
        onSelectMatch={handleSelectMatch} 
        selectedMatchIndex={selectedMatch?.startIndex ?? null}
        isSearching={isSearching}
      />
    </div>
  );
};

export default App;