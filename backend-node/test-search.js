const axios = require('axios');

async function testSearch() {
  const query = 'RELIANCE';
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=10&newsCount=0`;
  
  try {
    console.log(`Searching for "${query}" using axios...`);
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    console.log('Results:', JSON.stringify(res.data.quotes, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSearch();
