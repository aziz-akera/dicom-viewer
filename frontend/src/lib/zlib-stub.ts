/**
 * Browser stub for Node's zlib.
 * - Axios http adapter imports zlib (needs constants, createBrotliDecompress, createUnzip).
 * - dicom-parser UMD expects globalThis.zlib and may access .zlib.inflateRawSync (Node path; in browser it uses pako).
 */
const Z_SYNC_FLUSH = 2;
const BROTLI_OPERATION_FLUSH = 2;

const stub = {
  constants: {
    Z_SYNC_FLUSH,
    BROTLI_OPERATION_FLUSH,
  },
  createBrotliDecompress: () => {},
  createUnzip: () => {},
  // dicom-parser UMD can read r.zlib; provide a no-op so the bundle doesn't throw
  zlib: {
    inflateRawSync: (_buf: unknown) => new Uint8Array(0),
  },
};

export default stub;
