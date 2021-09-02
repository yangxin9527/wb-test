import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
const autoPublic = require('./myPlugin.js')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), autoPublic()],
  base: './',
  // publicDir: false,
  build: {
    sourcemap: false,
    brotliSize: false
  },
})

