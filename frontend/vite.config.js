import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward all API calls to the gateway during development.
    // In production the frontend is served statically and Nginx/the gateway
    // handles routing, so this proxy is dev-only.
    proxy: {
      '/auth': { target: 'http://localhost:8080', changeOrigin: true },
      '/audit': { target: 'http://localhost:8080', changeOrigin: true },
      '/analytics': { target: 'http://localhost:8080', changeOrigin: true },
      '/agent': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // selfHandleResponse prevents http-proxy from buffering/piping the
        // response itself — we take full control in the proxyRes handler.
        selfHandleResponse: true,
        configure(proxy) {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
          });
          proxy.on('error', (_err, _req, res) => {
            res.writeHead(502);
            res.end();
          });
        },
      },
    },
  },
})
