import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const CustomCandlestick = (props) => {
  const { x, y, width, height, payload } = props;
  const { Open, Close, High, Low } = payload;
  const isUp = Close >= Open;
  const color = isUp ? '#10b981' : '#ef4444';
  
  // Coordinate calculations relative to Recharts grid
  const ratio = height / Math.max(0.1, Math.abs(Open - Close));
  const wickHighY = y - (High - Math.max(Open, Close)) * ratio;
  const wickLowY = y + height + (Math.min(Open, Close) - Low) * ratio;

  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={wickHighY}
        x2={x + width / 2}
        y2={wickLowY}
        stroke={color}
        strokeWidth={2}
      />
      {/* Body */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
      />
    </g>
  );
};

const CandlestickChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Formatting data for Recharts
  const formattedData = data.map(d => ({
    ...d,
    // Calculate rect height and y for the body
    bodyY: Math.max(d.Open, d.Close),
    bodyHeight: Math.abs(d.Open - d.Close)
  }));

  const minPrice = Math.min(...data.map(d => d.Low)) * 0.98;
  const maxPrice = Math.max(...data.map(d => d.High)) * 1.02;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--accent)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{d.date}</div>
          <div>Open: <span style={{ color: 'white' }}>₹{d.Open.toFixed(2)}</span></div>
          <div>High: <span style={{ color: '#10b981' }}>₹{d.High.toFixed(2)}</span></div>
          <div>Low: <span style={{ color: '#ef4444' }}>₹{d.Low.toFixed(2)}</span></div>
          <div>Close: <span style={{ color: 'white' }}>₹{d.Close.toFixed(2)}</span></div>
          <div style={{ marginTop: '0.25rem' }}>Vol: <span style={{ color: 'var(--accent)' }}>{(d.Volume / 1000000).toFixed(2)}M</span></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ marginBottom: '2.5rem', height: '500px' }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Price Action & Volume</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            minTickGap={30}
          />
          <YAxis 
            domain={[minPrice, maxPrice]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            orientation="right"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="Close"
            shape={<CustomCandlestick />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CandlestickChart;
