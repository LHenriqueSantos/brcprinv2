const http = require('http');

console.log("🤖 BRCPrint Auction Bot Engine Started!");
console.log("This engine will ping the /api/cron/auction-bots endpoint every 3 seconds.");

setInterval(() => {
  const req = http.get('http://localhost:3000/api/cron/auction-bots', (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.success && parsed.fake_bids_dispatched > 0) {
          console.log(`[BOT ENGINE] Dispatched ${parsed.fake_bids_dispatched} artificial bid(s)!`);
        } else if (parsed.error) {
          console.error(`[BOT ENGINE ERROR]`, parsed.error);
        }
      } catch (e) {
        // Ignora erros de parse se o servidor estiver reiniciando (502, etc)
      }
    });

  }).on("error", (err) => {
    // Silence errors if the next.js server is down temporarily
    // console.log("Engine trying to reach server...");
  });

  // Timeout de seguranÃ§a
  req.setTimeout(2000, () => {
    req.abort();
  });

}, 3000);
