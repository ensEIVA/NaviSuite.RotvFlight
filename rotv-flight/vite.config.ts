import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'


// https://vite.dev/config/
  export default defineConfig({
    plugins: [react()],
    server: {
      historyApiFallback: true,
    },
    resolve: {
      alias: {
        "@obr": "@ocean-industries-concept-lab/openbridge-webcomponents-react",
        "@obc": "@ocean-industries-concept-lab/openbridge-webcomponents/dist",
        "@": path.resolve(__dirname, "./src"),
      }
    },
    build: {
      sourcemap: true,
    },
  })