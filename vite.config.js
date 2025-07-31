import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/chess-game/', // Aggiungi questa riga
  server: {
    port: 8080,
    open: true
  }
})