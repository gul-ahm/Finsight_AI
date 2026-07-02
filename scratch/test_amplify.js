const axios = require('axios');

async function test() {
  const url = 'https://main.d1copg2plwr1d7.amplifyapp.com/stock/AAPL';

  console.log(`\nFetching HTML from ${url}...`);
  try {
    const res = await axios.get(url);
    const html = res.data;
    
    // Check if the HTML contains the old or new endpoint path
    const hasPlural = html.includes('/api/stocks');
    const hasSingular = html.includes('/api/stock');
    
    console.log(`Contains '/api/stocks' (old):`, hasPlural);
    console.log(`Contains '/api/stock' (new):`, hasSingular);
    
    // Log a small snippet around any match if possible
    if (html.includes('api/stock')) {
      const index = html.indexOf('api/stock');
      console.log('Snippet around match:', html.substring(index - 50, index + 100));
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

test();
