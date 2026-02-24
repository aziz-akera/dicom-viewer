import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { dicomParserZlibPlugin } from './vite-plugin-dicom-parser-zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [dicomParserZlibPlugin(), react()],
  resolve: {
    alias: {
      // Axios loads the Node http adapter (which imports zlib) even in browser; stub it
      zlib: path.resolve(__dirname, 'src/lib/zlib-stub.ts'),
    },
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer (Cornerstone3D web workers)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader', 'dicom-parser'],
    // Pre-bundle codec packages so CJS/IIFE builds get a default export for ESM imports
    include: [
      '@cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs',
      '@cornerstonejs/codec-charls/decodewasmjs',
      '@cornerstonejs/codec-openjpeg/decodewasmjs',
      '@cornerstonejs/codec-openjph/wasmjs',
    ],
  },
  worker: {
    format: 'es',
  },
})
