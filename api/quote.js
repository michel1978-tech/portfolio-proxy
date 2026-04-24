export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  const tickers = symbols.split(',').map(s => s.trim()).filter(Boolean);
  const results = {};

  await Promise.all(tickers.map(async ticker => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
      });
      if (!r.ok) { results[ticker] = null; return; }
      const data = await r.json();
      const meta = data?.chart?.result?.[0]?.meta;
      results[ticker] = meta?.regularMarketPrice || meta?.previousClose || null;
    } catch(e) {
      results[ticker] = null;
    }
  }));

  res.setHeader('Cache-Control', 's-maxage=300');
  return res.status(200).json(results);
}
