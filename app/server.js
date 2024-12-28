import fs from 'node:fs/promises';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sirv from 'sirv';
import compression from 'compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 4173;
const base = process.env.BASE || '/';

const isBot = (ua) => {
  const botPattern = /bot|spider|crawler|curl|httpie|insomnia|postman|wget|axios|fcbot/i;
  return botPattern.test(ua);
};

// Create http server
const app = express();

// Add Vite or respective production middlewares
let vite;
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
  });
  app.use(vite.middlewares);
} else {
  app.use(compression());
  app.use(
    sirv(path.resolve(__dirname, 'dist/client'), {
      dev: false,
      gzip: true,
      brotli: true,
      single: false,
      etag: true
    })
  );
}

// Handle all routes
app.get('*', async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  console.log(`Request from ${isBot(userAgent) ? 'Bot' : 'Browser'} - ${userAgent}`);

  try {
    if (isBot(userAgent)) {
      // Serve frame HTML for bots
      const appBaseUrl = `${req.protocol}://${req.get('host')}`;
      const appUrl = `${appBaseUrl}${req.originalUrl}`;

      const frame = {
        version: 'next',
        imageUrl: 'https://i.imgur.com/okcGTR2.png',
        button: {
          title: 'Open App',
          action: {
            type: 'launch_frame',
            name: 'Payflow',
            url: appUrl,
            splashImageUrl: 'https://app.payflow.me/apple-touch-icon.png',
            splashBackgroundColor: '#f7f7f7'
          }
        }
      };

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Payflow</title>
            <meta property="og:title" content="Payflow | App">
            <meta property="og:description" content="Onchain Social Payments">
            <meta property="og:image" content="https://i.imgur.com/okcGTR2.png">
            <meta property="fc:frame" content='${JSON.stringify(frame)}'>
            <meta property="fc:frame:image" content="https://i.imgur.com/okcGTR2.png">
            <meta property="fc:frame:button:1" content="Open App">
            <meta property="fc:frame:button:1:action" content="link">
            <meta property="fc:frame:button:1:target" content="${appUrl}">
          </head>
          <body>
            <h1>Payflow Frame</h1>
          </body>
        </html>
      `);
    } else {
      // In development, let Vite handle the request
      if (!isProduction && vite) {
        const url = req.originalUrl.replace(base, '');
        let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.send(template);
      } else {
        // In production, serve the built index.html
        res.sendFile(path.resolve(__dirname, 'dist/client/index.html'));
      }
    }
  } catch (e) {
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(e);
    }
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
