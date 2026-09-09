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

