import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/users': 'http://localhost:9081',
      '/api/inventory': 'http://localhost:9082',
      '/api/payments': 'http://localhost:9083',
      '/api/orders': 'http://localhost:9080',
    }
  }
})
