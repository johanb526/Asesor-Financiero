# Asesor Financiero Colombia 🇨🇴

App de asesoría financiera personal con IA para invertir desde Colombia.

## Archivos del proyecto

```
index.html          ← App principal (frontend)
server.js           ← Servidor proxy (resuelve CORS con Anthropic)
manifest.webmanifest← Configuración PWA para iPhone
icon-192.png        ← Ícono app 192x192
icon-512.png        ← Ícono app 512x512
package.json        ← Config Node.js
```

---

## OPCIÓN 1 — Ejecutar local en computador (más simple)

```bash
# En la carpeta del proyecto:
node server.js
# Abre http://localhost:3000 en tu navegador
```

---

## OPCIÓN 2 — Despliegue en Vercel (recomendado para iPhone)

### Paso 1: Subir a GitHub
1. Ve a github.com → New repository → nombre: `asesor-fin`
2. Sube todos los archivos (drag & drop en la web)

### Paso 2: Desplegar en Vercel
1. Ve a vercel.com → Sign up con tu cuenta de GitHub
2. "Add New Project" → selecciona tu repo `asesor-fin`
3. En "Build & Output Settings" → deja todo por defecto
4. Clic en **Deploy**

### Paso 3: Configurar API key en Vercel (para que IA funcione sin que el usuario ponga la key)
1. En tu proyecto Vercel → Settings → Environment Variables
2. Agrega: `ANTHROPIC_API_KEY` = `sk-ant-api03-TU-KEY-AQUI`
3. Redeploy

> ⚠️ Si NO configuras la variable de entorno, cada usuario deberá poner su propia API key al abrir la app (el overlay de configuración).

### Paso 4: Configurar server.js para Vercel
Crea un archivo `vercel.json` en la raíz:
```json
{
  "rewrites": [
    { "source": "/api/chat", "destination": "/api/chat" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Y crea la carpeta `api/` con el archivo `api/chat.js`:
```js
// api/chat.js — Serverless function para Vercel
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
  const body = JSON.stringify(req.body);

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }
  };

  const proxyReq = https.request(options, proxyRes => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).json(JSON.parse(data));
    });
  });
  proxyReq.on('error', err => res.status(500).json({ error: err.message }));
  proxyReq.write(body);
  proxyReq.end();
};
```

---

## OPCIÓN 3 — Netlify Drop (30 segundos, más fácil)

1. Ve a **app.netlify.com/drop**
2. Arrastra TODOS los archivos a la zona de drop
3. En segundos tienes una URL como `https://amazing-app-123.netlify.app`

Para la IA funcione con Netlify también necesitas configurar el proxy. La opción más simple con Netlify es que cada usuario ingrese su propia API key desde la app.

---

## Instalar en iPhone 17 Pro Max como app nativa

1. Abre la URL de tu app desplegada en **Safari** (no Chrome)
2. Toca el botón de **compartir** (cuadrado con flecha hacia arriba)
3. Scroll hacia abajo → **"Añadir a pantalla de inicio"**
4. Cambia el nombre si quieres → **"Añadir"**
5. Listo — aparece en tu pantalla de inicio como app nativa con ícono verde

> La app recordará tu API key entre sesiones gracias a localStorage.

---

## Actualizar la app desde el iPhone

### Si usas Vercel + GitHub:
1. Instala **GitHub Mobile** en el iPhone (App Store)
2. Abre tu repo → edita `index.html` directamente
3. Haz commit → Vercel detecta el cambio y redespliega en ~60 segundos

### Si usas solo archivos locales:
1. Edita el HTML en tu computador
2. Sube de nuevo al repo de GitHub
3. Vercel redespliega automáticamente

---

## Obtener API Key de Anthropic (gratis para empezar)

1. Ve a **console.anthropic.com**
2. Crea una cuenta
3. Ve a **API Keys** → **Create Key**
4. Copia la key (comienza con `sk-ant-api03-`)
5. Los primeros **$5 USD de crédito son gratuitos** — suficiente para cientos de consultas

---

## Funcionalidades

- 📊 Dashboard con resumen financiero personalizado
- 📈 Top acciones BVC y Wall Street con señales de compra/venta
- 📄 Análisis de extractos PDF con categorización automática
- ✏️ Registro manual de gastos por categorías
- 📊 Gráfico donut de distribución de gastos
- 🤖 Asesor IA con búsqueda web en tiempo real
- 📱 PWA instalable en iPhone como app nativa
- 💾 Datos guardados localmente en el dispositivo
