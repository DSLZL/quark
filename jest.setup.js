// jest.setup.js
import 'whatwg-fetch'; // Polyfill for fetch

// Polyfill for structuredClone
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}