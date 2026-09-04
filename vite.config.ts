import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { notBundle } from 'vite-plugin-electron/plugin'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: { plugins: [notBundle()] },
      },
      preload: { input: 'electron/preload.ts' },
    }),
  ],
})
