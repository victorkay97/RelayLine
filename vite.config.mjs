import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        console: resolve(root, 'index.html'),
        recover: resolve(root, 'recover.html')
      }
    }
  }
});
