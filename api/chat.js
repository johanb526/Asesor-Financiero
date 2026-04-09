// api/chat.js — Vercel Serverless Function
// Actúa como proxy entre la app (navegador) y Anthropic API.
// El navegador NO puede llamar directamente a Anthropic por CORS.
// Esta función corre en el servidor de Vercel donde no hay restricción CORS.

const https = require('https');

module.exports = async (req, res) => {
  // 1. CORS — permitir llamadas desde cualquier origen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Solo se acepta POST' } });
    return;
  }

  // 2. La API key viene SIEMPRE de la variable de entorno de Vercel.
  //    El cliente nunca la necesita conocer ni enviarla.
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    res.status(500).json({
      error: {
        message: 'API key no configurada en Vercel. Ve a tu proyecto → Settings → Environment Variables → agrega ANTHROPIC_API_KEY'
      }
    });
    return;
  }

  // 3. Reenviar el body tal cual a Anthropic
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
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.status(proxyRes.statusCode).json(parsed);
        } catch (e) {
          res.status(500).json({ error: { message: 'Error leyendo respuesta de Anthropic: ' + data.substring(0, 200) } });
        }
        resolve();
      });
    });

    proxyReq.on('error', (err) => {
      res.status(502).json({ error: { message: 'No se pudo conectar con Anthropic: ' + err.message } });
      resolve();
    });

    proxyReq.write(bodyStr);
    proxyReq.end();
  });
};
