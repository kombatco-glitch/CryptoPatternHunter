export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dateStr: string;
}

export interface MatchResult {
  startIndex: number;
  endIndex: number;
  score: number; // Lower is better (Euclidean distance)
  data: CandleData[];
}

export interface PatternAnalysis {
  name: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  explanation: string;
  confidence: string;
}