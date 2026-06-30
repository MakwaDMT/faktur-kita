import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    include: ['react-signature-canvas', 'prop-types'],
  },
  build: {
    commonjsOptions: {
      include: [/react-signature-canvas/, /prop-types/, /node_modules/],
    },
  },
})
