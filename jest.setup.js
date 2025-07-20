import "@testing-library/jest-dom";

// Mock TextEncoder/TextDecoder first
if (typeof TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add web streams polyfill for Node.js
if (!global.ReadableStream) {
  global.ReadableStream = require("stream/web").ReadableStream;
  global.WritableStream = require("stream/web").WritableStream;
  global.TransformStream = require("stream/web").TransformStream;
}

// Use Node.js built-in fetch if available (Node 18+), otherwise use a polyfill
if (!global.fetch) {
  const nodeFetch = require("node-fetch");
  global.fetch = nodeFetch.default || nodeFetch;
  global.Headers = nodeFetch.Headers;
  global.Request = nodeFetch.Request;
  global.Response = nodeFetch.Response;
}

// Mock BroadcastChannel
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
  }

  postMessage(message) {
    if (this.onmessage) {
      this.onmessage({ data: message });
    }
  }

  close() {}
};

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress React 18 console errors/warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    /Warning.*not wrapped in act/i.test(args[0]) ||
    /Warning: ReactDOM.render is no longer supported/i.test(args[0])
  ) {
    return;
  }
  originalConsoleError(...args);
};
