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

// Setup proper fetch polyfills for Node.js environment
if (!global.fetch) {
  const { Readable } = require('stream');
  
  // Simple Headers implementation that MSW can work with
  global.Headers = class Headers {
    constructor(init = {}) {
      this.headers = new Map();
      if (init) {
        if (init instanceof Headers) {
          for (const [key, value] of init.headers) {  
            this.headers.set(key.toLowerCase(), value);
          }
        } else if (Array.isArray(init)) {
          for (const [key, value] of init) {
            this.headers.set(key.toLowerCase(), value);
          }
        } else if (typeof init === 'object') {
          for (const [key, value] of Object.entries(init)) {
            this.headers.set(key.toLowerCase(), value);
          }
        }
      }
    }
    
    append(name, value) {
      const existing = this.headers.get(name.toLowerCase());
      this.headers.set(name.toLowerCase(), existing ? `${existing}, ${value}` : value);
    }
    
    delete(name) {
      this.headers.delete(name.toLowerCase());
    }
    
    get(name) {
      return this.headers.get(name.toLowerCase()) || null;
    }
    
    has(name) {
      return this.headers.has(name.toLowerCase());
    }
    
    set(name, value) {
      this.headers.set(name.toLowerCase(), value);
    }
    
    forEach(callback) {
      this.headers.forEach((value, key) => callback(value, key, this));
    }
    
    *[Symbol.iterator]() {
      for (const [key, value] of this.headers) {
        yield [key, value];
      }
    }
    
    entries() {
      return this.headers.entries();
    }
    
    keys() {
      return this.headers.keys();
    }
    
    values() {
      return this.headers.values();
    }
  };

  // Simple Request implementation
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body || null;
      this.credentials = init.credentials || 'same-origin';
      this.cache = init.cache || 'default';
      this.redirect = init.redirect || 'follow';
      this.referrer = init.referrer || '';
      this.referrerPolicy = init.referrerPolicy || '';
      this.integrity = init.integrity || '';
      this.keepalive = init.keepalive || false;
      this.signal = init.signal || null;
    }
    
    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
        credentials: this.credentials,
        cache: this.cache,
        redirect: this.redirect,
        referrer: this.referrer,
        referrerPolicy: this.referrerPolicy,
        integrity: this.integrity,
        keepalive: this.keepalive,
        signal: this.signal
      });
    }
  };

  // Simple Response implementation
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
      this.url = init.url || '';
      this.redirected = init.redirected || false;
      this.type = init.type || 'basic';
    }
    
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
    
    async arrayBuffer() {
      const text = await this.text();
      return new TextEncoder().encode(text).buffer;
    }
    
    async blob() {
      const text = await this.text();
      return new Blob([text]);
    }
    
    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
        url: this.url,
        redirected: this.redirected,
        type: this.type
      });
    }
  };

  // Simple fetch implementation
  global.fetch = jest.fn(() =>
    Promise.resolve(new Response('{}', { status: 200 }))
  );
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
