// server.js - simple vehicle proxy (Express)
// Usage: set VEHICLE_PROVIDER_URL and VEHICLE_PROVIDER_KEY env vars before running.
// Deploy to Vercel/Netlify/Heroku or run locally with `node server.js`
// NOTE: adapt PROVIDER_URL & response mapping to your chosen data provider.
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
const PROVIDER_URL = process.env.VEHICLE_PROVIDER_URL || '';
const PROVIDER_KEY = process.env.VEHICLE_PROVIDER_KEY || '';

if (!PROVIDER_URL) {
  console.warn('Warning: VEHICLE_PROVIDER_URL not set. Proxy will return error until configured.');
}

app.get('/vehicle', async (req, res) => {
  const reg = (req.query.reg || '').trim();
  if (!reg) return res.status(400).json({ error: 'missing reg' });
  if (!PROVIDER_URL) return res.status(500).json({ error: 'provider_not_configured' });

  try {
    const url = `${PROVIDER_URL}?reg=${encodeURIComponent(reg)}`;
    const resp = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': PROVIDER_KEY ? `Bearer ${PROVIDER_KEY}` : ''
      },
      timeout: 10000
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(502).json({ error: 'provider_error', status: resp.status, body: txt });
    }
    const json = await resp.json();
    const out = {
      make: json.make || json.brand || json.manufacturer || json.märke,
      model: json.model || json.modelName,
      year: json.year || json.regYear || json.firstRegistrationYear,
      fuel: json.fuel || json.fuelType,
      vin: json.vin || json.vinNumber,
      raw: json
    };
    res.set('Access-Control-Allow-Origin', '*');
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal', message: String(err) });
  }
});

app.listen(PORT, () => console.log(`Vehicle proxy listening on ${PORT}`));
