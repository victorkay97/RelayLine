import { build } from 'vite';
import { copyFile } from 'node:fs/promises';
await build({ configFile: 'vite.reader.config.mjs' });
await copyFile('dist-reader/recover.html', 'dist-reader/index.html');
console.log('Independent read-only site created: dist-reader/index.html + recover.html');
