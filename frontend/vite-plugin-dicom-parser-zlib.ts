/**
 * Vite plugin: fix dicom-parser UMD when run in ESM bundle.
 * In ESM, top-level `this` is undefined, so the UMD's }(this,function(r){...})
 * gets e=undefined and e.zlib throws. We (1) inject a zlib stub on global,
 * (2) replace }(this,function with }(globalRef,function so the UMD receives the global.
 */
import type { Plugin } from 'vite'

const ZLIB_STUB = `(function(){var g=typeof globalThis!=="undefined"?globalThis:typeof window!=="undefined"?window:typeof self!=="undefined"?self:{};var s={zlib:{inflateRawSync:function(){return new Uint8Array(0)}},constants:{Z_SYNC_FLUSH:2,BROTLI_OPERATION_FLUSH:2},createBrotliDecompress:function(){},createUnzip:function(){}};g.zlib=s;return g;})()`

// UMD calls }(this,function(r){...}) - in ESM "this" is undefined. Replace with global ref.
const UMD_THIS_REPLACE = /\}\(this,function\s*\(/g
const UMD_THIS_WITH_GLOBAL = `}(${ZLIB_STUB},function(`

export function dicomParserZlibPlugin(): Plugin {
  return {
    name: 'dicom-parser-zlib-stub',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('dicom-parser') || !id.includes('dicomParser.min.js')) return null
      // 1) Ensure UMD receives global (with zlib stub) instead of undefined `this`
      const fixed = code.replace(UMD_THIS_REPLACE, UMD_THIS_WITH_GLOBAL)
      if (fixed === code) return null
      return { code: fixed, map: null }
    },
  }
}
