import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import veauryVitePlugins from 'veaury/vite/esm/index.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    ...veauryVitePlugins({
      type: 'react',  // Host-Framework ist React
    }),
    tailwindcss()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['kaeee.de', 'wild.kaeee.de']
  }
})
