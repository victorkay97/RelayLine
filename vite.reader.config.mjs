import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
// Reader-only artifact: NO publisher HTML or publisher signing JS in this deployment.
export default defineConfig({
  build: {
    outDir: 'dist-reader', emptyOutDir: true, target: 'es2022',
    rollupOptions: { input: { recover: resolve(root, 'recover.html') } }
  }
});
