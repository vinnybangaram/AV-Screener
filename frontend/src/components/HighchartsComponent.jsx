import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import indicatorsAll from 'highcharts/indicators/indicators-all';

// Initialize indicators
if (typeof indicatorsAll === 'function') {
  indicatorsAll(Highcharts);
}

const HighchartsComponent = ({ data, symbol }) => {
  if (!data || data.length === 0) return null;

  // Format data for Highcharts: [timestamp, open, high, low, close]
  const ohlc = data.map(d => [
    new Date(d.date).getTime(),
    d.Open,
    d.High,
    d.Low,
    d.Close
  ]);

  const volume = data.map(d => [
    new Date(d.date).getTime(),
    d.Volume
  ]);

  const options = {
    rangeSelector: {
      selected: 1,
      buttonTheme: {
        fill: '#1a1d23',
        stroke: '#333',
        style: { color: '#ccc' },
        states: {
          select: { fill: 'var(--accent)', style: { color: 'white' } }
        }
      }
    },
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: 'inherit' },
      height: 500
    },
    title: {
      text: `${symbol} Performance`,
      style: { color: 'var(--text-secondary)', fontSize: '16px' }
    },
    xAxis: {
      gridLineColor: 'rgba(255, 255, 255, 0.05)',
      labels: { style: { color: '#999' } }
    },
    yAxis: [{
      labels: { align: 'right', x: -3, style: { color: '#999' } },
      title: { text: 'Price' },
      height: '70%',
      lineWidth: 2,
      resize: { enabled: true },
      gridLineColor: 'rgba(255, 255, 255, 0.05)'
    }, {
      labels: { align: 'right', x: -3, style: { color: '#999' } },
      title: { text: 'Volume' },
      top: '75%',
      height: '25%',
      offset: 0,
      lineWidth: 2,
      gridLineColor: 'rgba(255, 255, 255, 0.05)'
    }],
    tooltip: {
      split: true,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      style: { color: '#F0F0F0' }
    },
    series: [{
      type: 'candlestick',
      name: symbol,
      data: ohlc,
      id: 'main-series',
      upColor: '#10b981',
      color: '#ef4444',
      upLineColor: '#10b981',
      lineColor: '#ef4444'
    }, {
      type: 'column',
      name: 'Volume',
      data: volume,
      yAxis: 1,
      color: 'rgba(59, 130, 246, 0.3)'
    }, {
      type: 'sma',
      linkedTo: 'main-series',
      params: { period: 20 },
      styles: { strokeWidth: 1, stroke: '#f59e0b' }
    }, {
      type: 'ema',
      linkedTo: 'main-series',
      params: { period: 50 },
      styles: { strokeWidth: 1, stroke: '#8b5cf6' }
    }],
    credits: { enabled: false },
    plotOptions: {
      candlestick: {
        dataGrouping: { enabled: false }
      }
    }
  };

  const HighchartsReactComponent = HighchartsReact.default || HighchartsReact;

  return (
    <div className="card" style={{ marginBottom: '2.5rem' }}>
      <HighchartsReactComponent
        highcharts={Highcharts}
        constructorType={'stockChart'}
        options={options}
      />
    </div>
  );
};

export default HighchartsComponent;
