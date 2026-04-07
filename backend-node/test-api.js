const axios = require('axios');

async function test() {
  const symbol = 'RELIANCE.NS';
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
  
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log('Quote data:', JSON.stringify(res.data.quoteResponse.result[0], null, 2));
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

test();
