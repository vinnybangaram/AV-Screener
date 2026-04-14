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

  // Format data for Highcharts: [timestamp, close] and [timestamp, volume]
  const ohlc = data.map(d => [d.timestamp, d.Close]);
  const volume = data.map(d => [d.timestamp, d.Volume]);

  const options = {
    rangeSelector: {
      selected: 1,
      buttons: [
        { type: 'day', count: 1, text: '1D' },
        { type: 'day', count: 5, text: '5D' },
        { type: 'month', count: 1, text: '1M' },
        { type: 'month', count: 6, text: '6M' },
        { type: 'year', count: 1, text: '1Y' },
        { type: 'all', text: 'Max' }
      ],
      buttonTheme: {
        fill: 'rgba(255,255,255,0.03)',
        stroke: 'var(--border-color)',
        'stroke-width': 1,
        style: { color: 'var(--text-secondary)', fontWeight: '700' },
        states: {
          select: { fill: 'var(--accent-primary)', style: { color: 'white' } },
          hover: { fill: 'rgba(255,255,255,0.08)', style: { color: 'white' } }
        }
      },
      inputEnabled: false
    },
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: 'inherit' },
      height: window.innerWidth < 768 ? 350 : 550,
      spacingTop: 20
    },
    navigator: {
        enabled: true,
        maskFill: 'rgba(99, 102, 241, 0.1)',
        outlineColor: 'var(--border-color)',
        handles: { backgroundColor: '#666', borderColor: '#999' }
    },
    scrollbar: { enabled: false },
    xAxis: {
      gridLineColor: 'rgba(255, 255, 255, 0.03)',
      lineColor: 'var(--border-color)',
      tickColor: 'var(--border-color)',
      labels: { style: { color: 'var(--text-secondary)', fontWeight: '600' } }
    },
    yAxis: [{
      labels: { align: 'right', x: -10, style: { color: 'var(--text-secondary)', fontWeight: '600' } },
      gridLineColor: 'rgba(255, 255, 255, 0.03)',
      height: '75%',
      lineWidth: 0,
      resize: { enabled: true }
    }, {
      labels: { enabled: false },
      top: '75%',
      height: '25%',
      offset: 0,
      lineWidth: 0,
      gridLineColor: 'transparent'
    }],
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: 'var(--accent-primary)',
      style: { color: '#fff' },
      shared: true
    },
    series: [{
      type: 'area',
      name: symbol,
      data: ohlc,
      id: 'main-series',
      color: '#10b981',
      fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
              [0, 'rgba(16, 185, 129, 0.2)'],
              [1, 'rgba(16, 185, 129, 0)']
          ]
      },
      threshold: null,
      tooltip: { valueDecimals: 2 }
    }, {
      type: 'column',
      name: 'Volume',
      data: volume,
      yAxis: 1,
      color: 'rgba(59, 130, 246, 0.3)',
      borderColor: 'transparent'
    }],
    credits: { enabled: false }
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
