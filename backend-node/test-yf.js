const yahooFinance = require('yahoo-finance2').default;

async function test() {
  try {
    const quote = await yahooFinance.quote('RELIANCE.NS');
    console.log('Quote Success:', quote.symbol, quote.regularMarketPrice);
    
    const chart = await yahooFinance.chart('RELIANCE.NS', { period1: '2024-01-01', interval: '1d' });
    console.log('Chart Success:', chart.quotes.length, 'data points');
  } catch (err) {
    console.error('Test Failed:', err.message, err.stack);
  }
}

test();
