const axios = require('axios');

async function test() {
  const domain = 'https://main.d1copg2plwr1d7.amplifyapp.com';
  const symbol = 'AAPL';

  const endpoints = [
    `/api/stock?symbol=${symbol}`,
    `/api/overview?symbol=${symbol}`,
    `/api/technical-indicators?symbol=${symbol}`
  ];

  for (const ep of endpoints) {
    console.log(`\nFetching ${domain}${ep}...`);
    try {
      const res = await axios.get(`${domain}${ep}`);
      console.log(`Status: ${res.status}`);
      console.log('Response JSON:', JSON.stringify(res.data, null, 2).substring(0, 1000));
    } catch (err) {
      if (err.response) {
        console.error(`Status: ${err.response.status}`);
        console.error('Error Response JSON:', JSON.stringify(err.response.data, null, 2));
      } else {
        console.error('Fetch error:', err.message);
      }
    }
  }
}

test();
