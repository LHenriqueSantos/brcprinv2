
const fetch = require('node-fetch');

async function testShipping() {
  const url = 'http://localhost:3000/api/shipping/calculate';
  const payload = {
    fromZip: '74934200',
    toZip: '01310000', // Paulista Ave, SP
    weight_g: 500,
    dimensions: { length: 20, width: 20, height: 15 },
    provider: 'melhorenvio',
    token: 'some_mock_token'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Err:", err.message);
  }
}

testShipping();
