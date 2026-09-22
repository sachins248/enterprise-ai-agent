// The function that lets us write the Vite settings
import { defineConfig } from 'vite'
// The plugin that makes React (JSX) work in Vite
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Export the settings so Vite can read them
export default defineConfig({
  // Turn on the React plugin
  plugins: [react()],
  // Settings for the dev server (the one you run while building the app)
  server: {
    // Forward all API calls to the gateway during development.
    // In production the frontend is served statically and Nginx/the gateway
    // handles routing, so this proxy is dev-only.
    // Requests that start with these paths get sent to the gateway
    proxy: {
      // Login and register calls go to the gateway
      '/auth': { target: 'http://localhost:8080', changeOrigin: true },
      // Audit calls go to the gateway
      '/audit': { target: 'http://localhost:8080', changeOrigin: true },
      // Analytics calls go to the gateway
      '/analytics': { target: 'http://localhost:8080', changeOrigin: true },
      // Chat calls go to the gateway, with special handling so streaming works
      '/agent': {
        // Where to send the request
        target: 'http://localhost:8080',
        // Change the Host header so the gateway accepts the request
        changeOrigin: true,
        // selfHandleResponse prevents http-proxy from buffering/piping the
        // response itself — we take full control in the proxyRes handler.
        selfHandleResponse: true,
        // Extra setup for this proxy
        configure(proxy) {
          // Runs when the gateway starts answering
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Send the status code and headers to the browser right away
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            // Pass each piece of the answer to the browser as it arrives (this keeps the streaming smooth)
            proxyRes.pipe(res);
          });
          // Runs when the gateway can't be reached
          proxy.on('error', (_err, _req, res) => {
            // Tell the browser we got a bad gateway (502)
            res.writeHead(502);
            // Finish the response
            res.end();
          });
        },
      },
    },
  },
})
