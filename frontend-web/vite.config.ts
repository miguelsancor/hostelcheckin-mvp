import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,          // Puerto personalizado
    host: true,          // Permite conexión externa
  },
  preview: {
    port: 5180,
    host: true,
  },
  base: '/',             // IMPORTANTE para que las rutas no fallen
})
