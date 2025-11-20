import { CandleData, MatchResult } from '../types';

// Normalize a sequence of candles to percentage changes relative to the first candle's open
// This allows us to match shapes regardless of absolute price levels.
const normalizeSequence = (candles: CandleData[]): number[][] => {
  if (candles.length === 0) return [];
  const basePrice = candles[0].open;
  
  return candles.map(c => [
    (c.open - basePrice) / basePrice,
    (c.high - basePrice) / basePrice,
    (c.low - basePrice) / basePrice,
    (c.close - basePrice) / basePrice
  ]);
};

export const findSimilarPatterns = (
  targetPattern: CandleData[],
  allData: CandleData[],
  threshold: number = 0.5 // Adjustable sensitivity
): MatchResult[] => {
  if (targetPattern.length < 3) return [];

  const normalizedTarget = normalizeSequence(targetPattern);
  const windowSize = targetPattern.length;
  const matches: MatchResult[] = [];

  // We slide through history. 
  // Optimization: Don't scan the exact same range we just selected (handled by UI filtering usually, but good to note)
  for (let i = 0; i <= allData.length - windowSize; i++) {
    const windowData = allData.slice(i, i + windowSize);
    const normalizedWindow = normalizeSequence(windowData);
    
    let totalDistance = 0;
    
    // Euclidean distance between the normalized vectors
    for (let j = 0; j < windowSize; j++) {
      const t = normalizedTarget[j];
      const w = normalizedWindow[j];
      
      // Sum of squared differences for O, H, L, C
      const dist = 
        Math.pow(t[0] - w[0], 2) +
        Math.pow(t[1] - w[1], 2) +
        Math.pow(t[2] - w[2], 2) +
        Math.pow(t[3] - w[3], 2);
        
      totalDistance += dist;
    }

    // Mean Squared Error roughly
    const score = Math.sqrt(totalDistance);

    // If score is low enough, it's a match
    // We'll take top results later, but for now collect generic candidates
    // The score is roughly percentage deviation. 0.01 score means extremely close.
    matches.push({
      startIndex: i,
      endIndex: i + windowSize - 1,
      score,
      data: windowData
    });
  }

  // Sort by best match (lowest score) and take top 20
  // Filter out overlapping matches to ensure variety
  const sortedMatches = matches.sort((a, b) => a.score - b.score);
  
  const distinctMatches: MatchResult[] = [];
  const usedIndices = new Set<number>();

  for (const match of sortedMatches) {
    if (distinctMatches.length >= 20) break;
    
    // Simple overlap check
    let isOverlapping = false;
    for (let k = match.startIndex; k <= match.endIndex; k++) {
      if (usedIndices.has(k)) {
        isOverlapping = true;
        break;
      }
    }

    if (!isOverlapping) {
        distinctMatches.push(match);
        // Mark indices as used (with some buffer)
        for (let k = match.startIndex; k <= match.endIndex; k++) {
            usedIndices.add(k);
        }
    }
  }

  return distinctMatches;
};