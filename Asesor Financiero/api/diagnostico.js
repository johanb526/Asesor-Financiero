// Endpoint de diagnóstico — visita /api/diagnostico en tu browser para verificar
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const envKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  res.status(200).json({
    key_configurada: envKey.length > 0,
    key_valida: envKey.startsWith('sk-'),
    key_preview: envKey.length > 0 ? envKey.substring(0, 12) + '...' : 'NO ENCONTRADA',
    node_env: process.env.NODE_ENV || 'no definido',
    timestamp: new Date().toISOString()
  });
};
