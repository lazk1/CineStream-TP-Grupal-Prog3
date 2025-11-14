import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html'
        // Agrega otras páginas HTML si tienes
      }
    }
  },
  server: {
    port: 3000
  }
})
