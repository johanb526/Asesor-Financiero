// api/chat.js — Vercel Serverless Function
// Proxy entre el navegador (que no puede llamar a Anthropic por CORS) y la API.

const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: { message: 'Solo POST' } }); return; }

  // Prioridad de la key:
  // 1) Variable de entorno de Vercel (lo ideal — el usuario nunca la ve)
  // 2) Header enviado por el cliente (fallback para cuando no hay env var)
  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'] || '';

  if (!apiKey) {
    res.status(401).json({
      error: {
        message: 'API key no encontrada. En Vercel: Settings → Environment Variables → agrega ANTHROPIC_API_KEY y haz Redeploy. En local: ingresa tu key en el botón ⚙ API de la app.'
      }
    });
    return;
  }

  const bodyStr = JSON.stringify(req.body);
  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }
  };

  return new Promise((resolve) => {
    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', c => data += c);
      proxyRes.on('end', () => {
        try {
          res.status(proxyRes.statusCode).json(JSON.parse(data));
        } catch (e) {
          res.status(500).json({ error: { message: 'Error leyendo respuesta: ' + data.slice(0, 100) } });
        }
        resolve();
      });
    });
    proxyReq.on('error', (e) => {
      res.status(502).json({ error: { message: 'Error conectando con Anthropic: ' + e.message } });
      resolve();
    });
    proxyReq.write(bodyStr);
    proxyReq.end();
  });
};
