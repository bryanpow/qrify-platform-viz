import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set for GitHub Pages project site; local `npm run dev` still works.
  base: process.env.GITHUB_PAGES === '1' ? '/qrify-platform-viz/' : '/',
})
