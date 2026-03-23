import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  noExternal: ['@sugarstack/shared'],
});
