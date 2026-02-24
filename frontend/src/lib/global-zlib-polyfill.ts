/**
 * Set global zlib stub before any other code runs.
 * dicom-parser UMD uses globalThis.zlib (e.g. window.zlib); without it we get
 * "Cannot read properties of undefined (reading 'zlib')".
 */
import zlibStub from './zlib-stub';

if (typeof globalThis !== 'undefined') {
  (globalThis as Record<string, unknown>).zlib = zlibStub;
}
