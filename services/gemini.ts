import { GoogleGenAI, Type } from '@google/genai';
import { CandleData, PatternAnalysis } from '../types';

export const analyzePatternWithGemini = async (candles: CandleData[]): Promise<PatternAnalysis> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Format data for the prompt to save tokens but keep precision
    const dataString = candles.map((c, i) => 
      `T${i}: Open:${c.open.toFixed(2)}, High:${c.high.toFixed(2)}, Low:${c.low.toFixed(2)}, Close:${c.close.toFixed(2)}`
    ).join('\n');

    const prompt = `
      You are a world-class technical analysis expert for cryptocurrency markets.
      Analyze the following sequence of 5-minute candlestick data for Bitcoin.
      
      Identify the technical chart pattern (e.g., Bull Flag, Morning Star, Three Black Crows, Consolidation, Breakout, etc.).
      Determine the sentiment (bullish, bearish, neutral).
      Provide a concise explanation of why this pattern is significant based on the OHLC relationships.
      
      Data:
      ${dataString}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the technical pattern identified" },
            sentiment: { type: Type.STRING, enum: ["bullish", "bearish", "neutral"], description: "Projected market direction" },
            explanation: { type: Type.STRING, description: "Short explanation of the pattern logic" },
            confidence: { type: Type.STRING, description: "Confidence level (High/Medium/Low)" }
          },
          required: ["name", "sentiment", "explanation", "confidence"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as PatternAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      name: "Analysis Failed",
      sentiment: "neutral",
      explanation: "Could not connect to AI analysis service. Check API Key.",
      confidence: "Low"
    };
  }
};