import React, { useRef, useState } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { CandleData } from '../types';

interface CandleChartProps {
  data: CandleData[];
  startIndex: number;
  visibleCount: number;
  onSelectionComplete: (startIdx: number, endIdx: number) => void;
  highlightRange?: { start: number; end: number } | null;
}

// Custom shape that calculates positions based on the bar's own dimensions
// Recharts passes { x, y, width, height, payload } where:
// y = top pixel of the bar (corresponding to max value)
// height = pixel height of the bar (corresponding to max - min)
const CandleShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  
  const isUp = close >= open;
  const fill = isUp ? '#10B981' : '#EF4444'; // Tailwind green-500 / red-500
  const stroke = fill;

  // Handle zero height or bad data
  if (!height || height < 0 || high === low) {
     return <line x1={x + width/2} y1={y} x2={x+width/2} y2={y+height} stroke={stroke} />;
  }

  // Calculate scale within this specific bar
  // We assume linear scale: height corresponds to (high - low)
  const range = high - low;
  const pixelRatio = height / range;

  // Calculate offsets from the top (y)
  // Note: Recharts renders bars from top (y) downwards. 
  // y corresponds to 'high'. y + height corresponds to 'low'.
  
  const openOffset = (high - open) * pixelRatio;
  const closeOffset = (high - close) * pixelRatio;

  const bodyTop = Math.min(openOffset, closeOffset);
  const bodyHeight = Math.abs(openOffset - closeOffset);
  const renderedBodyHeight = Math.max(1, bodyHeight); // Ensure at least 1px visibility

  const center = x + width / 2;

  return (
    <g>
      {/* Wick */}
      <line 
        x1={center} 
        y1={y} 
        x2={center} 
        y2={y + height} 
        stroke={stroke} 
        strokeWidth={1.5} 
      />
      {/* Body */}
      <rect 
        x={x} 
        y={y + bodyTop} 
        width={width} 
        height={renderedBodyHeight} 
        fill={fill} 
      />
    </g>
  );
};

export const CandleChart: React.FC<CandleChartProps> = ({
  data,
  startIndex,
  visibleCount,
  onSelectionComplete,
  highlightRange,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<number | null>(null);
  const [selectEnd, setSelectEnd] = useState<number | null>(null);
  
  const chartRef = useRef<HTMLDivElement>(null);

  // Prepare data
  const visibleData = data.slice(startIndex, startIndex + visibleCount);
  
  // Add 'range' for the Bar to consume [low, high]
  const chartData = visibleData.map((d) => ({
    ...d,
    range: [d.low, d.high]
  }));

  const handleMouseDown = (e: any) => {
    if (!e || !e.activeLabel) return;
    setIsSelecting(true);
    const idx = visibleData.findIndex(item => item.time === e.activeLabel);
    if (idx !== -1) {
      setSelectStart(idx);
      setSelectEnd(idx);
    }
  };

  const handleMouseMove = (e: any) => {
    if (isSelecting && e && e.activeLabel) {
      const idx = visibleData.findIndex(item => item.time === e.activeLabel);
      if (idx !== -1) {
        setSelectEnd(idx);
      }
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    if (selectStart !== null && selectEnd !== null) {
      const start = Math.min(selectStart, selectEnd) + startIndex;
      const end = Math.max(selectStart, selectEnd) + startIndex;
      if (end - start >= 1) {
        onSelectionComplete(start, end);
      }
      setSelectStart(null);
      setSelectEnd(null);
    }
  };

  const refStart = selectStart !== null && selectEnd !== null ? visibleData[Math.min(selectStart, selectEnd)]?.time : null;
  const refEnd = selectStart !== null && selectEnd !== null ? visibleData[Math.max(selectStart, selectEnd)]?.time : null;

  let highlightStartStr = null;
  let highlightEndStr = null;

  if (highlightRange) {
    const relativeStart = highlightRange.start - startIndex;
    const relativeEnd = highlightRange.end - startIndex;
    
    // Only show if it overlaps with visible area
    // We check overlap logic
    if (relativeStart < visibleCount && relativeEnd >= 0) {
       const safeStart = Math.max(0, relativeStart);
       const safeEnd = Math.min(visibleCount - 1, relativeEnd);
       highlightStartStr = visibleData[safeStart]?.time;
       highlightEndStr = visibleData[safeEnd]?.time;
    }
  }

  // Compute domain
  const minLow = Math.min(...visibleData.map(d => d.low));
  const maxHigh = Math.max(...visibleData.map(d => d.high));
  const padding = (maxHigh - minLow) * 0.1;

  return (
    <div 
      className="w-full h-full select-none cursor-crosshair" 
      ref={chartRef}
      onMouseLeave={handleMouseUp} 
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            dataKey="time" 
            tickFormatter={(time) => new Date(time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            minTickGap={30}
          />
          <YAxis 
            domain={[minLow - padding, maxHigh + padding]} 
            orientation="right"
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            tickFormatter={(val) => val.toFixed(0)}
            width={60}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#F3F4F6' }}
            itemStyle={{ color: '#F3F4F6' }}
            labelFormatter={(label) => new Date(label).toLocaleString()}
            formatter={(value: any, name: string, props: any) => {
                // Custom tooltip formatting to show OHLC
                if (name === 'range' && props.payload) {
                   const { open, high, low, close } = props.payload;
                   return [
                     `O: ${open.toFixed(2)} H: ${high.toFixed(2)} L: ${low.toFixed(2)} C: ${close.toFixed(2)}`, 
                     ''
                   ];
                }
                return [value, name];
            }}
          />
          
          {/* Single Bar representing the full Range (Low to High) */}
          <Bar
            dataKey="range"
            shape={<CandleShape />}
            isAnimationActive={false}
          />

          {refStart && refEnd && (
             <ReferenceArea 
               x1={refStart} 
               x2={refEnd} 
               strokeOpacity={0.3} 
               fill="#3B82F6" 
               fillOpacity={0.2} 
             />
          )}

           {highlightStartStr && highlightEndStr && (
             <ReferenceArea 
               x1={highlightStartStr} 
               x2={highlightEndStr} 
               stroke="#F59E0B"
               strokeWidth={2}
               fill="#F59E0B" 
               fillOpacity={0.15} 
             />
          )}

        </ComposedChart>
      </ResponsiveContainer>
      
      {!isSelecting && !refStart && !highlightRange && (
        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur px-3 py-1 rounded text-xs text-gray-400 pointer-events-none border border-gray-700">
          Draw a box to pattern match
        </div>
      )}
    </div>
  );
};
