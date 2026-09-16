import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';

function googleTimePlugin(): Plugin {
  return {
    name: 'google-time-sync',
    configureServer(server) {
      server.middlewares.use('/api/google-time', async (req, res) => {
        const t0 = Date.now();
        let responded = false;

        const safeSend = (statusCode: number, data: any) => {
          if (responded || res.headersSent) return;
          responded = true;
          res.writeHead(statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          });
          res.end(JSON.stringify(data));
        };

        try {
          const https = await import('https');
          const request = https.get('https://time.google.com', (timeRes) => {
            const t1 = Date.now();
            const dateHeader = timeRes.headers.date;
            const googleEpoch = dateHeader ? new Date(dateHeader).getTime() : t1;
            safeSend(200, {
              success: true,
              source: 'time.google.com',
              googleUtc: dateHeader,
              epochMs: googleEpoch,
              rttMs: t1 - t0,
              syncedAt: t1,
              timezone: 'Asia/Kolkata',
            });
          });

          request.on('error', (err) => {
            safeSend(200, {
              success: false,
              source: 'local-fallback',
              epochMs: Date.now(),
              error: err.message,
            });
          });

          request.setTimeout(3000, () => {
            request.destroy();
            safeSend(200, {
              success: false,
              source: 'timeout-fallback',
              epochMs: Date.now(),
            });
          });
        } catch (e: any) {
          safeSend(500, {
            success: false,
            source: 'error-fallback',
            epochMs: Date.now(),
            error: e?.message || 'Unknown error',
          });
        }
      });

      // Local Resend Email Dispatcher Middleware
      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          });
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const defaultKey = Buffer.from('cmVfTHcyUmdEQzFfRHRRSmFIZTJlNmlCYmJiTEQ4NzZXbThM', 'base64').toString('utf8');
              const activeKey = parsed.apiKey || process.env.VITE_RESEND_API_KEY || defaultKey;
              const sender = parsed.from || 'Madura House Maintenance <onboarding@resend.dev>';
              
              const https = await import('https');
              const payload = Buffer.from(JSON.stringify({
                from: sender,
                to: Array.isArray(parsed.to) ? parsed.to : [parsed.to],
                subject: parsed.subject || 'Madura House Maintenance Notice',
                html: parsed.html || '<p>Madura House Maintenance Notice</p>',
              }), 'utf8');

              const options = {
                hostname: 'api.resend.com',
                port: 443,
                path: '/emails',
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${activeKey}`,
                  'Content-Type': 'application/json',
                  'Content-Length': payload.length,
                }
              };

              const resendReq = https.request(options, (resendRes) => {
                let resData = '';
                resendRes.on('data', (c) => { resData += c; });
                resendRes.on('end', () => {
                  res.writeHead(resendRes.statusCode || 200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  });
                  res.end(resData);
                });
              });

              resendReq.on('error', (e) => {
                res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: e.message }));
              });

              resendReq.write(payload);
              resendReq.end();
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }

        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    googleTimePlugin(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: {},
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/resend': {
        target: 'https://api.resend.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/resend/, ''),
      },
    },
  },
});

