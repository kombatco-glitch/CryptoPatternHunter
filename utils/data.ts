import { CandleData } from '../types';

export const generateData = (count: number = 1000): CandleData[] => {
  const data: CandleData[] = [];
  let price = 65000;
  // Start time: count * 5 minutes ago so the last candle is "now"
  let time = Date.now() - (count * 5 * 60 * 1000);
  
  // Random walk parameters
  const volatility = 50; 

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * volatility;
    const open = price;
    const close = price + change + (Math.random() - 0.5) * 20; // Add some noise
    
    // Ensure high/low encompass open/close
    const high = Math.max(open, close) + Math.random() * 30;
    const low = Math.min(open, close) - Math.random() * 30;
    
    const volume = Math.floor(Math.random() * 100) + 10;

    data.push({
      time,
      open,
      high,
      low,
      close,
      volume,
      dateStr: new Date(time).toLocaleString(),
    });

    // Next step
    price = close;
    time += 5 * 60 * 1000; // 5 minutes
  }

  return data;
};

export const fetchMarketData = async (): Promise<CandleData[]> => {
  try {
    // Fetch BTCUSDT 5m candles from Binance (Limit 1000 is standard max for public API)
    const response = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=1000');
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const rawData = await response.json();

    // Binance Response Format:
    // [
    //   1499040000000,      // Open time
    //   "0.01634790",       // Open
    //   "0.80000000",       // High
    //   "0.01575800",       // Low
    //   "0.01577100",       // Close
    //   "148976.11427815",  // Volume
    //   ...
    // ]

    return rawData.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
      dateStr: new Date(d[0]).toLocaleString(),
    }));
  } catch (error) {
    console.error("Failed to fetch live data, falling back to generated data:", error);
    // Fallback to generated data if API fails
    return generateData(1000);
  }
};