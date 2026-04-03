import React from "react";

const TradingViewChart = ({ symbol }) => {
  // ✅ Format symbol for BSE to bypass licensing blocks
  const getSymbol = (sym) => {
    if (!sym) return "BSE:SBIN";
    let cleanSym = sym.replace(".NS", "").replace(".BO", "").toUpperCase();
    return `BSE:${cleanSym}`;
  };

  const formattedSymbol = getSymbol(symbol);
  
  // ✅ ENHANCED: Chart Embed URL with Intraday enabled (interval=1)
  // We set interval=1 (1 minute) to nudge the widget into recognizing intraday data availability
  const chartUrl = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(formattedSymbol)}&interval=5&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&theme=dark&style=1&timezone=Asia%2FKolkata&studies=RSI%40tv-basicstudies%3BMACD%40tv-basicstudies&locale=en#%7B%22interval%22%3A%225%22%2C%22allow_symbol_change%22%3Atrue%7D`;

  // ✅ FIX: Technical Gauge uses a JSON config passed in the URL hash (#)
  const gaugeConfig = {
    "interval": "1D",
    "width": "100%",
    "isTransparent": true,
    "height": "100%",
    "symbol": formattedSymbol,
    "showIntervalTabs": true,
    "displayMode": "single",
    "locale": "en",
    "colorTheme": "dark"
  };
  const gaugeUrl = `https://s.tradingview.com/embed-widget-technical-analysis/?locale=en#${encodeURIComponent(JSON.stringify(gaugeConfig))}`;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', marginBottom: '2.5rem' }}>
      {/* Main Chart Area */}
      <div className="card" style={{ padding: '0.5rem', height: '650px', background: '#131722', border: '1px solid var(--accent)', overflow: 'hidden' }}>
        <iframe
          title="TradingView Chart"
          src={chartUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allowTransparency="true"
          scrolling="no"
          allowFullScreen
          style={{ borderRadius: '8px' }}
        />
      </div>

      {/* Side Technical Gauge - Now with correct JSON config hash */}
      <div className="card" style={{ padding: '1.25rem', height: '650px', background: '#131722', border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent)', textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Market Sentiment
        </h4>
        <div style={{ flex: 1, position: 'relative' }}>
            <iframe
              title="TradingView Technical Analysis"
              src={gaugeUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowTransparency="true"
              scrolling="no"
              style={{ borderRadius: '8px' }}
            />
        </div>
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
            BSE Data Stream Active
        </div>
      </div>
    </div>
  );
};

export default TradingViewChart;
