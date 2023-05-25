import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'epub-reader',
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  // outExtension({ format }) {
  //   return {
  //     js: `.${format}.js`,
  //   }
  // },
  dts: true,
  minify: true,
  treeshake: true,
  splitting: true,
  external: [
    'esbuild',
  ],
})
