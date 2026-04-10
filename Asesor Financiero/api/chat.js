const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }

  // Trim para evitar espacios accidentales en la variable de entorno
  const envKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  const headerKey = (req.headers['x-api-key'] || '').trim();
  const apiKey = envKey || headerKey;

  if (!apiKey) {
    res.status(401).json({
      error: { message: 'API key no encontrada. Ve a Vercel → Settings → Environment Variables → agrega ANTHROPIC_API_KEY con tu key sk-ant-... → guarda → haz Redeploy.' }
    });
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    res.status(401).json({
      error: { message: `API key inválida — no empieza con sk-. Valor recibido: "${apiKey.substring(0,8)}..." Verifica que copiaste la key completa en Vercel.` }
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
    const pr = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', c => data += c);
      proxyRes.on('end', () => {
        try { res.status(proxyRes.statusCode).json(JSON.parse(data)); }
        catch (e) { res.status(500).json({ error: { message: 'Error leyendo respuesta Anthropic: ' + data.slice(0,200) } }); }
        resolve();
      });
    });
    pr.on('error', (e) => {
      res.status(502).json({ error: { message: 'No se pudo conectar con Anthropic: ' + e.message } });
      resolve();
    });
    pr.write(bodyStr);
    pr.end();
  });
};
