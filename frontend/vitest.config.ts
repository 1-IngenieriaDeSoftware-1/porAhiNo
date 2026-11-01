import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Config ligera: solo utilidades puras (src/lib/*.test.ts), sin jsdom ni React.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/lib/**/*.test.ts'],
  },
});
