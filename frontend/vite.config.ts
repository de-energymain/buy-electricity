import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Add polyfills for Node.js globals
    'process.env': {},
    'global': {},
    'process': {
      'env': {}
    }
  },
  resolve: {
    alias: {
      // Polyfills for Node.js built-in modules
      buffer: 'buffer',
      util: 'util'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  }
})